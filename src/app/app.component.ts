import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularQrCodeScannerModule } from '../../projects/angular-qr-code-scanner/src/public-api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AngularQrCodeScannerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-qr-code-scanner-project';
}
