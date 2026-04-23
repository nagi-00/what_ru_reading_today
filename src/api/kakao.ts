import type { Book } from "@/types";

export type KakaoDoc = {
  title: string;
  authors: string[];
  publisher: string;
  translators: string[];
  contents: string;
  isbn: string;
  thumbnail: string;
  url: string;
  datetime: string;
};

export type KakaoResult = {
  documents: KakaoDoc[];
  meta: { total_count: number; is_end: boolean };
};

/**
 * Call Kakao Book Search.
 * Uses electron IPC when available (preferred, hides key), falls back to
 * direct fetch in the browser for `npm run dev` outside Electron.
 */
export async function searchBook(query: string, apiKey: string): Promise<KakaoResult> {
  if (window.electronAPI?.searchBook) {
    return window.electronAPI.searchBook({ query, apiKey });
  }
  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "20");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Kakao API error ${res.status}`);
  return res.json();
}

/**
 * Kakao returns ISBNs as "10digit 13digit" or just one; we keep the 13-digit form
 * when present because it's more stable as a unique key.
 */
export function pickIsbn(isbnField: string): string {
  if (!isbnField) return "";
  const parts = isbnField.trim().split(/\s+/);
  return parts.find((p) => p.length === 13) ?? parts[0] ?? "";
}

/**
 * Very rough auto-categorisation from the Kakao URL (category path),
 * publisher, or keywords in the contents/title. Kakao Book Search does not
 * expose an explicit category field on v3, so we infer.
 */
export function inferCategories(doc: KakaoDoc): string[] {
  const text = `${doc.title} ${doc.contents}`.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["소설", /소설|novel|fiction|장편|단편/],
    ["에세이", /에세이|essay|산문/],
    ["시", /\b시집\b|poetry|시모음/],
    ["자기계발", /자기계발|성공|습관|동기부여|self[- ]?help/],
    ["경제/경영", /경제|경영|투자|주식|비즈니스|business|finance|economics/],
    ["과학", /과학|물리|화학|생물|천문|science|physics|biology/],
    ["역사", /역사|조선|고려|history|전쟁/],
    ["철학", /철학|philosophy|형이상학/],
    ["심리학", /심리|psychology/],
    ["예술", /예술|미술|사진|디자인|art|design/],
    ["IT/컴퓨터", /프로그래밍|컴퓨터|소프트웨어|코딩|programming|algorithm|software/],
    ["만화", /만화|웹툰|comic|manga/],
    ["어린이", /동화|어린이|children|kids/],
  ];
  const hits = rules.filter(([, re]) => re.test(text)).map(([name]) => name);
  return hits.length > 0 ? hits : ["기타"];
}

export function kakaoDocToBook(doc: KakaoDoc): Omit<Book, "id" | "dateAdded" | "rating" | "comment"> {
  return {
    title: doc.title,
    authors: doc.authors ?? [],
    publisher: doc.publisher ?? "",
    translators: doc.translators ?? [],
    isbn: pickIsbn(doc.isbn),
    thumbnail: doc.thumbnail ?? "",
    contents: doc.contents ?? "",
    url: doc.url,
    publishedAt: doc.datetime,
    categories: inferCategories(doc),
  };
}
