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
