// ISKO kiosk settings. Edit the values below, save, and relaunch the kiosk.
window.ISKO = window.ISKO || {};
ISKO.kiosk = {
  onScreenKeyboard: true,    // built-in touch keyboard (turn off if the kiosk has a physical keyboard)
  directPrint: true,         // "Print" sends straight to the printer (the launcher adds --kiosk-printing)
  idleWarnSeconds: 60,       // inactivity before "Are you still there?" appears while signed in
  idleCountdownSeconds: 15,  // seconds to answer before the session is wiped
  loginIdleSeconds: 90,      // clears a half-filled sign-in form after this much inactivity
  keepHistory: false,        // false = a student's saved requests are erased at sign-out (safer on a shared screen)
  persistLogin: false,       // false = never stay signed in after a reload or restart
  lockdown: true,            // block right-click, zoom, reload / dev-tool shortcuts, text selection
  hideCursor: false          // set true for touch-only screens
};
