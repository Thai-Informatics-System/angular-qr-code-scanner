import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxScannerQrcodeComponent, NgxScannerQrcodeService, ScannerQRCodeConfig, ScannerQRCodeResult } from 'ngx-scanner-qrcode';
import { Observable, map, shareReplay } from 'rxjs';
import { AngularQrCodeScannerConfig } from '../angular-qr-code-scanner.models';

@Component({
  selector: 'angular-qr-code-scanner',
  standalone: false,
  templateUrl: './angular-qr-code-scanner.component.html',
  styleUrl: './angular-qr-code-scanner.component.css'
})
export class AngularQrCodeScannerComponent implements OnChanges {
  @Input() config: AngularQrCodeScannerConfig = {
    isPauseAfterScan: true,
    isEnableMode: true,
    isValidate: false,
    isContinuousMode: false,
    playPause: false,
  };
  public qrConfig: ScannerQRCodeConfig = {
    constraints: {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  };

  @Output() onScanned = new EventEmitter();
  @Output() onChangeMode = new EventEmitter();

  private _action!: NgxScannerQrcodeComponent;
  @ViewChild('action') set actionRef(cmp: NgxScannerQrcodeComponent) {
    // Fires on first creation and again whenever the scanner element is
    // recreated via the showScanner @if toggle. Re-run the start sequence on
    // the fresh instance so a recreated (non-black) video element comes up.
    if (cmp && cmp !== this._action) {
      this._action = cmp;
      this.initScanner();
    } else if (!cmp) {
      this._action = cmp;
    }
  }
  get action(): NgxScannerQrcodeComponent {
    return this._action;
  }

  public showScanner = true;
  public percentage = 80;
  public quality = 100;
  selectedIndex = 0;
  loadedCamera = false;
  error = false;
  errorText = '';
  isMobile = false;
  qrResultString = '';

  private cameraActive = false;
  private recovering = false;
  private videoListenersAttached = false;
  private startWatchdog: any;
  private autoSwitchAttempts = 0;
  private readonly maxAutoSwitchAttempts = 3;
  // Shared across instances for the lifetime of the page. iOS hands back a
  // black frame for the very first camera acquisition after a reload; once any
  // scanner instance has warmed it up, subsequent opens render correctly.
  private static cameraWarmedUp = false;

  isHandset$!: Observable<boolean>;

  constructor(
    private qrcode: NgxScannerQrcodeService,
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar,
  ) {
    this.isHandset$ = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {

    this.isHandset$.subscribe(r => {
      console.log('IS HANDSET:', r);
      this.isMobile = r;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      const prevPlayPause = changes['config'].previousValue?.playPause;
      const currPlayPause = changes['config'].currentValue?.playPause;
      if (currPlayPause !== prevPlayPause) {
        if (currPlayPause === false) {
          this.action?.play();
          this.prepareVideoForIos();
          this.tryPlayVideo();
        } else if (currPlayPause === true) {
          this.action?.pause();
        }
      }
    }
  }

  ngAfterViewInit() {
  }

  /**
   * (Re)initialises scanning on the current ngx-scanner instance. Called by the
   * ViewChild setter, so it runs both on first render and after the element is
   * recreated via the showScanner toggle (iOS black-frame recovery).
   */
  private initScanner(): void {
    // iOS (iPhone) requires the underlying <video> to be muted + playsinline
    // before play() is invoked, otherwise autoplay is blocked silently.
    this.prepareVideoForIos();
    this.action.isReady.subscribe((res: any) => {
      console.log('initScanner:', this.action?.devices?.value);
      this.cameraActive = false;
      this.autoSwitchAttempts = 0;
      this.prepareVideoForIos();
      this.handle(this.action, 'start');
      setTimeout(() => {
        this.loadedCamera = true;
      }, 500);

      // iOS hands back a black frame for the very first camera acquisition
      // after a page reload. Restarting the stream on the same element does not
      // help; only fully recreating the scanner element (like a manual
      // close/reopen) does. Trigger that once per page load.
      if (this.isIos() && !AngularQrCodeScannerComponent.cameraWarmedUp) {
        setTimeout(() => {
          if (!AngularQrCodeScannerComponent.cameraWarmedUp) {
            AngularQrCodeScannerComponent.cameraWarmedUp = true;
            this.recreateScanner();
          }
        }, 1200);
      }
    });
  }

  /**
   * iOS Safari/WebKit (iPhone in particular) blocks programmatic video
   * autoplay unless the element is muted and marked for inline playback.
   * The ngx-scanner-qrcode template only sets `playsinline`, so we harden the
   * element here. Without this the camera stream never starts on iPhone
   * (works on iPad because it reports a desktop UA with permissive autoplay).
   */
  private prepareVideoForIos(): void {
    const video: HTMLVideoElement | undefined = this.action?.video?.nativeElement;
    if (!video) {
      return;
    }
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', '');
    this.attachVideoListeners(video);
  }

  /**
   * Listen for the actual stream becoming visible. This is the single source of
   * truth for "the camera works" and lets us clear any stale error overlay even
   * when recovery/camera-switch happens behind the scenes.
   */
  private attachVideoListeners(video: HTMLVideoElement): void {
    if (this.videoListenersAttached) {
      return;
    }
    this.videoListenersAttached = true;
    const onActive = () => this.onCameraActive();
    video.addEventListener('playing', onActive);
    video.addEventListener('loadeddata', onActive);
  }

  private onCameraActive(): void {
    this.cameraActive = true;
    this.recovering = false;
    this.autoSwitchAttempts = 0;
    this.error = false;
    this.errorText = '';
    this.loadedCamera = true;
    clearTimeout(this.startWatchdog);
  }

  private isIos(): boolean {
    const ua = navigator.userAgent || '';
    const isIosDevice = /iPad|iPhone|iPod/.test(ua);
    const isIpadOs = /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
    return isIosDevice || isIpadOs;
  }

  /**
   * Destroy and recreate the scanner element, reproducing exactly what a manual
   * dialog close/reopen does. This is the only thing that reliably clears the
   * iOS first-load black frame, because iOS keeps a reused <video> element
   * stuck on the stale black frame even after re-acquiring the stream.
   * The new element triggers the ViewChild setter -> initScanner() again.
   */
  private recreateScanner(): void {
    clearTimeout(this.startWatchdog);
    this.cameraActive = false;
    this.recovering = false;
    this.autoSwitchAttempts = 0;
    this.loadedCamera = false;
    this.error = false;
    this.errorText = '';
    // New element will need its listeners re-attached.
    this.videoListenersAttached = false;
    try {
      this.action?.stop();
    } catch (e) {
      console.log('recreateScanner stop failed', e);
    }
    this.showScanner = false;
    // Let Angular destroy the element, then recreate it on the next tick.
    setTimeout(() => {
      this.showScanner = true;
    }, 200);
  }

  /**
   * Explicitly (re)start playback and swallow the autoplay rejection that the
   * library ignores, so we can recover the stream on iOS instead of failing
   * silently.
   */
  private tryPlayVideo(): void {
    const video: HTMLVideoElement | undefined = this.action?.video?.nativeElement;
    const playPromise = video?.play?.();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err: any) => {
        console.log('video.play() rejected', err);
      });
    }
  }

