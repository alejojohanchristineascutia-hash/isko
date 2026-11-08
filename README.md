# ISKO · Kiosk edition

A touch-first, fullscreen version of the ISKO student document request app. It still runs offline with no install, build step, or server.

## What changed from the laptop version

| Area | Kiosk behaviour |
| --- | --- |
| Layout | Fixed-height screen with a top bar. The sidebar, breadcrumbs and footer are gone. **Back / Continue** stay pinned at the bottom of the screen, so no hunting for buttons. Works in landscape (1920×1080) and portrait (1080×1920) and scales with the screen. |
| Touch | All text is 16 px+ equivalent, buttons are 60 px+ tall, and cards are fully tappable. Dropdowns open a large tap-friendly picker instead of the tiny native list. |
| Typing | Built-in on-screen keyboard (auto-capitalises names, hold ⌫ to repeat). The Windows touch keyboard is suppressed. |
| Privacy | After 60 s of inactivity an "Are you still there?" prompt appears; after 15 more seconds the session is wiped. **Finish & sign out** clears the draft (saved requests are kept so they can be tracked; see `keepHistory`). Logins never survive a reload or restart. |
| Other documents | Choosing **Other document** skips payment and preview. After the details step, the student sees a "Please visit the Registrar" screen (what they asked for, plus what to do and bring). Nothing is printed or saved for these requests. |
| Printing | **Print** sends the document and claim stub straight to the default printer, with no dialog (the kiosk launcher adds `--kiosk-printing`). |
| Lockdown | Right-click, pinch zoom, text selection, drag, and reload / dev-tools / print-dialog shortcuts are blocked. |

## Run it

1. Set the printer you want as the **Windows default printer**.
2. Double-click **Launch ISKO Kiosk.cmd**. ISKO opens fullscreen in Edge (or Chrome) using its own separate browser profile.
3. Staff exit: press **Alt+F4**, or double-click **Stop ISKO Kiosk.cmd**.

**Always-on kiosk:** double-click **Install Kiosk Autostart.cmd**. ISKO then starts when that Windows user signs in and relaunches itself if the browser is closed or crashes (while it is running, Alt+F4 just restarts it; use **Stop ISKO Kiosk.cmd** to stop). Undo with **Remove Kiosk Autostart.cmd**.

The original **Launch ISKO.cmd** still opens the same app in a normal window, handy for testing on a laptop.

## Request tracking, queue numbers and email

- Every new request gets a **queue number** (Q-001, Q-002, …, restarting each day) and starts as **Pending**. The number appears on the preview screen and on the printed claim stub.
- Status flows **Pending → Queued → Ready → Completed**. Students see a progress tracker with how many requests are ahead of them, from **My requests → Track**, or from the login screen with **Track your request** (request number + student number, no sign-in).
- **Registrar console:** tap the ISKO logo 5 times quickly, enter the PIN (default `1234`, change `staffPin`). Staff confirm payment (Pending → Queued), mark Ready, mark Completed, or step back. The console auto-locks when idle.
- **Emails** are written for: sign-in alerts (security), request received, queued, "your turn is approaching" (when `turnApproachingAhead` or fewer are ahead), ready, and completed. They appear in the console's **Email outbox**.
- **Emails are not actually delivered** unless you set `emailWebhook` to a URL that accepts JSON `{to, subject, body, kind}` (for example an automation or email-service endpoint). Without it, the outbox is a demo log.
- All data lives in this one kiosk browser profile. Checking status from a phone or sending real mail on its own needs a small server, which this prototype does not include.

## Settings

Edit [js/kiosk-config.js](./js/kiosk-config.js), then relaunch:

- `onScreenKeyboard`: set `false` if the kiosk has a physical keyboard.
- `idleWarnSeconds`, `idleCountdownSeconds`, `loginIdleSeconds`: inactivity timing.
- `keepHistory`: `true` (default) keeps requests so students can track them and reprint stubs. `false` erases a student's requests at sign-out, which disables tracking. Because sign-in has no password, anyone can open any student's "My requests" by typing their student number.
- `staffPin`, `turnApproachingAhead`, `emailWebhook`: see Tracking below.
- `directPrint`, `persistLogin`, `lockdown`, `hideCursor`: see comments in the file.

## Hardening tips (not something an app can do alone)

- For a truly locked-down machine, use Windows **Assigned Access** (kiosk mode) for a dedicated account that runs only Edge; this also blocks Ctrl+Alt+Del style escapes and the taskbar.
- Disable the Windows edge-swipe gestures on touch screens, and turn off sleep / screen saver.
- If the kiosk is for the public, use a printer with enough paper and check it regularly: silent printing gives no on-screen error.

## Demo boundaries (unchanged)

This is still a local prototype. Sign-in identifies a local profile and is not secure university authentication. It does not connect to Bicol University, submit requests to an office, process payments, or fetch official records. All documents carry a sample label, and fees and processing times are illustrative.

## Files

- [index.html](./index.html): app shell and login.
- [styles.css](./styles.css): original styles and A4 print layout.
- [styles/kiosk.css](./styles/kiosk.css): touch layout (screen only; printing is untouched).
- [js/kiosk-config.js](./js/kiosk-config.js): settings.
- [js/kiosk.js](./js/kiosk.js): on-screen keyboard, option picker, idle timeout, lockdown.
- [js/app.js](./js/app.js), [js/data.js](./js/data.js), [js/storage.js](./js/storage.js), [js/documents.js](./js/documents.js): app logic.
- [js/tracking.js](./js/tracking.js), [js/tracking-ui.js](./js/tracking-ui.js): queue numbers, status flow, email outbox, tracker screens, Registrar console.
- `Launch-ISKO-Kiosk.ps1` and the `.cmd` wrappers: kiosk launchers.
