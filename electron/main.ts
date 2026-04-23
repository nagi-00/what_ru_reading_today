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

// ---- Kakao Book Search proxy (avoids CORS and keeps key in main process) ----
ipcMain.handle(
  "kakao:searchBook",
  async (_evt, payload: { query: string; apiKey: string; page?: number; size?: number; target?: string }) => {
    const { query, apiKey, page = 1, size = 20, target } = payload;
    if (!apiKey) throw new Error("Kakao REST API 키가 설정되지 않았습니다.");
    if (!query?.trim()) return { documents: [], meta: { total_count: 0, is_end: true } };

    const url = new URL("https://dapi.kakao.com/v3/search/book");
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));
    if (target) url.searchParams.set("target", target);

    return await new Promise((resolve, reject) => {
      const request = net.request({
        method: "GET",
        url: url.toString(),
      });
      request.setHeader("Authorization", `KakaoAK ${apiKey}`);
      let body = "";
      request.on("response", (response) => {
        response.on("data", (chunk) => (body += chunk.toString()));
        response.on("end", () => {
          try {
            const json = JSON.parse(body);
            if (response.statusCode && response.statusCode >= 400) {
              reject(new Error(json?.message || `Kakao API error ${response.statusCode}`));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(e);
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
