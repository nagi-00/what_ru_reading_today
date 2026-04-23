import { useState } from "react";
import { useStore } from "@/store/useStore";

export default function ManualAddModal({ onClose }: { onClose: () => void }) {
  const addBook = useStore((s) => s.addBook);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [contents, setContents] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addBook({
      title: title.trim(),
      authors: authors.split(",").map((s) => s.trim()).filter(Boolean),
      publisher: publisher.trim(),
      isbn: isbn.trim(),
      categories: category.split(",").map((s) => s.trim()).filter(Boolean) || ["기타"],
      thumbnail: thumbnail.trim(),
      contents: contents.trim(),
      manual: true,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="neu-card modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>책 직접 추가</h2>
        <div className="manual-grid">
          <div className="field full">
            <label>제목 *</label>
            <input className="neu-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>저자 (쉼표로 구분)</label>
            <input className="neu-input" value={authors} onChange={(e) => setAuthors(e.target.value)} />
          </div>
          <div className="field">
            <label>출판사</label>
            <input className="neu-input" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
          </div>
          <div className="field">
            <label>ISBN</label>
            <input className="neu-input" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          </div>
          <div className="field">
            <label>카테고리 (쉼표로 구분)</label>
            <input className="neu-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="예: 소설, 에세이" />
          </div>
          <div className="field full">
            <label>표지 이미지 URL</label>
            <input className="neu-input" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          </div>
          <div className="field full">
            <label>줄거리/소개</label>
            <textarea className="neu-textarea" value={contents} onChange={(e) => setContents(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
          <button type="button" className="neu-btn" onClick={onClose}>취소</button>
          <button type="submit" className="neu-btn primary">추가</button>
        </div>
      </form>
    </div>
  );
}
