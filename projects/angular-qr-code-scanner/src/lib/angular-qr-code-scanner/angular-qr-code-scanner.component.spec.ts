import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularQrCodeScannerComponent } from './angular-qr-code-scanner.component';

describe('AngularQrCodeScannerComponent', () => {
  let component: AngularQrCodeScannerComponent;
  let fixture: ComponentFixture<AngularQrCodeScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularQrCodeScannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AngularQrCodeScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
