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
  kakaoApiKey: string;
  fontFamily: string;
  themeColor: string;
  darkMode: boolean;
};

declare global {
  interface Window {
    electronAPI?: {
      searchBook: (payload: {
        query: string;
        apiKey: string;
        page?: number;
        size?: number;
        target?: string;
      }) => Promise<{
        documents: Array<{
          title: string;
          authors: string[];
          publisher: string;
          translators: string[];
          contents: string;
          isbn: string;
          thumbnail: string;
          url: string;
          datetime: string;
        }>;
        meta: { total_count: number; is_end: boolean };
      }>;
      platform: string;
    };
  }
}
