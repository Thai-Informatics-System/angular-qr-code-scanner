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
   * Set to true to programmatically resume the scanner after a pause.
   * Pass a new config object reference with playPause: true to trigger play.
   * Default: false
   */
  playPause?: boolean;
}
