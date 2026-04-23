import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Book, BookList, Settings, SortKey, CenterMode } from "@/types";
import { applyPalette, buildPalette } from "@/theme/palette";

type State = {
  books: Book[];
  lists: BookList[];
  settings: Settings;
  // Transient UI state (persisted for convenience)
  selectedBookId: string | null;
  openListId: string | null;
  centerMode: CenterMode;
  sort: SortKey;

  // ---- Books ----
  addBook: (book: Omit<Book, "id" | "dateAdded" | "rating" | "comment"> & Partial<Book>) => Book;
  updateBook: (id: string, patch: Partial<Book>) => void;
  removeBook: (id: string) => void;

  // ---- Lists ----
  addList: (name: string) => BookList;
  renameList: (id: string, name: string) => void;
  removeList: (id: string) => void;
  addBookToList: (listId: string, bookId: string) => void;
  removeBookFromList: (listId: string, bookId: string) => void;

  // ---- Settings ----
  updateSettings: (patch: Partial<Settings>) => void;

  // ---- UI ----
  selectBook: (id: string | null) => void;
  openList: (id: string | null) => void;
  setCenterMode: (m: CenterMode) => void;
  setSort: (s: SortKey) => void;
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const defaultSettings: Settings = {
  kakaoApiKey: "",
  fontFamily: "Pretendard",
  themeColor: "#f2b8c6", // soft rose to echo the reference screenshot vibe
  darkMode: false,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      books: [],
      lists: [],
      settings: defaultSettings,
      selectedBookId: null,
      openListId: null,
      centerMode: "my-lists",
      sort: "recent",

      addBook: (input) => {
        const existing = input.isbn
          ? get().books.find((b) => b.isbn && b.isbn === input.isbn)
          : undefined;
        if (existing) {
          set({ selectedBookId: existing.id });
          return existing;
        }
        const book: Book = {
          id: uuid(),
          title: input.title,
          authors: input.authors ?? [],
          publisher: input.publisher ?? "",
          translators: input.translators,
          isbn: input.isbn ?? "",
          thumbnail: input.thumbnail ?? "",
          contents: input.contents ?? "",
          url: input.url,
          publishedAt: input.publishedAt,
          categories: input.categories ?? ["기타"],
          dateAdded: new Date().toISOString(),
          rating: 0,
          comment: "",
          manual: input.manual ?? false,
        };
        set((s) => ({ books: [book, ...s.books], selectedBookId: book.id }));
        return book;
      },

      updateBook: (id, patch) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      removeBook: (id) =>
        set((s) => ({
          books: s.books.filter((b) => b.id !== id),
          lists: s.lists.map((l) => ({ ...l, bookIds: l.bookIds.filter((bid) => bid !== id) })),
          selectedBookId: s.selectedBookId === id ? null : s.selectedBookId,
        })),

      addList: (name) => {
        const list: BookList = {
          id: uuid(),
          name: name.trim() || "새 목록",
          bookIds: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ lists: [...s.lists, list] }));
        return list;
      },

      renameList: (id, name) =>
        set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, name } : l)) })),

      removeList: (id) =>
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
          openListId: s.openListId === id ? null : s.openListId,
        })),

      addBookToList: (listId, bookId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId && !l.bookIds.includes(bookId)
              ? { ...l, bookIds: [bookId, ...l.bookIds] }
              : l,
          ),
        })),

      removeBookFromList: (listId, bookId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, bookIds: l.bookIds.filter((id) => id !== bookId) } : l,
          ),
        })),

      updateSettings: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch };
          applyPalette(buildPalette(next.themeColor, next.darkMode));
          document.documentElement.style.setProperty(
            "--font-app",
            `"${next.fontFamily}", "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`,
          );
          return { settings: next };
        }),

      selectBook: (id) => set({ selectedBookId: id }),
      openList: (id) => set({ openListId: id }),
      setCenterMode: (m) => set({ centerMode: m, openListId: null }),
      setSort: (s) => set({ sort: s }),
    }),
    {
      name: "wryrt.store.v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyPalette(buildPalette(state.settings.themeColor, state.settings.darkMode));
          document.documentElement.style.setProperty(
            "--font-app",
            `"${state.settings.fontFamily}", "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`,
          );
        }
      },
    },
  ),
);

// ---- Derived selectors ----
export function sortBooks(books: Book[], sort: SortKey): Book[] {
  const arr = [...books];
  switch (sort) {
    case "recent":
      return arr.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    case "oldest":
      return arr.sort((a, b) => a.dateAdded.localeCompare(b.dateAdded));
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating || b.dateAdded.localeCompare(a.dateAdded));
    case "alpha":
      return arr.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }
}

export function groupByCategory(books: Book[]): Record<string, Book[]> {
  const out: Record<string, Book[]> = {};
  for (const b of books) {
    for (const c of b.categories.length ? b.categories : ["기타"]) {
      (out[c] ??= []).push(b);
    }
  }
  return out;
}
