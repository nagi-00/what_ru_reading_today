import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import ExportCardModal from "@/components/ExportCardModal";

export default function DetailPanel() {
  const selectedBookId = useStore((s) => s.selectedBookId);
  const books = useStore((s) => s.books);
  const lists = useStore((s) => s.lists);
  const updateBook = useStore((s) => s.updateBook);
  const removeBook = useStore((s) => s.removeBook);
  const addBookToList = useStore((s) => s.addBookToList);
  const removeBookFromList = useStore((s) => s.removeBookFromList);

  const book = useMemo(() => books.find((b) => b.id === selectedBookId) ?? null, [books, selectedBookId]);
  const [exportOpen, setExportOpen] = useState(false);

  if (!book) {
    return (
      <aside className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">상세</div>
            <div className="panel-sub">책을 선택하세요</div>
          </div>
        </div>
        <div className="detail-empty">
          왼쪽 서재 또는 중앙 목록에서<br />책을 클릭해 보세요.
        </div>
      </aside>
    );
  }

  const membershipListIds = new Set(
    lists.filter((l) => l.bookIds.includes(book.id)).map((l) => l.id),
  );

  const dateAdded = new Date(book.dateAdded);
  const publishedAt = book.publishedAt ? new Date(book.publishedAt) : null;

  return (
    <aside className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">상세</div>
          <div className="panel-sub">
            추가한 날짜 · {dateAdded.toLocaleDateString("ko-KR")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="neu-btn" onClick={() => setExportOpen(true)} title="북카드 만들기">
            ✦ 북카드
          </button>
          <button
            className="neu-icon-btn"
            title="서재에서 삭제"
            onClick={() => {
              if (confirm("서재에서 삭제할까요?")) removeBook(book.id);
            }}
          >
            🗑
          </button>
        </div>
      </div>

      <div className="detail-scroll">
        <div className="detail-cover-wrap">
          {book.thumbnail ? (
            <img className="detail-cover" src={book.thumbnail} alt={book.title} />
          ) : (
            <div className="detail-cover-ph cover-ph">📘</div>
          )}
        </div>

        <div className="detail-title">{book.title}</div>
        <div className="detail-authors">
          {(book.authors ?? []).join(", ") || "저자 미상"}
          {book.translators && book.translators.length > 0 && ` · 옮김 ${book.translators.join(", ")}`}
        </div>

        <div className="kv-grid">
          <div className="k">출판사</div>
          <div className="v">{book.publisher || "-"}</div>
          <div className="k">출간</div>
          <div className="v">{publishedAt ? publishedAt.toLocaleDateString("ko-KR") : "-"}</div>
          <div className="k">ISBN</div>
          <div className="v">{book.isbn || "-"}</div>
          <div className="k">카테고리</div>
          <div className="v">{book.categories.join(", ")}</div>
        </div>

        {book.contents && <div className="detail-summary">{book.contents}</div>}

        <div className="panel-sub" style={{ marginBottom: 6 }}>내 별점</div>
        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`star ${book.rating >= n ? "filled" : ""}`}
              onClick={() => updateBook(book.id, { rating: book.rating === n ? 0 : n })}
              title={`${n}점`}
            >
              ★
            </span>
          ))}
          <button
            className="neu-pill"
            onClick={() =>
              updateBook(book.id, { rating: book.rating % 1 ? Math.floor(book.rating) : book.rating + 0.5 })
            }
            title="반 별 추가/제거"
          >
            ½
          </button>
        </div>

        <div className="panel-sub" style={{ marginBottom: 6 }}>메모 / 코멘트</div>
        <textarea
          className="neu-textarea"
          value={book.comment}
          onChange={(e) => updateBook(book.id, { comment: e.target.value })}
          placeholder="이 책에 대한 감상, 기억하고 싶은 문장을 남겨 보세요."
        />

        <div className="panel-sub" style={{ margin: "14px 0 6px" }}>목록에 담기</div>
        <div className="chips">
          {lists.length === 0 && <div className="panel-sub">먼저 목록을 만들어 주세요.</div>}
          {lists.map((l) => {
            const inList = membershipListIds.has(l.id);
            return (
              <button
                key={l.id}
                className={`neu-pill ${inList ? "active" : ""}`}
                onClick={() =>
                  inList ? removeBookFromList(l.id, book.id) : addBookToList(l.id, book.id)
                }
              >
                {inList ? "✓ " : "＋ "}
                {l.name}
              </button>
            );
          })}
        </div>
      </div>

      {exportOpen && <ExportCardModal book={book} onClose={() => setExportOpen(false)} />}
    </aside>
  );
}
