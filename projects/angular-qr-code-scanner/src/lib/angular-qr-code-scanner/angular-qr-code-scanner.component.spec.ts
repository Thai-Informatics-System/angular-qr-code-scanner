import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxScannerQrcodeService } from 'ngx-scanner-qrcode';
import { of } from 'rxjs';

import { AngularQrCodeScannerComponent } from './angular-qr-code-scanner.component';

const mockBreakpointObserver = {
  observe: () => of({ matches: false, breakpoints: {} }),
};

describe('AngularQrCodeScannerComponent', () => {
  let component: AngularQrCodeScannerComponent;
  let fixture: ComponentFixture<AngularQrCodeScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AngularQrCodeScannerComponent],
      providers: [
        { provide: NgxScannerQrcodeService, useValue: {} },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularQrCodeScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
