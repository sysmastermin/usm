import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import Haller3DCanvas from "../components/Haller3DCanvas";
import {
  BASE_TYPES,
  FRONT_TYPES,
  GRID_UNIT_MM,
  HALLER_COLORS,
  HALLER_DEPTH_UNITS,
  HALLER_HEIGHT_UNITS,
  HALLER_WIDTH_UNITS,
  HALLER_PRESETS,
  REFERENCE_PRICE_BASE_PER_UNIT,
  REFERENCE_PRICE_BASE_TYPE_ADDITION,
  REFERENCE_PRICE_FRONT_TYPE_MULTIPLIER,
} from "../data/hallerConfig";

const createModule = (overrides = {}) => ({
  id: crypto.randomUUID(),
  width: 1,
  height: 1,
  depth: 1,
  color: "#F4F4F4",
  frontType: "open",
  gridX: 0,
  gridY: 0,
  gridZ: 0,
  ...overrides,
});

const LOCAL_STORAGE_KEY = "usm-haller-configurator-v1";
const MAX_WIDTH_GRIDS = 8;
const MAX_HISTORY = 30;
const CONFIG_QUERY_KEY = "config";

function getConfigFromUrl() {
  if (
    typeof window === "undefined" ||
    !window.location.search
  ) {
    return null;
  }
  const params = new URLSearchParams(
    window.location.search
  );
  return params.get(CONFIG_QUERY_KEY);
}

