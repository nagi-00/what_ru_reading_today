import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import LibraryPanel from "@/components/LibraryPanel";
import ListsPanel from "@/components/ListsPanel";
import DetailPanel from "@/components/DetailPanel";
import SettingsModal from "@/components/SettingsModal";
import { useStore } from "@/store/useStore";
import { applyPalette, buildPalette } from "@/theme/palette";
import "./styles/app.css";

export default function App() {
  const settings = useStore((s) => s.settings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Ensure palette is applied on first mount (covers the initial non-hydrated render).
  useEffect(() => {
    applyPalette(buildPalette(settings.themeColor, settings.darkMode));
    document.documentElement.style.setProperty(
      "--font-app",
      `"${settings.fontFamily}", "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`,
    );
  }, [settings.themeColor, settings.darkMode, settings.fontFamily]);

  return (
    <div className="app-root">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="app-body">
        <LibraryPanel />
        <ListsPanel />
        <DetailPanel />
      </main>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
