import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AngularQrCodeScannerModule } from 'angular-qr-code-scanner';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-scan-qr',
  imports: [CommonModule, AngularQrCodeScannerModule, MatDialogModule, MatIconModule, MatToolbarModule, MatButtonModule],
  templateUrl: './scan-qr.component.html',
  styleUrl: './scan-qr.component.scss',
  standalone: true
})
export class ScanQrComponent implements OnInit {
  isMobilePreview = false;

  constructor(
    public dialogRef: MatDialogRef<ScanQrComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
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

  onCodeResult(qrResultString: any) {
    if(this.data?.config?.isValidate){
      if (qrResultString.startsWith('S:')) {
        console.log('New QR Code with less data. FORMAT:  S:3_CHAR_ENTITY_NAME:ORG_ID:ID_OF_ENTITY');
        let [x, entityName, orgId, entityId, documentNumber] = qrResultString.split(':');
        console.log('QR Splits:', x, entityName, orgId, entityId);
        let scannedData = {
          type: entityName,
          oid: parseInt(orgId),
          id: parseInt(entityId),
          documentNumber: documentNumber
        }

        console.log('onCodeResult 1 :: scannedData', scannedData);
        if(!this.data?.config?.isContinuousMode){
          this.dialogRef.close(scannedData);
          return;
        }
      }
      else if(this.isJSONString(qrResultString)) {
        try {
          console.log('onCodeResult 2 :: VALID JSON', this.isJSONString(qrResultString), qrResultString);
          let scannedData = JSON.parse(qrResultString);
          if(scannedData){
            console.log('onCodeResult 3 :: scannedData', scannedData);
            console.log('onCodeResult 4 :: scannedData', scannedData?.qn, scannedData?.qn?.startsWith('SM'));

            if(scannedData?.qn?.startsWith('SM')) {
              let [a, type, _] = scannedData.qn.split(':');
              scannedData.m = type;
              scannedData.a = a;
            }
            if(scannedData?.a == 'SM') {
              let dataToEmit = {
                type: scannedData?.m,
                oid: parseInt(scannedData?.o || scannedData?.oid),
                id: parseInt(scannedData?.id),
                documentNumber: scannedData?.documentNumber ?? null,
                qn: scannedData?.qn ?? null
              };
              if(!this.data?.config?.isContinuousMode){
                this.dialogRef.close(dataToEmit);
                return;
              }
              console.log('onCodeResult 5 :: scannedData', dataToEmit);
            }
            else{
              let errorText = 'This Qr Code is not belong to this project.';
              this.snackBar.open(errorText, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
            }
          }
          else{
            let errorText = 'Please scan valid QR Code.';
            this.snackBar.open(errorText, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
          }
        } catch (error) {
          let errorText = 'Invalid QR Code.';
          this.snackBar.open(errorText, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      } else {
        if(!this.data?.config?.isContinuousMode){
          this.dialogRef.close(qrResultString);
          return;
        }
      }
    }
    else{
      if(!this.data?.config?.isContinuousMode){
        this.dialogRef.close(qrResultString);
        return;
      }
    }
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

  onChangeMode(isContinuousMode: boolean) {
    console.log('onChangeMode:', isContinuousMode);
    this.data.config.isContinuousMode = isContinuousMode;
    this.data.config.isPauseAfterScan = isContinuousMode;
  }

}
