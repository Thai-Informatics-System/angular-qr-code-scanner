import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';
import { AngularQrCodeScannerComponent } from './angular-qr-code-scanner/angular-qr-code-scanner.component';

@NgModule({
  declarations: [
    AngularQrCodeScannerComponent
  ],
  providers: [],
  imports: [
    CommonModule,
    NgxScannerQrcodeComponent,
    MatTooltipModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  exports: [
    AngularQrCodeScannerComponent
  ]
})
export class AngularQrCodeScannerModule { }
