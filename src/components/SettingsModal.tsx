import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

const PRESET_COLORS = [
  "#f2b8c6", // rose
  "#f4a5a5", // coral
  "#f6c785", // honey
  "#c6dfa5", // sage
  "#9fd3c7", // mint
  "#a7c7e7", // sky
  "#b6a7e7", // lavender
  "#d1a7e7", // orchid
  "#e7a7c1", // pink
  "#8a8fa3", // slate
];

// A sensible default list — rendered names are shown even if the font isn't installed.
const DEFAULT_FONTS = [
  "Pretendard",
  "Noto Sans KR",
  "Nanum Gothic",
  "Nanum Myeongjo",
  "Apple SD Gothic Neo",
  "Malgun Gothic",
  "Spoqa Han Sans Neo",
  "IBM Plex Sans KR",
  "IBM Plex Serif",
  "Inter",
  "Georgia",
  "Times New Roman",
  "serif",
  "sans-serif",
  "monospace",
];

/**
 * Try to enumerate locally-installed fonts via the Local Font Access API.
 * Falls back to the curated list on browsers/Electron builds that don't
 * expose the API or deny permission.
 */
async function listLocalFonts(): Promise<string[]> {
  const anyWindow = window as unknown as {
    queryLocalFonts?: () => Promise<Array<{ family: string }>>;
  };
  if (!anyWindow.queryLocalFonts) return DEFAULT_FONTS;
  try {
    const fonts = await anyWindow.queryLocalFonts();
    const families = Array.from(new Set(fonts.map((f) => f.family))).sort((a, b) =>
      a.localeCompare(b, "ko"),
    );
    return families.length ? families : DEFAULT_FONTS;
  } catch {
    return DEFAULT_FONTS;
  }
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [fonts, setFonts] = useState<string[]>(DEFAULT_FONTS);
  const [apiKeyInput, setApiKeyInput] = useState(settings.kakaoApiKey);
  const [customColor, setCustomColor] = useState(settings.themeColor);

  useEffect(() => {
    listLocalFonts().then(setFonts);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="neu-card modal" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2>설정</h2>
          <button className="neu-icon-btn" onClick={onClose}>×</button>
        </div>

        <div className="field">
          <label>Kakao REST API 키</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="neu-input"
              type="password"
              autoComplete="off"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="dapi.kakao.com Book Search용 REST API Key"
            />
            <button
              className="neu-btn primary"
              onClick={() => updateSettings({ kakaoApiKey: apiKeyInput.trim() })}
            >
              저장
            </button>
          </div>
          <div className="panel-sub">
            Kakao Developers(<code>developers.kakao.com</code>)에서 앱을 만들고 REST API 키를 발급받아
            붙여 넣어 주세요. 키는 이 컴퓨터에만 저장됩니다.
          </div>
        </div>

        <div className="field">
          <label>폰트</label>
          <select
            className="neu-select"
            value={settings.fontFamily}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          >
            {fonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
          <div className="panel-sub">
            로컬에 설치된 폰트를 감지해 보여줘요. 감지되지 않으면 기본 목록이 표시됩니다.
          </div>
        </div>

        <div className="field">
          <label>테마 컬러</label>
          <div className="color-swatches">
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className={`swatch ${settings.themeColor.toLowerCase() === c.toLowerCase() ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setCustomColor(c);
                  updateSettings({ themeColor: c });
                }}
              />
            ))}
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                updateSettings({ themeColor: e.target.value });
              }}
              style={{
                width: 40,
                height: 40,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
              title="커스텀 컬러"
            />
          </div>
          <div className="panel-sub">
            선택한 하나의 컬러에서 배경·그림자·포인트까지 조화롭게 자동 생성돼요.
          </div>
        </div>

        <div className="toggle-row">
          <div>
            <div style={{ fontWeight: 600 }}>다크 모드</div>
            <div className="panel-sub">눈이 편한 저녁용 톤으로 전환</div>
          </div>
          <button
            className={`neu-btn ${settings.darkMode ? "active" : ""}`}
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          >
            {settings.darkMode ? "ON" : "OFF"}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="neu-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
