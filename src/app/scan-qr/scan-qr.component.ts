import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AngularQrCodeScannerModule } from 'angular-qr-code-scanner';


@Component({
  selector: 'app-scan-qr',
  imports: [CommonModule, AngularQrCodeScannerModule, MatDialogModule, MatIconModule, MatToolbarModule],
  templateUrl: './scan-qr.component.html',
  styleUrl: './scan-qr.component.scss',
  standalone: true
})
export class ScanQrComponent implements OnInit {
  isMobilePreview = false;

  constructor(
    public dialogRef: MatDialogRef<ScanQrComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    console.log('data:', data);
  }

  ngOnInit(): void {
    if (this.data?.isMobilePreview) {
      this.isMobilePreview = this.data.isMobilePreview;
    }
  }

  ngAfterViewInit() {
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onCodeResult(scannedData: any) {
    this.dialogRef.close(scannedData);
  }

}
