import { Component } from '@angular/core';
import { AngularQrCodeScannerConfig, AngularQrCodeScannerModule } from '../../projects/angular-qr-code-scanner/src/public-api';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [CommonModule, AngularQrCodeScannerModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isMobile$!: Observable<boolean>;
  isHandset = false;

  config: AngularQrCodeScannerConfig = {
    isValidate: true,
    isContinuousMode: true,
    playPause: false,
    isPauseAfterScan: true,
    isEnableMode: true,
  };

  scannedData: any = null;
  
  constructor(private dialog: MatDialog, private breakpointObserver: BreakpointObserver, private snackBar: MatSnackBar) {
    this.isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {
    this.isMobile$.subscribe(r => {
      console.log('IS HANDSET:', r);
      this.isHandset = r;
    });
  }

  qrScannerDialog() {
    let whData: any = {
      width: '430px',
      maxHeight: '90%',
      // height: '100%'
    }

    if (this.isHandset) {
      whData = {
        width: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        height: '100%'
      }
    }
    const dialogRef = this.dialog.open(ScanQrComponent, {
      ...whData,
      panelClass: ['tis-details-dialog', 'relative'],
      data: {
        isMobilePreview: this.isHandset,
        config: this.config
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('QR Code scanned:', result);
        this.scannedData = result;
        this.snackBar.open('QR Code scanned: ', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
      }
    });
  }
}
