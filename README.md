# Angular QR Code Scanner — Workspace

This is the development workspace for the [`angular-qr-code-scanner`](./projects/angular-qr-code-scanner/README.md) Angular library. It contains the publishable library and a demo application used to develop and test it.

> **Looking for usage docs?** — installation, API reference, and config options are in the
> **[library README](./projects/angular-qr-code-scanner/README.md)**.

---

## Repository structure

```
angular-qr-code-scanner/
├── .github/
│   └── workflows/
│       └── bump-version.yml     # CI/CD: test → bump → tag → publish
├── scripts/
│   └── bump-and-inject.mjs      # Semver bump script (patch / minor / none)
├── projects/
│   └── angular-qr-code-scanner/ # Publishable library
│       ├── src/lib/             # Component, module, models, service
│       └── README.md            # npm package README
├── src/                         # Demo application
│   └── app/
│       ├── app.component.*
│       └── scan-qr/             # Dialog-based scanner example
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Installation

```bash
npm install @servicemind.tis/angular-qr-code-scanner
```

Peer dependencies (if not already installed):

```bash
npm install @angular/material @angular/cdk ngx-scanner-qrcode
```

---

## Usage example

**Component (`*.component.ts`):**

```typescript
import { Component } from '@angular/core';
import { AngularQrCodeScannerModule, AngularQrCodeScannerConfig } from '@servicemind.tis/angular-qr-code-scanner';

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

  onScanned(result: string): void {
    this.scannedValue = result;
  }

  onChangeMode(isContinuousMode: boolean): void {
    this.config = { ...this.config, isContinuousMode, isPauseAfterScan: !isContinuousMode };
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
      if (result) console.log('Scanned:', result);
    });
  }
}
```

See the [library README](./projects/angular-qr-code-scanner/README.md#api-reference)
for the full `AngularQrCodeScannerConfig` options and output details.

---

## Getting started (development)

```bash
npm install
```

Run the demo app (live-reloads on changes):

```bash
ng serve
```

Open `http://localhost:4200/`.

---

## Working on the library

Build the library into `dist/angular-qr-code-scanner`:

```bash
ng build angular-qr-code-scanner
# or
npm run build-library
```

Rebuild on every change while developing:

```bash
npm run build-library-watch
```

---

## Running unit tests

Tests run in Chrome (or ChromeHeadless in CI):

```bash
# All tests (demo app)
ng test

# Library tests only
ng test angular-qr-code-scanner --watch=false
```

---

## CI / CD

Every push to `master` triggers the GitHub Actions workflow
[`.github/workflows/bump-version.yml`](./.github/workflows/bump-version.yml):

| Step | What it does |
| ---- | ------------ |
| **Test** | Runs library unit tests in ChromeHeadless |
| **Bump version** | Increments the patch version in both `package.json` files via `scripts/bump-and-inject.mjs` |
| **Verify sync** | Asserts root and library versions match |
| **Commit** | Pushes the version bump commit back to `master` with `[skip ci]` |
| **Tag** | Creates and pushes a `vX.Y.Z` git tag |
| **Build** | Builds the library with `ng-packagr` |
| **Publish** | Publishes to npm with OIDC provenance (no `NPM_TOKEN` needed) |

### Manual trigger

The workflow can also be triggered manually via **Actions → CI — Test, Bump Version, Tag and Publish → Run workflow**.

### Versioning

- Versions follow [Semantic Versioning](https://semver.org/).
- The `BUMP` env var in the workflow controls the increment: `patch` (default), `minor`, or `none`.
- Both `package.json` (workspace root) and `projects/angular-qr-code-scanner/package.json` are always kept in sync.

---

## Publishing manually

Build, then publish from the `dist` directory:

```bash
npm run build-library
npm publish ./dist/angular-qr-code-scanner --access public
```

---

## Styling (Tailwind CSS)

The demo app is configured with Tailwind CSS. Configuration lives in `tailwind.config.js`; the directives are declared in `src/styles.scss`. Use Tailwind utility classes directly in demo templates.

The published library itself does **not** depend on Tailwind.

---

## Additional resources

- [Angular CLI docs](https://angular.dev/tools/cli)
- [ng-packagr](https://github.com/ng-packagr/ng-packagr)
- [ngx-scanner-qrcode](https://www.npmjs.com/package/ngx-scanner-qrcode)
