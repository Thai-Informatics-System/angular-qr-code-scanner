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
