import { TestBed } from '@angular/core/testing';

import { AngularQrCodeScannerService } from './angular-qr-code-scanner.service';

describe('AngularQrCodeScannerService', () => {
  let service: AngularQrCodeScannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularQrCodeScannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

