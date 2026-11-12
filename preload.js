const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getEvents: () => ipcRenderer.invoke('events'),
  loadTasks: () => ipcRenderer.invoke('tasks:load'),
  saveTasks: (t) => ipcRenderer.invoke('tasks:save', t),
  openCalendar: () => ipcRenderer.send('open-calendar'),
  close: () => ipcRenderer.send('close')
});
