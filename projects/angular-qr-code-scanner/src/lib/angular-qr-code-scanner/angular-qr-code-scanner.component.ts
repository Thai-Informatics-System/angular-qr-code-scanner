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
  // Facing mode currently requested; toggled by the switch button when the
  // device only enumerates a single camera.
  preferredFacing: 'environment' | 'user' = 'environment';
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

  private isBackCamera(device: any): boolean {
    return /back|rear|environment/i.test(device?.label || '');
  }

  private orderDevicesBackFirst(devices: any[]): any[] {
    return [...devices.filter(d => this.isBackCamera(d)), ...devices.filter(d => !this.isBackCamera(d))];
  }

  /**
   * Update the video constraints the scanner uses for its next getUserMedia.
   * Passing a facing mode keeps/sets `facingMode: { ideal }`; passing null
   * drops it so an explicit deviceId (which playDevice() only sets as an
   * ideal) is not out-voted by the facing mode when cycling devices.
   */
  private setFacingConstraint(facing: 'environment' | 'user' | null): void {
    const action: any = this.action;
    const { deviceId, facingMode, ...video } = action?.constraints?.video || {};
    action.constraints = {
      ...action.constraints,
      video: facing ? { ...video, facingMode: { ideal: facing } } : video,
    };
  }

  /**
   * Play a device id with the facing-mode constraint removed. Used when the
   * device list is trustworthy (labelled back camera / switching between
   * several enumerated devices).
   */
  private playDeviceById(deviceId: string, facing: 'environment' | 'user' | null = null) {
    this.setFacingConstraint(facing);
    return this.action.playDevice(deviceId);
  }

  /**
   * Open the stream by facing mode instead of a device id. Phones that report
   * a single camera or unhelpful labels (new iPhones, Xiaomi, ...) still pick
   * the right lens this way. ngx-scanner-qrcode only exposes deviceId based
   * playback, so we attach the stream ourselves and mirror what playDevice()
   * does afterwards (scan loop + status flags).
   */
  private playFacingMode(facing: 'environment' | 'user'): Promise<void> {
    const action: any = this.action;
    this.preferredFacing = facing;
    this.setFacingConstraint(facing);
    action.stop();
    action.STATUS?.loadingON?.();

    return navigator.mediaDevices
      .getUserMedia({ audio: false, video: action.constraints.video })
      .then((stream: MediaStream) => {
        const video: HTMLVideoElement = action.video.nativeElement;
        const activeId = stream.getVideoTracks()[0]?.getSettings?.().deviceId;
        const index = (action.devices?.value || []).findIndex((d: any) => d.deviceId === activeId);
        if (index >= 0) {
          action.deviceIndexActive = index;
        }
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          this.tryPlayVideo();
          action.requestAnimationFrame?.();
          action.STATUS?.startON?.();
          action.STATUS?.loadingOFF?.();
        };
      })
      .catch((error: any) => {
        action.STATUS?.startOFF?.();
        action.STATUS?.loadingOFF?.();
        throw error;
      });
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
    this.playDeviceById(device.deviceId).subscribe(
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

    this.cameraActive = false;
    this.prepareVideoForIos();

    // Only one camera enumerated: the phone may still have front + back lenses
    // behind it, so toggle the facing mode instead of cycling device ids.
    if (availableDevices.length === 1) {
      const nextFacing = this.preferredFacing === 'environment' ? 'user' : 'environment';
      this.playFacingMode(nextFacing).catch((error: any) => {
        console.log('facingMode switch failed', error);
        // Keep the retry loop going (capped at maxAutoSwitchAttempts).
        this.showCameraError();
      });
    } else {
      const ordered = this.orderDevicesBackFirst(availableDevices);
      this.selectedIndex = (this.selectedIndex + 1) % ordered.length;
      this.preferredFacing = this.isBackCamera(ordered[this.selectedIndex]) ? 'environment' : 'user';
      this.playDeviceById(ordered[this.selectedIndex].deviceId).subscribe(
        () => this.tryPlayVideo(),
        (error: any) => {
          console.log('playDevice failed on switch', error);
          // Keep the retry loop going (capped at maxAutoSwitchAttempts).
          this.showCameraError();
        }
      );
    }
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
      // Default to the back camera. Only trust a device id when there are
      // several cameras and one is clearly labelled as back-facing; otherwise
      // (empty/useless labels, single enumerated device) open by facingMode.
      const ordered = this.orderDevicesBackFirst(devices);
      this.selectedIndex = 0;
      this.preferredFacing = 'environment';
      if (devices.length > 1 && this.isBackCamera(ordered[0])) {
        this.playDeviceById(ordered[0].deviceId, 'environment');
      } else {
        this.playFacingMode('environment').catch((error: any) => {
          console.log('facingMode start failed', error);
          this.recoverCamera(0);
        });
      }
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
