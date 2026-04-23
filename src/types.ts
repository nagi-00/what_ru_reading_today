export type Book = {
  id: string;
  title: string;
  authors: string[];
  publisher: string;
  translators?: string[];
  isbn: string;
  thumbnail: string;
  contents: string;
  url?: string;
  publishedAt?: string;
  /** Kakao API sometimes returns 0 or more categories. We keep them free-form. */
  categories: string[];
  /** When the user added it to their shelf. */
  dateAdded: string;
  /** 0..5, supports half-stars via 0.5 increments. */
  rating: number;
  comment: string;
  /** Optional user-entered fields when manually added. */
  manual?: boolean;
};

export type BookList = {
  id: string;
  name: string;
  bookIds: string[];
  createdAt: string;
};

export type SortKey = "recent" | "oldest" | "rating" | "alpha";

export type CenterMode = "my-lists" | "categories";

export type Settings = {
  aladinTtbKey: string;
  fontFamily: string;
  themeColor: string;
  darkMode: boolean;
};

declare global {
  interface Window {
    electronAPI?: {
      aladinCall: (payload: {
        path: string;
        params: Record<string, string | number>;
        ttbKey: string;
      }) => Promise<unknown>;
      platform: string;
    };
  }
}
