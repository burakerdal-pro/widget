# Desktop Calendar & Tasks Widget

A small, always-on desktop widget for Windows built with [Electron](https://www.electronjs.org/). It shows a monthly calendar grid, lets you keep a simple to-do list with due dates, and can open the full Google Calendar app with one click.

The window is frameless and semi-transparent, so it sits on your desktop like a widget. Drag it by the bar at the top.

## Features

- **Monthly calendar grid** with day boxes, month navigation and a "Today" button
- **Events from a Google Calendar** via an iCal (`.ics`) feed, including recurring events
- **Local to-do list** with optional due dates. Dated tasks appear inside the day boxes; undated tasks are listed separately
- **Google Calendar button** that launches your installed Google Calendar app (Chrome PWA)
- Frameless, transparent, draggable window with a close button
- Auto-refresh of calendar events every 10 minutes

## Requirements

- Windows 10 / 11
- [Node.js](https://nodejs.org/) (LTS version recommended)

## Installation

```bash
git clone https://github.com/<your-username>/widget.git
cd widget
npm install
npm install ical.js@1.5.0
```

If `npm start` complains that Electron failed to install correctly, run the install script manually and try again:

```bash
node node_modules/electron/install.js
```

> **PowerShell users:** if npm is blocked by the execution policy, run
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, or use `cmd` instead.

## Run

```bash
npm start
```

## Configuration

All settings are constants at the top of `main.js`:

| Constant | Purpose |
| --- | --- |
| `ICS_URL` | The iCal feed of the calendar to display |
| `CHROME` / `CHROME_ARGS` | Command used by the "Google Calendar" button to open the Chrome app (profile directory and app id) |
| `DAYS_BACK` / `DAYS_AHEAD` | How many days of events before/after today are loaded |

The widget size and position are set in the `BrowserWindow` options in `main.js` (`width`, `height`, `x`, `y`).

### Getting the iCal address

In Google Calendar, open **Settings → Settings for my calendars → your calendar → Integrate calendar** and copy the **Secret address in iCal format** (it looks like `.../private-.../basic.ics`).

> **Treat the secret address like a password.** Anyone who has it can read your calendar. Do not commit it to a public repository. If it leaks, use **Reset** next to the field to invalidate it.

The *public* address (`.../public/basic.ics`) only returns events if the calendar is fully public with event details visible.

### Google Workspace note

On Google Workspace domains, an administrator can restrict external sharing to "free/busy only". In that case the secret iCal address is hidden and the public feed is empty, so no events can be loaded. A Workspace admin can change this in the Admin console under **Apps → Google Workspace → Calendar → Sharing settings → External sharing options for primary calendars**.

If events cannot be loaded, the widget shows how many events were read from the feed at the bottom, which helps with diagnosing the problem.

## Tasks

Tasks are stored locally in a `tasks.json` file in the app's user data folder (`%APPDATA%\widget\tasks.json`), so they survive restarts.

Google Tasks are **not** part of the iCal feed, so they cannot be shown in this widget. Tasks you create here are separate from Google Tasks and are not synced.

## Build a standalone `.exe`

```bash
npm install electron-packager --save-dev
npx electron-packager . widget --platform=win32 --arch=x64 --out=C:\widget-app --overwrite
```

The executable is created at `C:\widget-app\widget-win32-x64\widget.exe`. Rebuild it whenever you change the code.

### Start with Windows

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Copy `widget.exe` and paste it as a **shortcut** into the Startup folder.

## Project structure

```
widget/
├── main.js        # Electron main process: window, iCal loading, task storage
├── preload.js     # Safe bridge between the main process and the page
├── index.html     # Widget UI (calendar grid, task list)
└── package.json
```

## Tips

- Put the project outside of OneDrive (for example `C:\widget`) if `node_modules` causes file-locking or install problems.
- To keep the window above other windows, use a tool such as [PowerToys](https://learn.microsoft.com/windows/powertoys/) ("Always on Top", `Win + Ctrl + T`).

## License

Personal project. Add a license of your choice if you plan to share it.
