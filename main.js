const { app, BrowserWindow } = require("electron");
 
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
 
  win.setMenu(null);
  win.loadFile("index.html");
}
 
app.whenReady().then(createWindow);