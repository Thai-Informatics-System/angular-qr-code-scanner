# Angular QR Code Scanner — Workspace

This is the development workspace for the [`angular-qr-code-scanner`](./projects/angular-qr-code-scanner/README.md) Angular library. It contains both the publishable library and a demo application used to develop and test it.

> Looking for the library usage docs (installation, API, config options)? See the
> **[library README](./projects/angular-qr-code-scanner/README.md)**.

---

## Repository structure

```
angular-qr-code-scanner-project/
├── projects/
│   └── angular-qr-code-scanner/   # the publishable library
│       ├── src/lib/               # scanner component, module, models, service
│       └── README.md              # library usage & API reference
├── src/                           # demo application that consumes the library
│   └── app/
│       ├── app.component.*
│       └── scan-qr/               # dialog-based scanner usage example
└── angular.json                   # build config for both app and library
```

---

## Getting started

Install dependencies:

```bash
npm install
```

Run the demo application (auto-reloads on changes):

```bash
ng serve
```

Then open `http://localhost:4200/`.

---

## Working on the library

Build the library into `dist/angular-qr-code-scanner`:

```bash
ng build angular-qr-code-scanner
```

Rebuild on every change while developing:

```bash
npm run build-library-watch
```

### Publishing

Once built, publish from the output directory:

```bash
cd dist/angular-qr-code-scanner
npm publish
```

---

## Usage example

Import `AngularQrCodeScannerModule`, drop the `<angular-qr-code-scanner>` element
in your template, and handle the `onScanned` / `onChangeMode` outputs.

**Component (`*.component.ts`):**

```typescript
import { Component } from '@angular/core';
import { AngularQrCodeScannerModule, AngularQrCodeScannerConfig } from 'angular-qr-code-scanner';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [AngularQrCodeScannerModule],
  templateUrl: './scan.component.html',
})
export class ScanComponent {
  scannedValue = '';

  config: AngularQrCodeScannerConfig = {
    isPauseAfterScan: true,   // stop after a successful scan
    isEnableMode: true,       // show the single-shot / continuous toggle
    isValidate: false,        // emit the raw scanned value
    isContinuousMode: false,  // single-shot scanning
  };

  // Fires with the decoded QR string on every successful scan.
  onScanned(result: string): void {
    this.scannedValue = result;
    console.log('QR Code Result:', result);
  }

  // Fires when the user toggles single-shot vs continuous scanning.
  onChangeMode(isContinuousMode: boolean): void {
    this.config.isContinuousMode = isContinuousMode;
    this.config.isPauseAfterScan = isContinuousMode;
  }
}
```

**Template (`*.component.html`):**

```html
<angular-qr-code-scanner
  [config]="config"
  (onScanned)="onScanned($event)"
  (onChangeMode)="onChangeMode($event)">
</angular-qr-code-scanner>

<p *ngIf="scannedValue">Scanned: {{ scannedValue }}</p>
```

### Using it inside a Material dialog

The demo app (`src/app/scan-qr/`) opens the scanner in a dialog and closes it
with the decoded value:

```typescript
import { MatDialog } from '@angular/material/dialog';
import { ScanQrComponent } from './scan-qr/scan-qr.component';

export class AppComponent {
  constructor(private dialog: MatDialog) {}

  openScanner(): void {
    const ref = this.dialog.open(ScanQrComponent, {
      data: {
        label: 'Scan QR Code',
        config: { isPauseAfterScan: true, isEnableMode: true, isValidate: true },
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Scanned:', result);
      }
    });
  }
}
```

See the [library README](./projects/angular-qr-code-scanner/README.md#api-reference)
for the full `AngularQrCodeScannerConfig` options and output details.

---

## Styling (Tailwind CSS)

The demo app is configured with Tailwind CSS. Configuration lives in
`tailwind.config.js`, and the `@tailwind base/components/utilities` directives are
declared in the global `src/styles.scss`. Use Tailwind utility classes directly in
templates.

---

## Running unit tests

```bash
ng test
```

---

## Additional Resources

For more on the Angular CLI, see the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
