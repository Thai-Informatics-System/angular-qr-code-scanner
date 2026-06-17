# Angular QR Code Scanner

A lightweight and easy-to-use Angular library for scanning QR codes using the device camera. Built on top of [`ngx-scanner-qrcode`](https://www.npmjs.com/package/ngx-scanner-qrcode) and Angular Material, with built-in iOS camera recovery, automatic camera switching, torch control, and continuous-scan mode.

## Features

* 📷 Scan QR codes using the device camera
* ⚡ Fast and lightweight
* 📱 Mobile and desktop browser support
* 🔄 Continuous or single-shot scanning, with programmatic resume
* 🔦 Torch (flashlight) toggle where supported
* 🔁 Automatic back-camera selection and camera switching
* 🍏 iOS Safari black-frame recovery built in
* 🎯 Scan-result event callbacks
* 🧩 Angular Material UI integration

---

## Installation

```bash
npm install angular-qr-code-scanner
```

This library has the following peer dependencies, which you must have installed in your app:

```bash
npm install @angular/common @angular/core ngx-scanner-qrcode
```

It also relies on Angular Material modules (`@angular/material`) and the Angular CDK (`@angular/cdk`) for its UI.

---

## Requirements

| Dependency        | Version          |
| ----------------- | ---------------- |
| Angular           | 19+              |
| @angular/material | 19+              |
| ngx-scanner-qrcode | ^1.7.6          |
| Browser           | Modern browser with camera support |

---

## Basic Usage

### Import the Module

The scanner is exposed as a declared component inside `AngularQrCodeScannerModule`. Import the module wherever you need the scanner (an `NgModule` or the `imports` array of a standalone component).

```typescript
import { AngularQrCodeScannerModule } from 'angular-qr-code-scanner';

@NgModule({
  imports: [
    AngularQrCodeScannerModule
  ]
})
export class AppModule {}
```

Standalone component:

```typescript
import { Component } from '@angular/core';
import { AngularQrCodeScannerModule } from 'angular-qr-code-scanner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AngularQrCodeScannerModule],
  templateUrl: './app.component.html'
})
export class AppComponent {}
```

---

### Template Example

```html
<angular-qr-code-scanner
  [config]="scannerConfig"
  (onScanned)="onScanned($event)"
  (onChangeMode)="onChangeMode($event)">
</angular-qr-code-scanner>
```

---

### Component Example

```typescript
import { AngularQrCodeScannerConfig } from 'angular-qr-code-scanner';

export class AppComponent {
  scannerConfig: AngularQrCodeScannerConfig = {
    isPauseAfterScan: true,
    isEnableMode: true,
    isValidate: false,
    isContinuousMode: false,
  };

  onScanned(result: string): void {
    console.log('QR Code Result:', result);
  }

  onChangeMode(isContinuousMode: boolean): void {
    console.log('Continuous mode:', isContinuousMode);
  }
}
```

---

## API Reference

### Inputs

| Input    | Type                          | Description                                  |
| -------- | ----------------------------- | -------------------------------------------- |
| `config` | `AngularQrCodeScannerConfig`  | Scanner behaviour configuration (see below). |

### `AngularQrCodeScannerConfig`

| Property            | Type      | Default | Description                                                                 |
| ------------------- | --------- | ------- | --------------------------------------------------------------------------- |
| `isPauseAfterScan`  | `boolean` | `true`  | Pause the scanner automatically after a successful scan.                    |
| `isEnableMode`      | `boolean` | `true`  | Show the single-shot / continuous mode toggle button.                       |
| `isValidate`        | `boolean` | `false` | Validate the scanned QR payload before emitting (optional).                 |
| `isContinuousMode`  | `boolean` | `false` | Keep scanning without requiring a manual resume (optional).                 |
| `playPause`         | `boolean` | `false` | Pass a new config object with `playPause: true` to programmatically resume. |

### Outputs

| Output         | Type                    | Description                                            |
| -------------- | ----------------------- | ------------------------------------------------------ |
| `onScanned`    | `EventEmitter<string>`  | Emits the decoded QR code value on a successful scan.  |
| `onChangeMode` | `EventEmitter<boolean>` | Emits the new continuous-mode state when it's toggled. |

---

## Camera Permissions

The browser requests camera access when the scanner starts. Most browsers require a secure context for camera access:

* Production: `https://your-domain.com`
* Local development: `http://localhost:4200` (treated as secure)

On iOS Safari, the underlying `<video>` element is automatically muted and marked `playsinline`, and a one-time element recreation is performed to work around the first-load black-frame issue.

---

## Browser Support

| Browser        | Supported |
| -------------- | --------- |
| Chrome         | ✅         |
| Edge           | ✅         |
| Firefox        | ✅         |
| Safari         | ✅         |
| Android Chrome | ✅         |
| iOS Safari     | ✅         |

---

## Styling

The scanner fills the width of its container. Constrain it with your own wrapper:

```css
angular-qr-code-scanner {
  width: 100%;
  display: block;
}
```

---

## Troubleshooting

### Camera Not Opening

* Camera permissions are granted
* HTTPS is enabled in production
* Camera is not in use by another application

### Scanner Not Detecting QR Codes

* QR code is clearly visible and well lit
* Camera focus is working properly
* Try the camera-switch button if multiple cameras are available

---

## Development

```bash
# Clone repository
git clone https://github.com/Thai-Informatics-System/angular-qr-code-scanner.git

# Install dependencies
npm install

# Build the library
ng build angular-qr-code-scanner

# Run the demo application
ng serve
```

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push the branch
5. Open a Pull Request

---

## License

MIT License
