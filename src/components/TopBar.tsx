import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { kakaoDocToBook, searchBook, type KakaoDoc } from "@/api/kakao";
import ManualAddModal from "@/components/ManualAddModal";

type Props = { onOpenSettings: () => void };

export default function TopBar({ onOpenSettings }: Props) {
  const apiKey = useStore((s) => s.settings.kakaoApiKey);
  const addBook = useStore((s) => s.addBook);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    if (!apiKey) {
      setError("설정에서 Kakao REST API 키를 입력해 주세요.");
      setResults([]);
      setOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await searchBook(query.trim(), apiKey);
        setResults(res.documents ?? []);
        setOpen(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query, apiKey]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const onPick = (doc: KakaoDoc) => {
    const book = kakaoDocToBook(doc);
    addBook(book);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-dot">📖</span>
        <span>What are you reading today?</span>
      </div>

      <div className="search-wrap" ref={wrapRef}>
        <span className="search-icon">🔍</span>
        <input
          className="neu-input"
          placeholder="책 제목, 저자, 출판사로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {open && (
          <div className="neu search-dropdown">
            {loading && <div className="search-empty">검색 중…</div>}
            {error && <div className="search-empty">{error}</div>}
            {!loading && !error && results.length === 0 && query.trim() && (
              <div className="search-empty">검색 결과가 없어요.</div>
            )}
            {!loading &&
              results.map((r, i) => (
                <div className="search-item" key={`${r.isbn}-${i}`} onClick={() => onPick(r)}>
                  {r.thumbnail ? (
                    <img src={r.thumbnail} alt="" />
                  ) : (
                    <div className="cover-ph">📕</div>
                  )}
                  <div className="meta">
                    <div className="title">{r.title}</div>
                    <div className="sub">
                      {(r.authors ?? []).join(", ")} · {r.publisher}
                    </div>
                  </div>
                  <span className="neu-pill">추가</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="top-actions">
        <button className="neu-btn" onClick={() => setManualOpen(true)} title="직접 추가">
          ＋ 직접 추가
        </button>
        <button className="neu-icon-btn" onClick={onOpenSettings} title="설정">
          ⚙
        </button>
      </div>

      {manualOpen && <ManualAddModal onClose={() => setManualOpen(false)} />}
    </header>
  );
}