  /**
   * The library's start() acquires the camera twice (once for permission, once
   * for the real stream). The second acquisition can fail silently, leaving a
   * blank view. After start we wait briefly; if the stream never goes live we
   * try to recover by cycling through the available devices ourselves.
   */
  private armStartWatchdog(): void {
    clearTimeout(this.startWatchdog);
    this.startWatchdog = setTimeout(() => {
      if (!this.cameraActive && !this.error) {
        this.recoverCamera(0);
      }
    }, 1500);
  }

  private orderDevicesBackFirst(devices: any[]): any[] {
    const isBack = (d: any) => /back|rear|environment/i.test(d?.label || '');
    return [...devices.filter(isBack), ...devices.filter(d => !isBack(d))];
  }

  private recoverCamera(index: number): void {
    if (this.cameraActive) {
      this.recovering = false;
      return;
    }
    if (index === 0) {
      if (this.recovering) {
        return;
      }
      this.recovering = true;
    }

    const devices = this.action?.devices?.value || [];
    if (!devices.length) {
      this.recovering = false;
      this.showCameraError('No camera detected. Please connect a camera and reload the page.');
      return;
    }

    const ordered = this.orderDevicesBackFirst(devices);
    if (index >= ordered.length) {
      this.recovering = false;
      this.showCameraError();
      return;
    }

    const device = ordered[index];
    this.prepareVideoForIos();
    this.action.playDevice(device.deviceId).subscribe(
      () => {
        this.tryPlayVideo();
      },
      () => {
        this.recoverCamera(index + 1);
      }
    );
  }

