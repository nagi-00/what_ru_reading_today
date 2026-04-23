import { useMemo, useState } from "react";
import { groupByCategory, useStore } from "@/store/useStore";
import type { Book } from "@/types";

export default function ListsPanel() {
  const centerMode = useStore((s) => s.centerMode);
  const setCenterMode = useStore((s) => s.setCenterMode);
  const lists = useStore((s) => s.lists);
  const books = useStore((s) => s.books);
  const openListId = useStore((s) => s.openListId);
  const openList = useStore((s) => s.openList);
  const addList = useStore((s) => s.addList);
  const removeList = useStore((s) => s.removeList);
  const selectBook = useStore((s) => s.selectBook);

  const [newListName, setNewListName] = useState("");

  const categoryGroups = useMemo(() => groupByCategory(books), [books]);

  const onAdd = () => {
    if (!newListName.trim()) return;
    const l = addList(newListName.trim());
    setNewListName("");
    openList(l.id);
  };

  const categoryItems: Array<{ id: string; name: string; bookIds: string[] }> = Object.entries(
    categoryGroups,
  )
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([name, bs]) => ({ id: `cat:${name}`, name, bookIds: bs.map((b) => b.id) }));

  const rows =
    centerMode === "my-lists"
      ? lists.map((l) => ({ id: l.id, name: l.name, bookIds: l.bookIds, removable: true }))
      : categoryItems.map((c) => ({ ...c, removable: false }));

  const bookById = (id: string): Book | undefined => books.find((b) => b.id === id);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">목록</div>
          <div className="panel-sub">
            {centerMode === "my-lists" ? "내가 만든 목록" : "카테고리별 자동 분류"}
          </div>
        </div>
        <div className="center-tabs">
          <button
            className={`neu-pill ${centerMode === "my-lists" ? "active" : ""}`}
            onClick={() => setCenterMode("my-lists")}
          >
            내 목록
          </button>
          <button
            className={`neu-pill ${centerMode === "categories" ? "active" : ""}`}
            onClick={() => setCenterMode("categories")}
          >
            카테고리
          </button>
        </div>
      </div>

      {centerMode === "my-lists" && (
        <div className="add-list-row">
          <input
            className="neu-input"
            placeholder="새 목록 이름 (예: 2026 좋았던 책)"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />
          <button className="neu-btn" onClick={onAdd}>
            ＋
          </button>
        </div>
      )}

      <div className="lists-scroll">
        {rows.length === 0 && (
          <div className="detail-empty" style={{ minHeight: 180 }}>
            {centerMode === "my-lists"
              ? "아직 만든 목록이 없어요."
              : "책을 추가하면 자동으로 분류돼요."}
          </div>
        )}
        {rows.map((row) => {
          const open = openListId === row.id;
          const booksOfRow = row.bookIds.map(bookById).filter(Boolean) as Book[];
          return (
            <div key={row.id} className={`list-row ${open ? "open" : ""}`}>
              <div
                className="list-row-head"
                onClick={() => openList(open ? null : row.id)}
              >
                <div>
                  <div className="title">{row.name}</div>
                  <div className="meta">{booksOfRow.length}권</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {row.removable && (
                    <button
                      className="neu-icon-btn"
                      title="목록 삭제"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${row.name}' 목록을 삭제할까요?`)) removeList(row.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                  <span className="neu-icon-btn">{open ? "▴" : "▾"}</span>
                </div>
              </div>
              {open && (
                <div className="list-row-body">
                  {booksOfRow.length === 0 && (
                    <div className="search-empty" style={{ gridColumn: "1 / -1" }}>
                      이 목록에 담긴 책이 없어요.
                    </div>
                  )}
                  {booksOfRow.map((b) => (
                    <div key={b.id} className="tile" onClick={() => selectBook(b.id)}>
                      {b.thumbnail ? <img src={b.thumbnail} alt="" /> : <div className="cover-ph">📘</div>}
                      <div className="title">{b.title}</div>
                      <div className="sub">{(b.authors ?? []).join(", ") || "저자 미상"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
