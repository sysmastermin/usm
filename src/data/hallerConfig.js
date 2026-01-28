export const GRID_UNIT_MM = 250;

export const HALLER_WIDTH_UNITS = [1, 1.5, 2, 2.5, 3];
export const HALLER_HEIGHT_UNITS = [1, 1.5, 2, 2.5, 3];
export const HALLER_DEPTH_UNITS = [0.75, 1, 1.25];

export const HALLER_COLORS = [
  { id: "pure_white", label: "Pure White", hex: "#F5F5F5" },
  { id: "graphite_black", label: "Graphite Black", hex: "#1F2933" },
  { id: "usm_green", label: "USM Green", hex: "#4CAF50" },
  { id: "golden_yellow", label: "Golden Yellow", hex: "#FACC15" },
  { id: "gentian_blue", label: "Gentian Blue", hex: "#2563EB" },
];

export const HALLER_PRESETS = {
  tvLowboard: {
    id: "tv_lowboard",
    name: "TV 로우보드 (3칸)",
    modules: [
      { width: 1.5, height: 1.5, depth: 1, color: "#1F2933", gridX: -1, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#4CAF50", gridX: 0, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#F5F5F5", gridX: 1, gridY: 0, gridZ: 0 },
    ],
  },
  sideboard: {
    id: "sideboard",
    name: "사이드보드 (2층)",
    modules: [
      { width: 1.5, height: 1.5, depth: 1, color: "#F5F5F5", gridX: -1, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#FACC15", gridX: 0, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#2563EB", gridX: 1, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#1F2933", gridX: -1, gridY: 1, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#4CAF50", gridX: 0, gridY: 1, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#F5F5F5", gridX: 1, gridY: 1, gridZ: 0 },
    ],
  },
};
