import { contextBridge, ipcRenderer } from "electron";

const api = {
  aladinCall: (payload: {
    path: string;
    params: Record<string, string | number>;
    ttbKey: string;
  }): Promise<unknown> => ipcRenderer.invoke("aladin:call", payload),
  platform: process.platform,
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
