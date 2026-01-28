import { useEffect, useMemo, useState } from "react";
import Haller3DCanvas from "../components/Haller3DCanvas";
import {
  GRID_UNIT_MM,
  HALLER_COLORS,
  HALLER_DEPTH_UNITS,
  HALLER_HEIGHT_UNITS,
  HALLER_WIDTH_UNITS,
  HALLER_PRESETS,
} from "../data/hallerConfig";

const createModule = (overrides = {}) => {
  return {
    id: crypto.randomUUID(),
    width: 1,
    height: 1,
    depth: 1,
    color: "#f97316",
    gridX: 0,
    gridY: 0,
    gridZ: 0,
    ...overrides,
  };
};

const LOCAL_STORAGE_KEY = "usm-haller-configurator-v1";
const MAX_WIDTH_GRIDS = 8;

export default function ConfiguratorPage() {
  const [modules, setModules] = useState([
    createModule({ gridX: 0, gridY: 0, gridZ: 0 }),
  ]);
  const [selectedId, setSelectedId] = useState(() => modules[0]?.id ?? null);
  const [lastExportJson, setLastExportJson] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedId) ?? modules[0] ?? null,
    [modules, selectedId]
  );

  useEffect(() => {
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

  const handleModuleFieldChange = (key) => (event) => {
    if (!selectedModule) return;

    if (key === "color") {
      const colorValue = event.target.value;
      setModules((prev) =>
        prev.map((module) =>
          module.id === selectedModule.id
            ? { ...module, color: colorValue || module.color }
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
    if (!importText.trim()) return;

    try {
      const parsed = JSON.parse(importText);
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
      setImportError("유효한 구성 JSON이 아닙니다.");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const configuration = useMemo(
    () => ({
      id: "simple-configuration",
      name: "단일 행 모듈 구성",
      modules,
    }),
    [modules]
  );

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
          <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-4 md:mb-6">
              3D 컨피규레이터
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-4 md:mb-6 leading-relaxed px-4">
              USM 할러 모듈러 가구를 3D로 직접 구성하고 시각화해보세요.
              현재는 단일 모듈의 크기와 컬러를 조절하는 기본 뷰어 단계입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px,minmax(0,1fr),260px] gap-6 md:gap-8">
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                <h2 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                  모듈 목록 / 프리셋
                </h2>
                <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset("tvLowboard")}
                    className="rounded-sm border border-gray-400 px-2 py-1 text-[11px] font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                  >
                    TV 로우보드
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset("sideboard")}
                    className="rounded-sm border border-gray-400 px-2 py-1 text-[11px] font-medium text-gray-800 hover:border-gray-600 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 dark:hover:text-white"
                  >
                    사이드보드
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
              </div>

              {selectedModule && (
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
                configuration={configuration}
                selectedModuleId={selectedModule?.id ?? null}
                onSelectModule={handleSelectModule}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-900/60 p-4 md:p-5 rounded-sm text-sm text-gray-600 dark:text-gray-300">
                <h2 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  구성 정보
                </h2>
                <div className="space-y-2 text-xs md:text-sm mb-4">
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
