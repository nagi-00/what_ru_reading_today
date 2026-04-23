import { app, BrowserWindow, ipcMain, net, session } from "electron";
import path from "node:path";

const isDev = !!process.env.ELECTRON_DEV;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: "What are you reading today?",
    backgroundColor: "#eef0f5",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

// ---- Aladin TTB OpenAPI proxy (keeps the key in the main process, no CORS) ----
ipcMain.handle(
  "aladin:call",
  async (
    _evt,
    payload: { path: string; params: Record<string, string | number>; ttbKey: string },
  ) => {
    const { path: apiPath, params, ttbKey } = payload;
    if (!ttbKey) throw new Error("Aladin TTB 키가 설정되지 않았습니다.");
    if (!apiPath) throw new Error("Aladin API 경로가 없습니다.");

    const url = new URL(`https://www.aladin.co.kr/ttb/api/${apiPath}`);
    url.searchParams.set("ttbkey", ttbKey);
    url.searchParams.set("Output", "JS");
    url.searchParams.set("Version", "20131101");
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));

    return await new Promise((resolve, reject) => {
      const request = net.request({ method: "GET", url: url.toString() });
      let body = "";
      request.on("response", (response) => {
        response.on("data", (chunk) => (body += chunk.toString()));
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`Aladin API error ${response.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            const idx = body.indexOf("{");
            if (idx >= 0) {
              try {
                resolve(JSON.parse(body.slice(idx)));
                return;
              } catch (e) {
                reject(e);
                return;
              }
            }
            reject(new Error("Aladin 응답 파싱 실패"));
          }
        });
        response.on("error", reject);
      });
      request.on("error", reject);
      request.end();
    });
  },
);

app.whenReady().then(() => {
  // Allow remote images (book covers) from Kakao CDN
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({ responseHeaders: details.responseHeaders });
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