const FRONT_ICONS = {
  open: (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="20"
        y1="4"
        x2="20"
        y2="36"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle
        cx="16"
        cy="20"
        r="1.5"
        fill="currentColor"
      />
    </svg>
  ),
  drawer: (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="4"
        y1="20"
        x2="36"
        y2="20"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="16"
        y1="12"
        x2="24"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="28"
        x2="24"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  glass: (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y="8"
        width="24"
        height="24"
        rx="1"
        fill="currentColor"
        opacity="0.1"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  ),
};

export default function ConfiguratorPage() {
  const [modules, setModules] = useState([
    createModule({ gridX: 0, gridY: 0, gridZ: 0 }),
  ]);
  const [selectedId, setSelectedId] = useState(
    () => modules[0]?.id ?? null
  );
  const [baseType, setBaseType] = useState("glide");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const initialLoadDoneRef = useRef(false);

  const selectedModule = useMemo(
    () =>
      modules.find((m) => m.id === selectedId) ??
      modules[0] ??
      null,
    [modules, selectedId]
  );

  const configuration = useMemo(
    () => ({
      id: "simple-configuration",
      name: "단일 행 모듈 구성",
      modules,
      baseType,
    }),
    [modules, baseType]
  );

  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const configFromUrl = getConfigFromUrl();
    if (configFromUrl) {
      try {
        const json = decodeURIComponent(
          escape(atob(configFromUrl))
        );
        const parsed = JSON.parse(json);
        if (
          Array.isArray(parsed.modules) &&
          parsed.modules.length > 0
        ) {
          const next = parsed.modules.map((m) =>
            createModule({
              ...m,
              id: m.id || crypto.randomUUID(),
            })
          );
          setModules(next);
          setSelectedId(next[0]?.id ?? null);
          if (parsed.baseType) setBaseType(parsed.baseType);
          return;
        }
      } catch {
        /* fallback to localStorage */
      }
    }

    try {
      const stored = window.localStorage.getItem(
        LOCAL_STORAGE_KEY
      );
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (
        !Array.isArray(parsed.modules) ||
        parsed.modules.length === 0
      ) {
        return;
      }
      const next = parsed.modules.map((m) =>
        createModule({
          ...m,
          id: m.id || crypto.randomUUID(),
        })
      );
      setModules(next);
      setSelectedId(next[0]?.id ?? null);
      if (parsed.baseType) setBaseType(parsed.baseType);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHistory = () => {
    const snapshot = modules.map((m) => ({ ...m }));
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      snapshot,
    ];
    redoRef.current = [];
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const snapshot = historyRef.current.pop();
    redoRef.current.push(modules.map((m) => ({ ...m })));
    setModules(snapshot);
    setSelectedId(snapshot[0]?.id ?? null);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  };

  const handleRedo = () => {
    if (redoRef.current.length === 0) return;
    const snapshot = redoRef.current.pop();
    historyRef.current.push(
      modules.map((m) => ({ ...m }))
    );
    setModules(snapshot);
    setSelectedId(snapshot[0]?.id ?? null);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  };

  const setAllModulesField = (key, value) => {
    pushHistory();
    setModules((prev) =>
      prev.map((m) => ({ ...m, [key]: value }))
    );
  };

  const setSelectedModuleField = (key, value) => {
    if (!selectedModule) return;
    pushHistory();
    setModules((prev) =>
      prev.map((m) =>
        m.id === selectedModule.id
          ? { ...m, [key]: value }
          : m
      )
    );
  };

  const canAddAt = useCallback(
    (direction) => {
      if (!selectedModule) return false;
      const { gridX, gridY, gridZ } = selectedModule;
      let nx = gridX;
      let ny = gridY;
      switch (direction) {
        case "right":
          nx = gridX - 1;
          break;
        case "left":
          nx = gridX + 1;
          break;
        case "up":
          ny = gridY + 1;
          break;
        case "down":
          ny = gridY - 1;
          break;
        default:
          return false;
      }
      if (ny < 0) return false;
      const conflict = modules.some(
        (m) =>
          m.gridX === nx &&
          m.gridY === ny &&
          m.gridZ === gridZ
      );
      if (conflict) return false;
      if (ny > 0 && direction !== "down") {
        const hasSupport = modules.some(
          (m) =>
            m.gridX === nx &&
            m.gridY === ny - 1 &&
            m.gridZ === gridZ
        );
        if (!hasSupport) return false;
      }
      return true;
    },
    [selectedModule, modules]
  );

  const handleAddModuleAt = useCallback(
    (direction) => {
      if (!selectedModule) return;
      const { gridX, gridY, gridZ } = selectedModule;
      let nx = gridX;
      let ny = gridY;
      switch (direction) {
        case "right":
          nx = gridX - 1;
          break;
        case "left":
          nx = gridX + 1;
          break;
        case "up":
          ny = gridY + 1;
          break;
        case "down":
          ny = gridY - 1;
          break;
        default:
          return;
      }
      if (ny < 0) return;
      const conflict = modules.some(
        (m) =>
          m.gridX === nx &&
          m.gridY === ny &&
          m.gridZ === gridZ
      );
      if (conflict) return;
      if (ny > 0 && direction !== "down") {
        const hasSupport = modules.some(
          (m) =>
            m.gridX === nx &&
            m.gridY === ny - 1 &&
            m.gridZ === gridZ
        );
        if (!hasSupport) return;
      }
      pushHistory();
      const newMod = createModule({
        gridX: nx,
        gridY: ny,
        gridZ: gridZ,
        width: selectedModule.width,
        height: selectedModule.height,
        depth: selectedModule.depth,
        color: selectedModule.color,
        frontType: selectedModule.frontType,
      });
      setModules((prev) => [...prev, newMod]);
      setSelectedId(newMod.id);
    },
    [selectedModule, modules, pushHistory]
  );

  const handleAddModule = () => {
    if (selectedModule) {
      handleAddModuleAt("right");
      return;
    }
    pushHistory();
    setModules((prev) => {
      const nextX = prev.length
        ? Math.max(...prev.map((m) => m.gridX)) + 1
        : 0;
      if (nextX >= MAX_WIDTH_GRIDS) {
        // eslint-disable-next-line no-alert
        alert(
          `가로 폭은 최대 ${MAX_WIDTH_GRIDS} 그리드까지 가능합니다.`
        );
        return prev;
      }
      const next = [
        ...prev,
        createModule({
          gridX: nextX,
          gridY: 0,
          gridZ: 0,
          color: "#F4F4F4",
        }),
      ];
      setSelectedId(next[next.length - 1].id);
      return next;
    });
  };

  const handleSelectModule = (id) => {
    setSelectedId(id);
  };

  const handleRemoveSelectedModule = () => {
    if (!selectedModule) return;
    pushHistory();
    setModules((prev) => {
      const next = prev.filter(
        (m) => m.id !== selectedModule.id
      );
      if (next.length === 0) {
        setSelectedId(null);
      } else if (
        !next.some((m) => m.id === selectedId)
      ) {
        setSelectedId(next[0].id);
      }
      return next;
    });
  };

  const handleLoadPreset = (key) => {
    const preset = HALLER_PRESETS[key];
    if (!preset) return;
    pushHistory();
    const next = preset.modules.map((m) =>
      createModule({
        ...m,
        id: m.id || crypto.randomUUID(),
      })
    );
    setModules(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const handleNewConfig = () => {
    pushHistory();
    const mod = createModule({
      gridX: 0,
      gridY: 0,
      gridZ: 0,
    });
    setModules([mod]);
    setSelectedId(mod.id);
  };

  const handleScreenshot = () => {
    const dataUrl =
      canvasRef.current?.captureAsDataURL?.("image/png");
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `usm-haller-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyShareLink = useCallback(async () => {
    const config = {
      id: configuration.id,
      name: configuration.name,
      modules,
      baseType,
    };
    const json = JSON.stringify(config);
    let base64;
    try {
      base64 = btoa(unescape(encodeURIComponent(json)));
    } catch {
      base64 = btoa(json);
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?${CONFIG_QUERY_KEY}=${encodeURIComponent(base64)}`;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        const newUrl = `${window.location.pathname}?${CONFIG_QUERY_KEY}=${encodeURIComponent(base64)}`;
        window.history.replaceState(null, "", newUrl);
        // eslint-disable-next-line no-alert
        alert("구성 링크가 클립보드에 복사되었습니다.");
      } catch {
        // eslint-disable-next-line no-alert
        alert(
          `링크를 수동으로 복사하세요:\n${shareUrl}`
        );
      }
    } else {
      // eslint-disable-next-line no-alert
      alert(
        `링크를 수동으로 복사하세요:\n${shareUrl}`
      );
    }
  }, [configuration.id, configuration.name, modules, baseType]);

  const keyHandlersRef = useRef({
    handleUndo: () => {},
    handleRedo: () => {},
    handleRemoveSelectedModule: () => {},
  });
  keyHandlersRef.current.handleUndo = handleUndo;
  keyHandlersRef.current.handleRedo = handleRedo;
  keyHandlersRef.current.handleRemoveSelectedModule =
    handleRemoveSelectedModule;

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName?.toUpperCase?.();
      if (
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "TEXTAREA"
      ) {
        return;
      }
      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        event.preventDefault();
        keyHandlersRef.current.handleRemoveSelectedModule();
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "z") {
          event.preventDefault();
          if (event.shiftKey) {
            keyHandlersRef.current.handleRedo();
          } else {
            keyHandlersRef.current.handleUndo();
          }
          return;
        }
        if (event.key === "y") {
          event.preventDefault();
          keyHandlersRef.current.handleRedo();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, []);

  const referencePrice = useMemo(() => {
    const base = REFERENCE_PRICE_BASE_PER_UNIT;
    const mult = REFERENCE_PRICE_FRONT_TYPE_MULTIPLIER;
    const baseAdd =
      REFERENCE_PRICE_BASE_TYPE_ADDITION[baseType] ?? 0;
    const bottomCount = modules.filter(
      (m) => m.gridY === 0
    ).length;
    return (
      modules.reduce((sum, m) => {
        const w = Number.isFinite(m.width) ? m.width : 1;
        const h = Number.isFinite(m.height)
          ? m.height
          : 1;
        const d = Number.isFinite(m.depth) ? m.depth : 1;
        const k = mult[m.frontType] ?? mult.open;
        return sum + base * w * h * d * k;
      }, 0) +
      baseAdd * bottomCount
    );
  }, [modules, baseType]);

  useEffect(() => {
    const payload = {
      id: configuration.id,
      name: configuration.name,
      modules,
      baseType,
    };
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch {
      /* ignore */
    }
  }, [
    configuration.id,
    configuration.name,
    modules,
    baseType,
  ]);

  const selectedModuleIndex = modules.findIndex(
    (m) => m.id === selectedId
  );

  const TABS = [
    { label: "프레임" },
    { label: "액세서리" },
    { label: "색상" },
  ];

  const DimButton = ({ value, unit, field, allModules }) => {
    const mm = Math.round(value * GRID_UNIT_MM);
    const currentVal = allModules
      ? modules[0]?.[field]
      : selectedModule?.[field];
    const isActive = currentVal === value;
    return (
      <button
        type="button"
        onClick={() => {
          if (allModules) {
            setAllModulesField(field, value);
          } else {
            setSelectedModuleField(field, value);
          }
        }}
        className={`px-2.5 py-1.5 text-xs font-medium border transition-colors ${
          isActive
            ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:border-gray-400"
        }`}
      >
        {mm}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      {/* ── Top Toolbar ─────────────────────────── */}
      <div className="flex items-center justify-between h-11 px-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className="text-xs font-bold tracking-widest text-gray-900 dark:text-white mr-3"
          >
            USM
          </Link>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mr-1" />
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="되돌리기 (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="다시 실행 (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4"
              />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            type="button"
            onClick={handleRemoveSelectedModule}
            disabled={!selectedModule}
            title="선택 모듈 삭제 (Delete)"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyShareLink}
            title="구성 링크 복사"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleScreenshot}
            title="스크린샷 저장"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            title="도움말"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <div className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
          ₩{referencePrice.toLocaleString("ko-KR")}
        </div>
      </div>

      {/* ── Help Overlay ────────────────────────── */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              사용 방법
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>
                프레임 탭에서 깊이/높이/너비를 선택합니다.
              </li>
              <li>
                액세서리 탭에서 도어/서랍/글라스를
                설정합니다.
              </li>
              <li>
                색상 탭에서 각 모듈의 색상을 지정합니다.
              </li>
              <li>
                공유 버튼으로 구성 링크를 복사하세요.
              </li>
            </ol>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              단축키: Ctrl+Z (되돌리기), Delete (삭제),
              Ctrl+Y (다시 실행)
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded bg-black text-white py-2 text-sm font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── Main Area: Left Panel + 3D Viewer ──── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ─────────────────────────── */}
        <div className="w-[280px] shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80">
          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                  activeTab === i
                    ? "text-black dark:text-white border-b-2 border-black dark:border-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* ── Frame Tab ──────────────────── */}
            {activeTab === 0 && (
              <>
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    받침대
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BASE_TYPES.map((bt) => (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() =>
                          setBaseType(bt.id)
                        }
                        className={`px-2.5 py-1.5 rounded text-xs border transition-colors ${
                          baseType === bt.id
                            ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-500 dark:hover:border-gray-400"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    깊이 (mm)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {HALLER_DEPTH_UNITS.map((u) => (
                      <DimButton
                        key={u}
                        value={u}
                        unit={u}
                        field="depth"
                        allModules
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    높이 (mm)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {HALLER_HEIGHT_UNITS.map((u) => (
                      <DimButton
                        key={u}
                        value={u}
                        unit={u}
                        field="height"
                        allModules
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    너비 (mm)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {HALLER_WIDTH_UNITS.map((u) => (
                      <DimButton
                        key={u}
                        value={u}
                        unit={u}
                        field="width"
                        allModules
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    프리셋
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(HALLER_PRESETS).map(
                      ([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            handleLoadPreset(key)
                          }
                          className="text-left text-xs px-2.5 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-500 dark:hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {preset.name}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    모듈 ({modules.length}개)
                  </p>
                  <div className="space-y-1">
                    {modules.map((mod, idx) => (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() =>
                          handleSelectModule(mod.id)
                        }
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                          mod.id === selectedId
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-sm border border-black/20 dark:border-white/30 shrink-0"
                          style={{
                            backgroundColor: mod.color,
                          }}
                        />
                        <span className="truncate">
                          모듈 {idx + 1}
                        </span>
                        <span className="opacity-60 ml-auto text-[10px]">
                          {Math.round(
                            mod.width * GRID_UNIT_MM
                          )}
                          ×
                          {Math.round(
                            mod.height * GRID_UNIT_MM
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedModule && (
                    <div className="mt-3">
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        인접 추가
                      </p>
                      <div className="grid grid-cols-3 gap-1 w-[160px] mx-auto">
                        <span />
                        <button
                          type="button"
                          disabled={!canAddAt("up")}
                          onClick={() =>
                            handleAddModuleAt("up")
                          }
                          className={`rounded border text-xs py-1.5 transition-colors ${
                            canAddAt("up")
                              ? "border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          ▲ 위
                        </button>
                        <span />

                        <button
                          type="button"
                          disabled={!canAddAt("left")}
                          onClick={() =>
                            handleAddModuleAt("left")
                          }
                          className={`rounded border text-xs py-1.5 transition-colors ${
                            canAddAt("left")
                              ? "border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          ◀ 좌
                        </button>
                        <span className="flex items-center justify-center text-[10px] text-gray-400 dark:text-gray-500">
                          선택
                        </span>
                        <button
                          type="button"
                          disabled={!canAddAt("right")}
                          onClick={() =>
                            handleAddModuleAt("right")
                          }
                          className={`rounded border text-xs py-1.5 transition-colors ${
                            canAddAt("right")
                              ? "border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          우 ▶
                        </button>

                        <span />
                        <button
                          type="button"
                          disabled={!canAddAt("down")}
                          onClick={() =>
                            handleAddModuleAt("down")
                          }
                          className={`rounded border text-xs py-1.5 transition-colors ${
                            canAddAt("down")
                              ? "border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          ▼ 아래
                        </button>
                        <span />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={handleAddModule}
                      className="flex-1 rounded border border-dashed border-gray-400 dark:border-gray-600 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:border-gray-600 dark:hover:border-gray-400 transition-colors"
                    >
                      + 추가
                    </button>
                    <button
                      type="button"
                      onClick={handleNewConfig}
                      className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Accessories Tab ────────────── */}
            {activeTab === 1 && (
              <>
                {selectedModule ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">
                        모듈 {selectedModuleIndex + 1}
                      </span>{" "}
                      선택됨
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FRONT_TYPES.map((ft) => {
                        const isActive =
                          selectedModule.frontType ===
                          ft.id;
                        return (
                          <button
                            key={ft.id}
                            type="button"
                            onClick={() =>
                              setSelectedModuleField(
                                "frontType",
                                ft.id
                              )
                            }
                            className={`flex flex-col items-center gap-1.5 rounded border-2 px-3 py-3 text-xs font-medium transition-colors ${
                              isActive
                                ? "border-black bg-gray-100 text-black dark:border-white dark:bg-gray-800 dark:text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500"
                            }`}
                          >
                            {FRONT_ICONS[ft.id]}
                            {ft.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        전체 모듈 일괄 변경
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {FRONT_TYPES.map((ft) => (
                          <button
                            key={ft.id}
                            type="button"
                            onClick={() =>
                              setAllModulesField(
                                "frontType",
                                ft.id
                              )
                            }
                            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-300 hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                          >
                            전체 {ft.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg
                      className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      />
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      3D 뷰어에서 모듈을
                      <br />
                      클릭하여 선택하세요
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── Color Tab ──────────────────── */}
            {activeTab === 2 && (
              <>
                {selectedModule ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">
                        모듈 {selectedModuleIndex + 1}
                      </span>{" "}
                      선택됨
                    </p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {HALLER_COLORS.map((c) => {
                        const isActive =
                          selectedModule.color === c.hex;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setSelectedModuleField(
                                "color",
                                c.hex
                              )
                            }
                            title={c.label}
                            className={`w-full aspect-square rounded-sm transition-all ${
                              isActive
                                ? "ring-2 ring-black dark:ring-white ring-offset-1 dark:ring-offset-gray-900 scale-110"
                                : "ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-gray-500 dark:hover:ring-gray-400"
                            }`}
                            style={{
                              backgroundColor: c.hex,
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      {HALLER_COLORS.find(
                        (c) =>
                          c.hex === selectedModule.color
                      )?.label ?? "사용자 색상"}
                    </p>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        전체 모듈 일괄 색상 변경
                      </p>
                      <div className="grid grid-cols-7 gap-1">
                        {HALLER_COLORS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setAllModulesField(
                                "color",
                                c.hex
                              )
                            }
                            title={`전체: ${c.label}`}
                            className="w-full aspect-square rounded-sm ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-gray-500 dark:hover:ring-gray-400 transition-all"
                            style={{
                              backgroundColor: c.hex,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg
                      className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      3D 뷰어에서 모듈을
                      <br />
                      클릭하여 선택하세요
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Bottom Price + CTA ───────────── */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 shrink-0 bg-white dark:bg-gray-900">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                참고 가격
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                ₩
                {referencePrice.toLocaleString("ko-KR")}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">
              세금 포함 / 참고 가격입니다
            </p>
            <a
              href="https://jp.shop.usm.com/pages/scene"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center rounded border border-black dark:border-white py-2 text-xs font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>

        {/* ── 3D Viewer ──────────────────────────── */}
        <div className="flex-1 min-w-0 h-full">
          <Haller3DCanvas
            ref={canvasRef}
            configuration={configuration}
            selectedModuleId={selectedModule?.id ?? null}
            onSelectModule={handleSelectModule}
          />
        </div>
      </div>
    </div>
  );
}
