import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxScannerQrcodeService } from 'ngx-scanner-qrcode';
import { of } from 'rxjs';

import { AngularQrCodeScannerComponent } from './angular-qr-code-scanner.component';

describe('AngularQrCodeScannerComponent', () => {
  let component: AngularQrCodeScannerComponent;

  beforeEach(() => {
    const mockQrService = {} as NgxScannerQrcodeService;
    const mockBreakpoints = {
      observe: () => of({ matches: false, breakpoints: {} }),
    } as unknown as BreakpointObserver;
    const mockSnackBar = {
      open: jasmine.createSpy('open'),
    } as unknown as MatSnackBar;

    component = new AngularQrCodeScannerComponent(mockQrService, mockBreakpoints, mockSnackBar);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isPauseAfterScan true by default', () => {
    expect(component.config.isPauseAfterScan).toBeTrue();
  });

  it('should have isContinuousMode false by default', () => {
    expect(component.config.isContinuousMode).toBeFalse();
  });
});
