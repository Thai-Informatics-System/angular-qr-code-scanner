export interface AngularQrCodeScannerConfig {
  /** Pause the scanner automatically after a successful scan. Default: true */
  isPauseAfterScan: boolean;
  /** Show the camera-switch / mode toggle button. Default: true */
  isEnableMode: boolean;
  /** Validate the scanned QR payload before emitting. Default: false */
  isValidate?: boolean;
  /** Allow continuous scanning without manual resume. Default: false */
  isContinuousMode?: boolean;
  /**
   * Controls scanner play/pause state. `false` resumes scanning, `true` pauses it.
   * Pass a new config object reference when toggling. Default: false
   */
  playPause?: boolean;
}

/**
 * One scanner icon, rendered with `<mat-icon>`:
 * - a Material icon ligature name, e.g. `'flash_on'`;
 * - `{ name, fontSet }` for a ligature from another font set, e.g.
 *   `{ name: 'flash_on', fontSet: 'material-symbols-outlined' }`;
 * - `{ fontIcon, fontSet }` for a class-based icon font, e.g. `{ fontSet: 'fa', fontIcon: 'fa-bolt' }`;
 * - `{ svgIcon }` for an SVG registered with `MatIconRegistry`, e.g. `{ svgIcon: 'app:flash-on' }`.
 */
export type AngularQrCodeScannerIcon =
  | string
  | { name?: string; svgIcon?: string; fontSet?: string; fontIcon?: string };

/** Icons of the scanner controls. Leave a key out to keep its default. */
export interface AngularQrCodeScannerIcons {
  /** Switch camera (front / back). Default: `'cameraswitch'` */
  switchCamera?: AngularQrCodeScannerIcon;
  /** Flash button while the flash is on. Default: `'flash_on'` */
  flashOn?: AngularQrCodeScannerIcon;
  /** Flash button while the flash is off. Default: `'flash_off'` */
  flashOff?: AngularQrCodeScannerIcon;
  /** Resume scanning, shown while the scanner is paused. Default: `'restart_alt'` */
  resume?: AngularQrCodeScannerIcon;
  /** Mode button while continuous mode is on. Default: `'repeat'` */
  continuousMode?: AngularQrCodeScannerIcon;
  /** Mode button while single-scan mode is on. Default: `'repeat_one'` */
  singleMode?: AngularQrCodeScannerIcon;
  /** Shown on the "Camera Access Required" overlay. Default: `'videocam_off'` */
  cameraError?: AngularQrCodeScannerIcon;
}

/** The default icons (Material Icons ligatures). */
export const DEFAULT_QR_CODE_SCANNER_ICONS: Readonly<Required<AngularQrCodeScannerIcons>> = {
  switchCamera: 'cameraswitch',
  flashOn: 'flash_on',
  flashOff: 'flash_off',
  resume: 'restart_alt',
  continuousMode: 'repeat',
  singleMode: 'repeat_one',
  cameraError: 'videocam_off',
};

/** An icon normalised for rendering. */
export interface AngularQrCodeScannerResolvedIcon {
  name: string;
  svgIcon: string;
  fontSet: string;
  fontIcon: string;
}
