import { useMemo } from "react";
import { sortBooks, useStore } from "@/store/useStore";
import type { SortKey } from "@/types";

const SORTS: Array<[SortKey, string]> = [
  ["recent", "최신순"],
  ["oldest", "오래된순"],
  ["rating", "별점순"],
  ["alpha", "가나다순"],
];

export default function LibraryPanel() {
  const books = useStore((s) => s.books);
  const sort = useStore((s) => s.sort);
  const setSort = useStore((s) => s.setSort);
  const selectedBookId = useStore((s) => s.selectedBookId);
  const selectBook = useStore((s) => s.selectBook);

  const sorted = useMemo(() => sortBooks(books, sort), [books, sort]);

  return (
    <aside className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">서재</div>
          <div className="panel-sub">{books.length.toLocaleString()}권 · 지금까지 읽은 책</div>
        </div>
      </div>

      <div className="library-controls">
        {SORTS.map(([k, label]) => (
          <button
            key={k}
            className={`neu-pill ${sort === k ? "active" : ""}`}
            onClick={() => setSort(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="library-list">
        {sorted.length === 0 && (
          <div className="detail-empty" style={{ minHeight: 180 }}>
            위에서 책을 검색하거나<br />직접 추가해 시작해 보세요.
          </div>
        )}
        {sorted.map((b) => (
          <div
            key={b.id}
            className={`library-item ${selectedBookId === b.id ? "selected" : ""}`}
            onClick={() => selectBook(b.id)}
          >
            {b.thumbnail ? <img src={b.thumbnail} alt="" /> : <div className="cover-ph">📘</div>}
            <div>
              <div className="title">{b.title}</div>
              <div className="sub">{(b.authors ?? []).join(", ") || "저자 미상"}</div>
              {b.rating > 0 && (
                <div className="stars">
                  {"★".repeat(Math.floor(b.rating))}
                  {b.rating % 1 ? "½" : ""}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
