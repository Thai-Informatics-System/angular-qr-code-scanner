# angular-qr-code-scanner

[![npm version](https://img.shields.io/npm/v/angular-qr-code-scanner.svg)](https://www.npmjs.com/package/angular-qr-code-scanner)
[![npm downloads](https://img.shields.io/npm/dm/angular-qr-code-scanner.svg)](https://www.npmjs.com/package/angular-qr-code-scanner)
[![CI](https://github.com/Thai-Informatics-System/angular-qr-code-scanner/actions/workflows/bump-version.yml/badge.svg)](https://github.com/Thai-Informatics-System/angular-qr-code-scanner/actions/workflows/bump-version.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-19%2B-dd0031.svg)](https://angular.dev)

A lightweight Angular library for scanning QR codes using the device camera. Drop in one component and get instant QR scanning with iOS recovery, torch control, back-camera auto-selection, and continuous-scan mode — all backed by Angular Material UI.

Built on top of [`ngx-scanner-qrcode`](https://www.npmjs.com/package/ngx-scanner-qrcode).

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage in a Standalone Component](#usage-in-a-standalone-component)
- [Usage inside a Material Dialog](#usage-inside-a-material-dialog)
- [API Reference](#api-reference)
- [Config Options](#config-options)
- [Programmatic Resume](#programmatic-resume)
- [Camera Permissions](#camera-permissions)
- [Browser Support](#browser-support)
- [Styling](#styling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

---

## Features

- **One-component drop-in** — `<angular-qr-code-scanner>` handles everything
- **Single-shot and continuous scan modes** with a built-in toggle
- **iOS Safari black-frame recovery** — auto-recreates the `<video>` element on first load
- **Torch (flashlight) toggle** where the browser/device supports it
- **Automatic back-camera selection** across multi-camera devices
- **Camera-switch button** to cycle through available cameras
- **Programmatic resume** — pass a new config with `playPause: true` to restart after a pause
- **Angular Material UI** — no extra CSS framework required
- **Strict TypeScript** with exported interfaces for full type safety

---

## Requirements

| Dependency          | Version              |
| ------------------- | -------------------- |
| Angular             | 19+                  |
| `@angular/material` | 19+                  |
| `@angular/cdk`      | 19+                  |
| `ngx-scanner-qrcode` | ^1.7.6             |
| Browser             | Modern browser with `getUserMedia` support |

---

## Installation

```bash
npm install angular-qr-code-scanner
```

Install peer dependencies if not already present:

```bash
npm install @angular/material @angular/cdk ngx-scanner-qrcode
```

---

## Quick Start

**1. Import the module**

```typescript
// app.module.ts (NgModule)
import { AngularQrCodeScannerModule } from 'angular-qr-code-scanner';

@NgModule({
  imports: [AngularQrCodeScannerModule]
})
export class AppModule {}
```

**2. Add the component to your template**

```html
<angular-qr-code-scanner
  [config]="config"
  (onScanned)="onScanned($event)"
  (onChangeMode)="onChangeMode($event)">
</angular-qr-code-scanner>
```

**3. Wire up the component**

```typescript
import { AngularQrCodeScannerConfig } from 'angular-qr-code-scanner';

export class AppComponent {
  config: AngularQrCodeScannerConfig = {
    isPauseAfterScan: true,
    isEnableMode: true,
    isValidate: false,
    isContinuousMode: false,
  };

  onScanned(result: string): void {
    console.log('QR value:', result);
  }

  onChangeMode(isContinuousMode: boolean): void {
    this.config = { ...this.config, isContinuousMode };
  }
}
```

---

## Usage in a Standalone Component

```typescript
import { Component } from '@angular/core';
import { AngularQrCodeScannerModule, AngularQrCodeScannerConfig } from 'angular-qr-code-scanner';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [AngularQrCodeScannerModule],
  template: `
    <angular-qr-code-scanner
      [config]="config"
      (onScanned)="onScanned($event)"
      (onChangeMode)="onChangeMode($event)">
    </angular-qr-code-scanner>

    <p *ngIf="result">Last scan: {{ result }}</p>
  `
})
export class ScannerComponent {
  result = '';

  config: AngularQrCodeScannerConfig = {
    isPauseAfterScan: true,
    isEnableMode: true,
    isContinuousMode: false,
  };

  onScanned(value: string): void {
    this.result = value;
  }

  onChangeMode(isContinuousMode: boolean): void {
    this.config = { ...this.config, isContinuousMode };
  }
}
```

---

## Usage inside a Material Dialog

Open the scanner inside a `MatDialog` and close it with the decoded value:

**Dialog component:**

```typescript
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularQrCodeScannerModule, AngularQrCodeScannerConfig } from 'angular-qr-code-scanner';

export interface ScanDialogData {
  label?: string;
  config?: AngularQrCodeScannerConfig;
}

@Component({
  selector: 'app-scan-dialog',
  standalone: true,
  imports: [AngularQrCodeScannerModule],
  template: `
    <h2 mat-dialog-title>{{ data.label ?? 'Scan QR Code' }}</h2>
    <mat-dialog-content>
      <angular-qr-code-scanner
        [config]="config"
        (onScanned)="onScanned($event)">
      </angular-qr-code-scanner>
    </mat-dialog-content>
  `
})
export class ScanDialogComponent {
  config: AngularQrCodeScannerConfig;

  constructor(
    private dialogRef: MatDialogRef<ScanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScanDialogData
  ) {
    this.config = data.config ?? { isPauseAfterScan: true, isEnableMode: true };
  }

  onScanned(result: string): void {
    this.dialogRef.close(result);
  }
}
```

**Opener:**

```typescript
import { MatDialog } from '@angular/material/dialog';
import { ScanDialogComponent } from './scan-dialog.component';

@Component({ ... })
export class AppComponent {
  constructor(private dialog: MatDialog) {}

  openScanner(): void {
    this.dialog.open(ScanDialogComponent, {
      width: '400px',
      data: { label: 'Scan your ticket', config: { isPauseAfterScan: true } },
    }).afterClosed().subscribe((result?: string) => {
      if (result) console.log('Scanned:', result);
    });
  }
}
```

---

## API Reference

### Inputs

| Input    | Type                         | Required | Description                       |
| -------- | ---------------------------- | -------- | --------------------------------- |
| `config` | `AngularQrCodeScannerConfig` | Yes      | Scanner behaviour configuration.  |

### Outputs

| Output         | Payload type | Description                                                  |
| -------------- | ------------ | ------------------------------------------------------------ |
| `onScanned`    | `string`     | Emits the decoded QR string on every successful scan.        |
| `onChangeMode` | `boolean`    | Emits the new `isContinuousMode` state when the user toggles.|

---

## Config Options

```typescript
export interface AngularQrCodeScannerConfig {
  isPauseAfterScan: boolean;  // Pause automatically after a successful scan. Default: true
  isEnableMode: boolean;      // Show the single-shot / continuous mode toggle. Default: true
  isValidate?: boolean;       // Validate the payload before emitting. Default: false
  isContinuousMode?: boolean; // Keep scanning without manual resume. Default: false
  playPause?: boolean;        // Pass true in a new config object to programmatically resume.
}
```

| Property           | Type      | Default | Description                                                                      |
| ------------------ | --------- | ------- | -------------------------------------------------------------------------------- |
| `isPauseAfterScan` | `boolean` | `true`  | Freeze the camera preview after a successful scan so the user can read the code. |
| `isEnableMode`     | `boolean` | `true`  | Show the toggle button that switches between single-shot and continuous modes.   |
| `isValidate`       | `boolean` | `false` | Run additional payload validation before emitting via `onScanned`.               |
| `isContinuousMode` | `boolean` | `false` | Keep scanning automatically without requiring a manual resume.                   |
| `playPause`        | `boolean` | `false` | Set to `true` in a **new object reference** to programmatically resume scanning. |

---

## Programmatic Resume

After a scan pauses the camera, pass a new config object with `playPause: true` to resume without user interaction:

```typescript
onScanned(result: string): void {
  this.result = result;
  doSomethingWith(result).then(() => {
    // Resume scanning
    this.config = { ...this.config, playPause: true };
  });
}
```

> **Important:** always spread into a new object — the component uses object-reference change detection to detect the trigger.

---

## Camera Permissions

The browser requests camera access when the scanner initialises. Camera access requires a **secure context**:

- **Production**: `https://your-domain.com`
- **Local dev**: `http://localhost` (treated as secure by browsers)

On **iOS Safari**, the component automatically:
1. Sets `muted` and `playsinline` on the underlying `<video>` element
2. Recreates the element once to work around the first-load black-frame issue

---

## Browser Support

| Browser         | Supported |
| --------------- | --------- |
| Chrome (desktop) | ✅        |
| Edge            | ✅        |
| Firefox         | ✅        |
| Safari (macOS)  | ✅        |
| Chrome (Android) | ✅       |
| Safari (iOS)    | ✅        |

> Camera access is gated on `https` in all modern browsers (except `localhost`).

---

## Styling

The scanner fills the width of its container. Constrain it with a wrapper:

```css
angular-qr-code-scanner {
  display: block;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}
```

The component uses Angular Material internally; make sure a Material theme is loaded in your application (e.g., `@angular/material/prebuilt-themes/azure-blue.css`).

---

## Troubleshooting

### Camera not opening

- Check that the user has granted camera permission in the browser.
- Confirm the page is served over `https` in production.
- Ensure no other tab or app is holding the camera.

### Black screen on iOS Safari

The library handles this automatically via a one-time `<video>` element recreation. If you still see a black frame, confirm you are on iOS 14.3+ (minimum for `getUserMedia` on iOS Safari).

### QR code not detected

- Make sure the code is well-lit and fully in frame.
- Try the camera-switch button if the front camera is selected by default.
- Increase ambient light or reduce camera distance.

### Tests fail in CI

Karma tests need a real or headless Chrome. In GitHub Actions the runner includes Chrome; run tests with `--browsers=ChromeHeadless`.

---

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push the branch and open a Pull Request

Please open an issue before starting work on large changes so we can align on direction.

---

## Changelog

See [GitHub Releases](https://github.com/Thai-Informatics-System/angular-qr-code-scanner/releases) for the full change history.

---

## License

[MIT](https://opensource.org/licenses/MIT) © Thai Informatics System
