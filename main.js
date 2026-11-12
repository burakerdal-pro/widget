const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ICAL = require('ical.js');

// Takvim adresin (iCal)
const ICS_URL = 'https://calendar.google.com/calendar/ical/burak.erdal%40kuryebus.com/public/basic.ics';

// Google Takvim uygulamasını açan komut (senin Chrome profilin)
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome_proxy.exe';
const CHROME_ARGS = ['--profile-directory=Profile 6', '--app-id=kjbdgfilnfhdoflbpgamdcdgpehopbep'];

// Bugünden kaç gün geriye / ileriye etkinlik okunsun
const DAYS_BACK = 40;
const DAYS_AHEAD = 120;

async function loadEvents() {
  const res = await fetch(ICS_URL);
  if (!res.ok) throw new Error('Takvim indirilemedi: ' + res.status);
  const text = await res.text();
  const comp = new ICAL.Component(ICAL.parse(text));

  comp.getAllSubcomponents('vtimezone').forEach((vtz) => {
    try { ICAL.TimezoneService.register(vtz); } catch (e) {}
  });

  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - DAYS_BACK);
  const rangeEnd = new Date(Date.now() + DAYS_AHEAD * 24 * 3600 * 1000);

  const vevents = comp.getAllSubcomponents('vevent');
  const out = [];
  const exceptions = new Set();
  vevents.forEach((ve) => {
    const ev = new ICAL.Event(ve);
    if (ev.recurrenceId) exceptions.add(ev.uid + '|' + ev.recurrenceId.toJSDate().getTime());
  });

  function push(ev, startDate, endDate) {
    const s = startDate.toJSDate();
    const e = endDate ? endDate.toJSDate() : s;
    if (e < rangeStart || s >= rangeEnd) return;
    out.push({
      title: ev.summary || '(Başlıksız)',
      location: ev.location || '',
      start: s.getTime(),
      end: e.getTime(),
      allDay: startDate.isDate
    });
  }

  vevents.forEach((ve) => {
    const ev = new ICAL.Event(ve);
    if (ve.getFirstPropertyValue('status') === 'CANCELLED') return;
    if (ev.isRecurring()) {
      const it = ev.iterator();
      let next, guard = 0;
      while ((next = it.next()) && guard++ < 5000) {
        if (next.toJSDate() >= rangeEnd) break;
        if (exceptions.has(ev.uid + '|' + next.toJSDate().getTime())) continue;
        const occ = ev.getOccurrenceDetails(next);
        push(ev, occ.startDate, occ.endDate);
      }
    } else {
      push(ev, ev.startDate, ev.endDate);
    }
  });

  out.sort((a, b) => a.start - b.start);
  return { events: out, total: vevents.length };
}

ipcMain.handle('events', async () => {
  try {
    const r = await loadEvents();
    return { ok: true, events: r.events, total: r.total };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// Görevler bu bilgisayarda bir dosyada saklanır
const tasksFile = () => path.join(app.getPath('userData'), 'tasks.json');
ipcMain.handle('tasks:load', () => {
  try { return JSON.parse(fs.readFileSync(tasksFile(), 'utf8')); } catch (e) { return []; }
});
ipcMain.handle('tasks:save', (e, tasks) => {
  fs.writeFileSync(tasksFile(), JSON.stringify(tasks));
  return true;
});

ipcMain.on('open-calendar', () => {
  try {
    spawn(CHROME, CHROME_ARGS, { detached: true, stdio: 'ignore' }).unref();
  } catch (e) {}
});
ipcMain.on('close', () => app.quit());

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 700,
    x: 50,
    y: 30,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
