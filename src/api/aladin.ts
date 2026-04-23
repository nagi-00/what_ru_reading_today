import type { Book } from "@/types";

/**
 * Aladin TTB OpenAPI client.
 *
 * Reference endpoints:
 *  - ItemSearch: https://www.aladin.co.kr/ttb/api/ItemSearch.aspx
 *  - ItemLookUp: https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx
 *
 * We request Output=JS (JSON), Version=20131101 and include OptResult=ebookList,usedList,reviewList
 * so the ItemLookUp step returns the richer `subInfo` (toc, story, itemPage, ...).
 */

export type AladinItem = {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  isbn: string;
  isbn13: string;
  itemId: number;
  priceSales: number;
  priceStandard: number;
  mallType: string;
  stockStatus: string;
  mileage: number;
  cover: string;
  categoryId: number;
  categoryName: string;
  publisher: string;
  salesPoint: number;
  adult: boolean;
  fixedPrice: boolean;
  customerReviewRank: number;
  subInfo?: {
    subTitle?: string;
    originalTitle?: string;
    itemPage?: number;
    toc?: string;
    story?: string;
    ratingInfo?: { ratingScore?: number; ratingCount?: number };
  };
};

export type AladinSearchResponse = {
  version: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
  item: AladinItem[];
};

type Caller = (path: string, params: Record<string, string | number>) => Promise<unknown>;

function buildCaller(ttbKey: string): Caller {
  const isDev = typeof window !== "undefined" && !!(import.meta as { env?: { DEV?: boolean } }).env?.DEV;
  const base = isDev ? "/aladin-api" : "https://www.aladin.co.kr/ttb/api";
  return async (path, params) => {
    if (window.electronAPI?.aladinCall) {
      return window.electronAPI.aladinCall({ path, params, ttbKey });
    }
    const url = new URL(`${base}/${path}`, window.location.origin);
    url.searchParams.set("ttbkey", ttbKey);
    url.searchParams.set("Output", "JS");
    url.searchParams.set("Version", "20131101");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Aladin API error ${res.status}`);
    // Aladin sometimes returns JSON with trailing newlines or a BOM. Parse manually.
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // Fallback: strip anything before the first "{"
      const idx = text.indexOf("{");
      if (idx >= 0) return JSON.parse(text.slice(idx));
      throw new Error("Aladin 응답 파싱 실패");
    }
  };
}

export async function searchBook(query: string, ttbKey: string): Promise<AladinSearchResponse> {
  if (!ttbKey) throw new Error("Aladin TTB 키가 설정되지 않았습니다.");
  if (!query.trim()) return { version: "", totalResults: 0, startIndex: 1, itemsPerPage: 0, query, item: [] };
  const call = buildCaller(ttbKey);
  const data = (await call("ItemSearch.aspx", {
    Query: query,
    QueryType: "Keyword",
    SearchTarget: "Book",
    MaxResults: 20,
    Start: 1,
    Cover: "Big",
  })) as AladinSearchResponse;
  data.item = Array.isArray(data.item) ? data.item : [];
  return data;
}

/**
 * ItemLookUp with OptResult enriches the book with subInfo (toc/story/itemPage).
 * Keep the call optional: the search response alone has enough to store a book.
 */
export async function lookupBook(isbn13: string, ttbKey: string): Promise<AladinItem | null> {
  if (!ttbKey || !isbn13) return null;
  const call = buildCaller(ttbKey);
  const data = (await call("ItemLookUp.aspx", {
    ItemId: isbn13,
    ItemIdType: "ISBN13",
    Cover: "Big",
    OptResult: "ebookList,usedList,fulldescription,toc,story,Story,ratingInfo",
  })) as AladinSearchResponse;
  return Array.isArray(data.item) && data.item.length ? data.item[0] : null;
}

/**
 * "김영하 (지은이), 홍길동 (옮긴이)" → { authors: ["김영하"], translators: ["홍길동"] }
 * Unlabeled names go into authors. Also handles 엮음/편저/기획/그림 roles.
 */
export function parseAuthorString(raw: string): { authors: string[]; translators: string[]; others: string[] } {
  const authors: string[] = [];
  const translators: string[] = [];
  const others: string[] = [];
  if (!raw) return { authors, translators, others };
  for (const chunk of raw.split(",")) {
    const part = chunk.trim();
    if (!part) continue;
    const m = part.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (m) {
      const name = m[1].trim();
      const role = m[2].trim();
      if (/옮긴이|번역/.test(role)) translators.push(name);
      else if (/지은이|글|저자|원작|작가|글·그림/.test(role)) authors.push(name);
      else others.push(`${name} (${role})`);
    } else {
      authors.push(part);
    }
  }
  return { authors, translators, others };
}

/**
 * "국내도서>소설/시/희곡>한국소설>2000년대 이후 한국소설"
 *  → ["소설/시/희곡", "한국소설"] (drop the top-level mall bucket, keep next two levels)
 */
export function parseCategoryPath(raw: string): string[] {
  if (!raw) return ["기타"];
  const parts = raw.split(">").map((s) => s.trim()).filter(Boolean);
  const withoutMall = parts[0] === "국내도서" || parts[0] === "외국도서" ? parts.slice(1) : parts;
  if (withoutMall.length === 0) return ["기타"];
  return withoutMall.slice(0, 2);
}

export function aladinItemToBook(item: AladinItem): Omit<Book, "id" | "dateAdded" | "rating" | "comment"> {
  const { authors, translators } = parseAuthorString(item.author);
  const summary =
    item.subInfo?.story?.trim() ||
    item.description?.trim() ||
    "";
  return {
    title: item.title,
    authors,
    translators,
    publisher: item.publisher ?? "",
    isbn: item.isbn13 || item.isbn || "",
    thumbnail: item.cover ?? "",
    contents: summary,
    url: item.link,
    publishedAt: item.pubDate,
    categories: parseCategoryPath(item.categoryName),
  };
}