  private isPermissionError(error: any): boolean {
    const name = error?.name || '';
    const msg = typeof error === 'string' ? error : (error?.message || '');
    return /NotAllowed|PermissionDenied|denied|permission/i.test(`${name} ${msg}`);
  }

  private showCameraError(message?: string): void {
    if (this.cameraActive) {
      return;
    }
    // Before surfacing the error, try switching the camera up to 3 times
    // (100ms apart). A successful switch fires the video 'playing' event which
    // clears everything via onCameraActive().
    if (this.autoSwitchAttempts < this.maxAutoSwitchAttempts) {
      this.autoSwitchAttempts++;
      console.log(
        `auto switching camera, attempt ${this.autoSwitchAttempts}/${this.maxAutoSwitchAttempts}`
      );
      setTimeout(() => {
        if (!this.cameraActive) {
          this.onDeviceSelectChange();
        }
      }, 100);
      return;
    }

    this.error = true;
    this.errorText = message || 'Camera access denied. Please enable camera permissions in your browser.';
    this.snackBar.open(this.errorText, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  onDeviceSelectChange() {
    this.loadedCamera = false;
    let availableDevices = this.action?.devices?.value;

    if (!availableDevices?.length) {
      this.showCameraError('No camera detected. Please connect a camera and reload the page.');
      return;
    }

    if(this.selectedIndex < (availableDevices?.length - 1)){
      this.selectedIndex++;
    }
    else{
      this.selectedIndex = 0;
    }

    let currentDeviceId = availableDevices[this.selectedIndex].deviceId;
    this.cameraActive = false;
    this.prepareVideoForIos();
    this.action.playDevice(currentDeviceId).subscribe(
      () => this.tryPlayVideo(),
      (error: any) => {
        console.log('playDevice failed on switch', error);
        // Keep the retry loop going (capped at maxAutoSwitchAttempts).
        this.showCameraError();
      }
    );
    setTimeout(() => {
      this.loadedCamera = true;
    }, 50);
  }

  isJSONString(str: string) {
    try {
      if(!isNaN(+str)) {
        return false;
      }
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  public onEvent(e: ScannerQRCodeResult[], action?: any): void {
    if(this.config?.isPauseAfterScan){
      e && action && action.pause();
      this.config.playPause = true;
    }
    console.log('onEvent:', e[0].value);
    this.qrResultString = e[0].value;
    if(this.qrResultString && this.qrResultString != ''){
      this.onScanned.emit(this.qrResultString);
    }
  }

  public handle(action: any, fn: string): void {
    const playDeviceFacingBack = (devices: any[]) => {
      // front camera or back camera check here!
      const device = devices.find(f => (/back|rear|environment/gi.test(f.label))); // Default Back Facing Camera
      action.playDevice(device ? device.deviceId : devices[0].deviceId);
    }

    if (fn === 'start') {
      action[fn](playDeviceFacingBack).subscribe(
        (r: any) => {
          console.log(fn, r);
          this.prepareVideoForIos();
          this.tryPlayVideo();
          // The real stream is attached asynchronously and can fail silently;
          // watch for it and recover by cycling devices if it never goes live.
          this.armStartWatchdog();
        },
        (error: any) => {
          console.error('Camera access error:', error);
          // Only surface the permission error immediately. Other failures
          // (e.g. NotReadableError from the double-acquire race) are often
          // recoverable by retrying on an available device.
          if (this.isPermissionError(error)) {
            this.showCameraError();
          } else {
            this.recoverCamera(0);
          }
        }
      );
    } else {
      action[fn]().subscribe(
        (r: any) => {
          console.log(fn, r);
          if (fn === 'play') {
            this.prepareVideoForIos();
            this.tryPlayVideo();
          }
        },
        (error: any) => {
          console.error('Scanner error:', error);
          this.snackBar.open('Scanner error occurred', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      );
    }
  }

  public onDownload(action: NgxScannerQrcodeComponent) {
    action.download().subscribe(console.log, alert);
  }

  onClickMode(){
    this.config.isContinuousMode = !this.config.isContinuousMode;
    this.config.isPauseAfterScan = this.config.isContinuousMode;
    this.onChangeMode.emit(this.config.isContinuousMode);
  }

  ngOnDestroy(): void {
      clearTimeout(this.startWatchdog);
      if(this.action) {
        this.action.stop();
      }
  }
}
