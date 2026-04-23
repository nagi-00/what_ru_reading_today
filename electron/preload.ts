import { contextBridge, ipcRenderer } from "electron";

export type KakaoBookDoc = {
  title: string;
  authors: string[];
  publisher: string;
  translators: string[];
  contents: string;
  isbn: string;
  thumbnail: string;
  url: string;
  datetime: string;
  price: number;
  sale_price: number;
  status: string;
};

export type KakaoBookResponse = {
  documents: KakaoBookDoc[];
  meta: { total_count: number; pageable_count: number; is_end: boolean };
};

const api = {
  searchBook: (payload: {
    query: string;
    apiKey: string;
    page?: number;
    size?: number;
    target?: string;
  }): Promise<KakaoBookResponse> => ipcRenderer.invoke("kakao:searchBook", payload),
  platform: process.platform,
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
