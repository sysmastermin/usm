import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Haller3DCanvas from "../components/Haller3DCanvas";
import {
  FRONT_TYPES,
  GRID_UNIT_MM,
  HALLER_COLORS,
  HALLER_DEPTH_UNITS,
  HALLER_HEIGHT_UNITS,
  HALLER_WIDTH_UNITS,
  HALLER_PRESETS,
  REFERENCE_PRICE_BASE_PER_UNIT,
  REFERENCE_PRICE_FRONT_TYPE_MULTIPLIER,
} from "../data/hallerConfig";

const createModule = (overrides = {}) => {
  return {
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
  };
};

const LOCAL_STORAGE_KEY = "usm-haller-configurator-v1";
const MAX_WIDTH_GRIDS = 8;
const MAX_HISTORY = 30;

const CONFIG_QUERY_KEY = "config";

function getConfigFromUrl() {
  if (typeof window === "undefined" || !window.location.search) return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(CONFIG_QUERY_KEY);
}

export default function ConfiguratorPage() {
  const [modules, setModules] = useState([
    createModule({ gridX: 0, gridY: 0, gridZ: 0 }),
  ]);
  const [selectedId, setSelectedId] = useState(() => modules[0]?.id ?? null);
  const [lastExportJson, setLastExportJson] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [configuratorMode, setConfiguratorMode] = useState("step");
  const [stepIndex, setStepIndex] = useState(0);
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const initialLoadDoneRef = useRef(false);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedId) ?? modules[0] ?? null,
    [modules, selectedId]
  );

  const configuration = useMemo(
    () => ({
      id: "simple-configuration",
      name: "단일 행 모듈 구성",
      modules,
    }),
    [modules]
  );

  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const configFromUrl = getConfigFromUrl();
    if (configFromUrl) {
      try {
        const json = decodeURIComponent(escape(atob(configFromUrl)));
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed.modules) && parsed.modules.length > 0) {
          const nextModules = parsed.modules.map((module) =>
            createModule({
              ...module,
              id: module.id || crypto.randomUUID(),
            })
          );
          setModules(nextModules);
          setSelectedId(nextModules[0]?.id ?? null);
          return;
        }
      } catch {
        // URL 구성이 깨져 있으면 localStorage로 폴백
      }
    }

    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
        return;
      }

      const nextModules = parsed.modules.map((module) =>
        createModule({
          ...module,
          id: module.id || crypto.randomUUID(),
        })
      );

      setModules(nextModules);
      setSelectedId(nextModules[0]?.id ?? null);
    } catch {
      // 저장된 값이 깨져 있어도 앱이 죽지 않도록 무시
    }
    // 최초 마운트 시 한 번만 실행
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
    historyRef.current.push(modules.map((m) => ({ ...m })));
    setModules(snapshot);
    setSelectedId(snapshot[0]?.id ?? null);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  };

  const handleModuleFieldChange = (key) => (event) => {
    if (!selectedModule) return;

    if (key === "color") {
      const colorValue = event.target.value;
      pushHistory();
      setModules((prev) =>
        prev.map((module) =>
          module.id === selectedModule.id
            ? { ...module, color: colorValue || module.color }
            : module
        )
      );
      return;
    }

    if (key === "frontType") {
      const frontValue = event.target.value;
      if (!["open", "door", "drawer", "glass"].includes(frontValue)) return;
      pushHistory();
      setModules((prev) =>
        prev.map((module) =>
          module.id === selectedModule.id
            ? { ...module, frontType: frontValue }
            : module
        )
      );
      return;
    }

    const rawValue = Number.parseFloat(event.target.value);
    const numericValue = Number.isFinite(rawValue) ? rawValue : 0;

    if (key === "gridX" || key === "gridY" || key === "gridZ") {
      const nextGridX =
        key === "gridX" ? Math.trunc(numericValue) : selectedModule.gridX;
      const nextGridY =
        key === "gridY" ? Math.trunc(numericValue) : selectedModule.gridY;
      const nextGridZ =
        key === "gridZ" ? Math.trunc(numericValue) : selectedModule.gridZ;

      if (nextGridY < 0) {
        // eslint-disable-next-line no-alert
        alert("바닥 아래로는 이동할 수 없습니다.");
        return;
      }

      if (nextGridY > 0) {
        const hasSupportBelow = modules.some(
          (module) =>
            module.id !== selectedModule.id &&
            module.gridX === nextGridX &&
            module.gridZ === nextGridZ &&
            module.gridY === nextGridY - 1
        );

        if (!hasSupportBelow) {
          // eslint-disable-next-line no-alert
          alert("아래에 모듈이 있어야 위로 쌓을 수 있습니다.");
          return;
        }
      }

      const hasConflict = modules.some(
        (module) =>
          module.id !== selectedModule.id &&
          module.gridX === nextGridX &&
          module.gridY === nextGridY &&
          module.gridZ === nextGridZ
      );

      if (hasConflict) {
        // eslint-disable-next-line no-alert
        alert("해당 위치에는 이미 다른 모듈이 있습니다.");
        return;
      }
    }

    pushHistory();
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== selectedModule.id) {
          return module;
        }

        const currentValue = module[key];
        const nextValue =
          key === "gridX" || key === "gridY" || key === "gridZ"
            ? Math.trunc(numericValue)
            : numericValue || currentValue;

        return {
          ...module,
          [key]: nextValue,
        };
      })
    );
  };

  const handleAddModule = () => {
    pushHistory();
    setModules((prev) => {
      const nextX = prev.length;
      if (nextX >= MAX_WIDTH_GRIDS) {
        // eslint-disable-next-line no-alert
        alert(`가로 폭은 최대 ${MAX_WIDTH_GRIDS} 그리드까지 가능합니다.`);
        return prev;
      }

      const next = [
        ...prev,
        createModule({
          gridX: nextX,
          gridY: 0,
          gridZ: 0,
          color: "#22c55e",
        }),
      ];
      const newModule = next[next.length - 1];
      setSelectedId(newModule.id);
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
      const next = prev.filter((module) => module.id !== selectedModule.id);
      if (next.length === 0) {
        setSelectedId(null);
      } else if (!next.some((module) => module.id === selectedId)) {
        setSelectedId(next[0].id);
      }
      return next;
    });
  };

  const handleLoadPreset = (key) => {
    const preset = HALLER_PRESETS[key];
    if (!preset) return;
    pushHistory();

    const nextModules = preset.modules.map((module) =>
      createModule({
        ...module,
        id: module.id || crypto.randomUUID(),
      })
    );

    setModules(nextModules);
    setSelectedId(nextModules[0]?.id ?? null);
    setImportError("");
  };

  const handleNewConfig = () => {
    pushHistory();
    const defaultModule = createModule({ gridX: 0, gridY: 0, gridZ: 0 });
    setModules([defaultModule]);
    setSelectedId(defaultModule.id);
    setImportError("");
  };

  const handleScreenshot = () => {
    const dataUrl = canvasRef.current?.captureAsDataURL?.("image/png");
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `usm-haller-configurator-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyShareLink = useCallback(async () => {
    const config = {
      id: configuration.id,
      name: configuration.name,
      modules,
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
        alert(`링크를 수동으로 복사하세요:\n${shareUrl}`);
      }
    } else {
      // eslint-disable-next-line no-alert
      alert(`링크를 수동으로 복사하세요:\n${shareUrl}`);
    }
  }, [configuration.id, configuration.name, modules]);

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
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (event.key === "Delete" || event.key === "Backspace") {
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
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleExportConfig = async () => {
    const config = {
      id: configuration.id,
      name: configuration.name,
      modules,
    };
    const json = JSON.stringify(config, null, 2);
    setLastExportJson(json);
    setImportText(json);
    setImportError("");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(json);
        // eslint-disable-next-line no-alert
        alert("구성 JSON이 클립보드에 복사되었습니다.");
      } catch {
        // 무시: 클립보드 권한이 없을 수 있음
      }
    }
  };

  const handleImportConfig = () => {
    setImportError("");
    const raw = importText.trim();
    if (!raw) return;
    pushHistory();

    let jsonString = raw;

    if (raw.includes("config=") || raw.startsWith("http")) {
      try {
        const url = raw.startsWith("http") ? raw : `${window.location.origin}${window.location.pathname}${raw.startsWith("?") ? raw : `?${raw}`}`;
        const params = new URLSearchParams(new URL(url).search);
        const base64 = params.get(CONFIG_QUERY_KEY);
        if (base64) {
          jsonString = decodeURIComponent(escape(atob(base64)));
        }
      } catch {
        // URL이 아니거나 파싱 실패 시 아래 JSON.parse에서 처리
      }
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.modules)) {
        throw new Error("modules 필드가 없습니다.");
      }

      const nextModules = parsed.modules.map((module) =>
        createModule({
          ...module,
          id: module.id || crypto.randomUUID(),
        })
      );

      setModules(nextModules);
      setSelectedId(nextModules[0]?.id ?? null);
    } catch (error) {
      setImportError("유효한 구성 JSON 또는 공유 링크가 아닙니다.");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const overallSize = useMemo(() => {
    if (modules.length === 0) {
      return { width: 0, height: 0, depth: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    modules.forEach((module) => {
      const { width, height, depth, gridX, gridY, gridZ } = module;
      const safeWidth = Number.isFinite(width) ? width : 0;
      const safeHeight = Number.isFinite(height) ? height : 0;
      const safeDepth = Number.isFinite(depth) ? depth : 0;

      const unit = 1.2;
      const xCenter = gridX * unit;
      const yCenter = safeHeight / 2 + gridY * unit;
      const zCenter = gridZ * unit;

      const xMin = xCenter - safeWidth / 2;
      const xMax = xCenter + safeWidth / 2;
      const yMin = yCenter - safeHeight / 2;
      const yMax = yCenter + safeHeight / 2;
      const zMin = zCenter - safeDepth / 2;
      const zMax = zCenter + safeDepth / 2;

      minX = Math.min(minX, xMin);
      maxX = Math.max(maxX, xMax);
      minY = Math.min(minY, yMin);
      maxY = Math.max(maxY, yMax);
      minZ = Math.min(minZ, zMin);
      maxZ = Math.max(maxZ, zMax);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    const toMm = (v) => v * GRID_UNIT_MM;

    return {
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ,
      widthMm: toMm(width),
      heightMm: toMm(height),
      depthMm: toMm(depth),
    };
  }, [modules]);

  const referencePrice = useMemo(() => {
    const base = REFERENCE_PRICE_BASE_PER_UNIT;
    const mult = REFERENCE_PRICE_FRONT_TYPE_MULTIPLIER;
    return modules.reduce((sum, m) => {
      const w = Number.isFinite(m.width) ? m.width : 1;
      const h = Number.isFinite(m.height) ? m.height : 1;
      const d = Number.isFinite(m.depth) ? m.depth : 1;
      const k = mult[m.frontType] ?? mult.open;
      return sum + base * w * h * d * k;
    }, 0);
  }, [modules]);

  useEffect(() => {
    const payload = {
      id: configuration.id,
      name: configuration.name,
      modules,
    };

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 용량 초과 또는 접근 문제는 조용히 무시
    }
  }, [configuration.id, configuration.name, modules]);

  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <div className="py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-4 md:mb-6">
              컨피규레이터
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed px-4">
              이상적인 가구를 디자인하세요. 용도, 공간, 취향에 맞춰 커스터마이징하며
              오리지널 가구를 만들 수 있습니다.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 px-4">
              USM 할러의 다양한 유닛을 온라인으로 디자인할 수 있는 도구입니다.
              커스터마이즈 가능한 사양과 함께 여러 색상에서 조합을 시험해 보시고,
              나만의 오리지널 가구를 디자인해 보세요.
            </p>

            <div className="max-w-xl mx-auto mb-8 rounded-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 text-left">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                기존 설정 불러오기
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                컨피규레이터 코드 또는 구성 JSON을 이미 가지고 계신가요?
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="JSON 또는 공유 링크 붙여넣기"
                  className="flex-1 min-w-0 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={handleImportConfig}
                  className="shrink-0 rounded-sm bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  불러오기
                </button>
              </div>
              {importError && (
                <p className="mt-2 text-xs text-red-500">{importError}</p>
              )}
            </div>

            <div className="max-w-2xl mx-auto mb-10 rounded-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 md:p-5 text-left">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                사용 방법
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                <li>가구 크기(폭·높이·깊이)를 선택합니다.</li>
                <li>모듈을 추가·배치하고, 필요 시 액세서리(도어·서랍 등)를 선택합니다.</li>
                <li>색상을 선택해 가구 전체 또는 개별 컴파트먼트 색을 지정합니다.</li>
                <li>디자인이 정해지면 구성 링크를 복사해 저장하거나 공유하세요.</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px,minmax(0,1fr),260px] gap-6 md:gap-8">
            <div className="space-y-4">
              {/* 단계형 플로우 인디케이터 */}
              <div className="bg-gray-100 dark:bg-gray-900/60 p-4 rounded-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    단계
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfiguratorMode((m) =>
                        m === "step" ? "direct" : "step"
                      )
                    }
                    className="text-[11px] text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
                  >
                    {configuratorMode === "step" ? "직접 편집" : "단계별로"}
                  </button>
                </div>
                {configuratorMode === "step" && (
                  <div className="flex gap-1 text-[11px]">
                    {[
                      { i: 0, label: "1. 크기" },
                      { i: 1, label: "2. 액세서리" },
                      { i: 2, label: "3. 색상" },
                    ].map(({ i, label }) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setStepIndex(i)}
                        className={`flex-1 rounded-sm border px-1.5 py-1.5 text-center ${
                          stepIndex === i
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-gray-400 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 단계형: Step 1 크기 */}
              {configuratorMode === "step" && stepIndex === 0 && (
                <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                  <h2 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                    1. 크기 선택
                  </h2>
                  <p className="text-xs mb-3 text-gray-500 dark:text-gray-400">
                    제품 타입을 선택하면 기본 칸 레이아웃이 적용됩니다.
                  </p>
                  <div className="flex flex-col gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleLoadPreset("sideboard")}
                      className="rounded-sm border border-gray-400 px-2 py-2 text-left text-[11px] font-medium text-gray-800 hover:border-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300"
                    >
                      USM 할러 사이드보드
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset("mediaStorage")}
                      className="rounded-sm border border-gray-400 px-2 py-2 text-left text-[11px] font-medium text-gray-800 hover:border-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300"
                    >
                      USM 할러 미디어 스토리지
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset("shelf")}
                      className="rounded-sm border border-gray-400 px-2 py-2 text-left text-[11px] font-medium text-gray-800 hover:border-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300"
                    >
                      USM 할러 선반
                    </button>
                  </div>
                  {modules.length > 0 && (
                    <>
                      <p className="text-xs mb-2 text-gray-500 dark:text-gray-400">
                        전체 모듈에 적용할 치수 (선택)
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span>폭</span>
                          <select
                            value={modules[0]?.width ?? 1}
                            onChange={(e) => {
                              const v = Number.parseFloat(e.target.value);
                              if (!Number.isFinite(v)) return;
                              pushHistory();
                              setModules((prev) =>
                                prev.map((m) => ({ ...m, width: v }))
                              );
                            }}
                            className="w-20 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                          >
                            {HALLER_WIDTH_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>높이</span>
                          <select
                            value={modules[0]?.height ?? 1}
                            onChange={(e) => {
                              const v = Number.parseFloat(e.target.value);
                              if (!Number.isFinite(v)) return;
                              pushHistory();
                              setModules((prev) =>
                                prev.map((m) => ({ ...m, height: v }))
                              );
                            }}
                            className="w-20 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                          >
                            {HALLER_HEIGHT_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>깊이</span>
                          <select
                            value={modules[0]?.depth ?? 1}
                            onChange={(e) => {
                              const v = Number.parseFloat(e.target.value);
                              if (!Number.isFinite(v)) return;
                              pushHistory();
                              setModules((prev) =>
                                prev.map((m) => ({ ...m, depth: v }))
                              );
                            }}
                            className="w-20 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                          >
                            {HALLER_DEPTH_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setStepIndex(1)}
                    className="mt-4 w-full rounded-sm bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                  >
                    다음: 액세서리
                  </button>
                </div>
              )}

              {/* 단계형: Step 2 액세서리 */}
              {configuratorMode === "step" && stepIndex === 1 && (
                <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                  <h2 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                    2. 액세서리 (앞면 타입)
                  </h2>
                  <p className="text-xs mb-3 text-gray-500 dark:text-gray-400">
                    각 칸별로 오픈/도어/서랍/글라스 중 하나를 선택하세요.
                  </p>
                  <div className="space-y-2 mb-3">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between gap-2 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5"
                      >
                        <span className="text-xs">칸 {index + 1}</span>
                        <select
                          value={module.frontType ?? "open"}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!["open", "door", "drawer", "glass"].includes(v)) return;
                            pushHistory();
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id === module.id ? { ...m, frontType: v } : m
                              )
                            );
                          }}
                          className="w-24 rounded-sm border border-gray-300 dark:border-gray-700 px-1.5 py-1 text-[11px]"
                        >
                          {FRONT_TYPES.map((ft) => (
                            <option key={ft.id} value={ft.id}>{ft.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStepIndex(2)}
                    className="mt-2 w-full rounded-sm bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                  >
                    다음: 색상
                  </button>
                </div>
              )}

              {/* 단계형: Step 3 색상 */}
              {configuratorMode === "step" && stepIndex === 2 && (
                <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                  <h2 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                    3. 색상 선택
                  </h2>
                  <p className="text-xs mb-3 text-gray-500 dark:text-gray-400">
                    각 칸별 색상을 선택하세요.
                  </p>
                  <div className="space-y-2 mb-3">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between gap-2 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5"
                      >
                        <span className="text-xs flex items-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 rounded-sm border border-black/20"
                            style={{ backgroundColor: module.color }}
                          />
                          칸 {index + 1}
                        </span>
                        <select
                          value={module.color}
                          onChange={(e) => {
                            const v = e.target.value;
                            pushHistory();
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id === module.id ? { ...m, color: v } : m
                              )
                            );
                          }}
                          className="w-28 rounded-sm border border-gray-300 dark:border-gray-700 px-1.5 py-1 text-[11px]"
                        >
                          {HALLER_COLORS.map((c) => (
                            <option key={c.id} value={c.hex}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStepIndex(0)}
                    className="mt-2 w-full rounded-sm border border-gray-400 px-3 py-1.5 text-xs font-medium text-gray-800 dark:border-gray-600 dark:text-gray-200"
                  >
                    처음부터 다시
                  </button>
                </div>
              )}

              {/* 직접 편집: 제품 타입 / 프리셋 + 모듈 목록 */}
              {configuratorMode === "direct" && (
                <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                  <h2 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                    제품 타입 / 프리셋
                  </h2>
                  <div className="mb-3 flex flex-col gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleLoadPreset("sideboard")}
                      className="rounded-sm border border-gray-400 px-2 py-2 text-left text-[11px] font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                    >
                      USM 할러 사이드보드
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset("mediaStorage")}
                      className="rounded-sm border border-gray-400 px-2 py-2 text-left text-[11px] font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                    >
                      USM 할러 미디어 스토리지
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset("shelf")}
                      className="rounded-sm border border-gray-400 px-2 py-2 text-left text-[11px] font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                    >
                      USM 할러 선반
                    </button>
                  </div>
                  <div className="space-y-2 mb-3 text-xs md:text-sm">
                    {modules.map((module, index) => (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => handleSelectModule(module.id)}
                        className={`flex w-full items-center justify-between rounded-sm border px-2 py-1.5 text-left text-xs transition-colors ${
                          module.id === selectedModule?.id
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="truncate">
                          모듈 {index + 1}{" "}
                          <span className="opacity-70">
                            ({module.width}×{module.height}×{module.depth})
                          </span>
                        </span>
                        <span
                          className="ml-2 inline-block h-3 w-3 rounded-sm border border-black/20 dark:border-white/40"
                          style={{ backgroundColor: module.color }}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="inline-flex w-full items-center justify-center rounded-sm border border-dashed border-gray-400 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                  >
                    + 모듈 추가
                  </button>
                  <button
                    type="button"
                    onClick={handleNewConfig}
                    className="inline-flex w-full items-center justify-center rounded-sm border border-gray-400 px-2 py-1.5 text-xs font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white mt-2 w-full"
                  >
                    새 구성
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="flex-1 rounded-sm border border-gray-400 px-2 py-1.5 text-xs font-medium text-gray-800 hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                    >
                      되돌리기
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="flex-1 rounded-sm border border-gray-400 px-2 py-1.5 text-xs font-medium text-gray-800 hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                    >
                      다시 실행
                    </button>
                  </div>
                </div>
              )}

              {selectedModule && configuratorMode === "direct" && (
                <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                  <h2 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                    선택된 모듈 설정
                  </h2>
                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-gray-600 dark:text-gray-300">
                        폭 (width)
                      </label>
                      <select
                        value={selectedModule.width}
                        onChange={handleModuleFieldChange("width")}
                        className="w-24 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right text-xs"
                      >
                        {HALLER_WIDTH_UNITS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-gray-600 dark:text-gray-300">
                        높이 (height)
                      </label>
                      <select
                        value={selectedModule.height}
                        onChange={handleModuleFieldChange("height")}
                        className="w-24 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right text-xs"
                      >
                        {HALLER_HEIGHT_UNITS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-gray-600 dark:text-gray-300">
                        깊이 (depth)
                      </label>
                      <select
                        value={selectedModule.depth}
                        onChange={handleModuleFieldChange("depth")}
                        className="w-24 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right text-xs"
                      >
                        {HALLER_DEPTH_UNITS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-dashed border-gray-300 dark:border-gray-700 mt-2">
                      <span className="text-gray-600 dark:text-gray-300">
                        위치 (gridX, Y, Z)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1"
                          value={selectedModule.gridX}
                          onChange={handleModuleFieldChange("gridX")}
                          className="w-10 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 py-1 text-center text-[11px]"
                        />
                        <input
                          type="number"
                          step="1"
                          value={selectedModule.gridY}
                          onChange={handleModuleFieldChange("gridY")}
                          className="w-10 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 py-1 text-center text-[11px]"
                        />
                        <input
                          type="number"
                          step="1"
                          value={selectedModule.gridZ}
                          onChange={handleModuleFieldChange("gridZ")}
                          className="w-10 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 py-1 text-center text-[11px]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-gray-600 dark:text-gray-300">
                        앞면 타입
                      </label>
                      <select
                        value={selectedModule.frontType ?? "open"}
                        onChange={handleModuleFieldChange("frontType")}
                        className="w-28 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                      >
                        {FRONT_TYPES.map((ft) => (
                          <option key={ft.id} value={ft.id}>
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-gray-600 dark:text-gray-300">
                        컬러
                      </label>
                      <select
                        value={selectedModule.color}
                        onChange={handleModuleFieldChange("color")}
                        className="w-28 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                      >
                        {HALLER_COLORS.map((color) => (
                          <option key={color.id} value={color.hex}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleRemoveSelectedModule}
                        className="w-full rounded-sm border border-red-400 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:border-red-500 hover:text-red-700 dark:border-red-500 dark:text-red-300 dark:hover:border-red-400 dark:hover:text-red-200"
                      >
                        선택된 모듈 삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-900/60 p-3 md:p-4 rounded-sm">
              <Haller3DCanvas
                ref={canvasRef}
                configuration={configuration}
                selectedModuleId={selectedModule?.id ?? null}
                onSelectModule={handleSelectModule}
              />
              <button
                type="button"
                onClick={handleScreenshot}
                className="mt-2 w-full rounded-sm border border-gray-400 px-2 py-1.5 text-xs font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
              >
                스크린샷 저장
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                <h2 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  구성 정보
                </h2>
                <div className="space-y-2 text-xs md:text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      참고 가격
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {referencePrice.toLocaleString("ko-KR")}원
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      모듈 개수
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {modules.length}개
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      전체 폭 (grid / mm)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {overallSize.width.toFixed(2)} /{" "}
                      {overallSize.widthMm.toFixed(0)}mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      전체 높이 (grid / mm)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {overallSize.height.toFixed(2)} /{" "}
                      {overallSize.heightMm.toFixed(0)}mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      전체 깊이 (grid / mm)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {overallSize.depth.toFixed(2)} /{" "}
                      {overallSize.depthMm.toFixed(0)}mm
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <button
                    type="button"
                    onClick={handleExportConfig}
                    className="w-full rounded-sm bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    구성 JSON 복사
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="w-full rounded-sm border border-gray-400 px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                  >
                    구성 링크 복사
                  </button>
                  <textarea
                    value={importText}
                    onChange={(event) => setImportText(event.target.value)}
                    placeholder="JSON을 붙여넣고 불러오기를 눌러주세요."
                    rows={4}
                    className="w-full resize-none rounded-sm border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={handleImportConfig}
                    className="w-full rounded-sm border border-gray-400 px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                  >
                    JSON에서 구성 불러오기
                  </button>
                  {importError && (
                    <p className="text-[11px] text-red-500">{importError}</p>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  아래 링크에서 공식 USM 컨피규레이터도 함께 참고하실 수
                  있습니다.
                </p>
              </div>

              <div className="px-1">
                <a
                  href="https://jp.shop.usm.com/pages/scene"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center bg-black dark:bg-white text-white dark:text-black px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  공식 사이트에서 확인하기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
