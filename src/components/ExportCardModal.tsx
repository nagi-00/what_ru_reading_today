import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Book } from "@/types";

export default function ExportCardModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    setErr(null);
    try {
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--surface").trim(),
      });
      const a = document.createElement("a");
      a.download = `bookcard-${book.title.replace(/[^\w가-힣]+/g, "_")}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const stars = (() => {
    const full = Math.floor(book.rating);
    const half = book.rating % 1 >= 0.5;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
  })();

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="neu-card modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>북카드 내보내기</h2>
          <button className="neu-icon-btn" onClick={onClose}>×</button>
        </div>

        {/* Live preview that becomes the exported PNG */}
        <div ref={ref} className="bookcard">
          <div className="header">
            <span>WHAT ARE YOU READING TODAY?</span>
            <span>{new Date(book.dateAdded).toLocaleDateString("ko-KR")}</span>
          </div>
          <div className="top">
            {book.thumbnail ? (
              <img className="cover" src={book.thumbnail} alt="" crossOrigin="anonymous" />
            ) : (
              <div className="cover cover-ph">📘</div>
            )}
            <div>
              <div className="title">{book.title}</div>
              <div className="authors">
                {(book.authors ?? []).join(", ") || "저자 미상"}
                {book.publisher && ` · ${book.publisher}`}
              </div>
              <div className="stars" style={{ marginTop: 8 }}>{stars}</div>
            </div>
          </div>
          {book.comment && <div className="comment">{book.comment}</div>}
          <div className="footer">
            <span>{book.categories.join(" · ")}</span>
            {book.isbn && <span>ISBN {book.isbn}</span>}
          </div>
        </div>

        {err && <div className="search-empty">{err}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="neu-btn" onClick={onClose}>닫기</button>
          <button className="neu-btn primary" onClick={download} disabled={busy}>
            {busy ? "내보내는 중…" : "PNG로 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
