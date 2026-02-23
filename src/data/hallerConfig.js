export const GRID_UNIT_MM = 250;

/** Phase B: glTF 자산 경로. 자산 준비 후 public/models/haller 또는 CDN URL 설정. */
export const HALLER_GLTF_BASE_URL = "";

/** Phase B-3: frontType별 glTF 파일 매핑. 자산 확보 후 파일명 지정. */
export const HALLER_GLTF_MODELS = {
  frame: "frame.glb",
  open: "frame.glb",
  door: "door.glb",
  drawer: "drawer.glb",
  glass: "glass.glb",
  glide: "glide.glb",
};

/** 참고 가격: 그리드 1단위(1×1×1) 기준 기본 단가 (원). 실제 단가는 백엔드/CS 확정 후 연동. */
export const REFERENCE_PRICE_BASE_PER_UNIT = 80000;

/** 앞면 타입별 참고 단가 계수 (기본 1.0 대비) */
export const REFERENCE_PRICE_FRONT_TYPE_MULTIPLIER = {
  open: 1,
  door: 1.15,
  drawer: 1.2,
  glass: 1.25,
};

export const HALLER_WIDTH_UNITS = [1, 1.5, 2, 2.5, 3];
export const HALLER_HEIGHT_UNITS = [1, 1.5, 2, 2.5, 3];
export const HALLER_DEPTH_UNITS = [0.75, 1, 1.25];

export const HALLER_WIDTH_MM = HALLER_WIDTH_UNITS.map(
  (u) => Math.round(u * GRID_UNIT_MM)
);
export const HALLER_HEIGHT_MM = HALLER_HEIGHT_UNITS.map(
  (u) => Math.round(u * GRID_UNIT_MM)
);
export const HALLER_DEPTH_MM = HALLER_DEPTH_UNITS.map(
  (u) => Math.round(u * GRID_UNIT_MM)
);

/** 하단 받침대 타입 */
export const BASE_TYPES = [
  { id: "glide", label: "글라이드 (고정발)" },
  { id: "caster", label: "캐스터 (바퀴)" },
  { id: "leveler", label: "레벨러 (높이조절)" },
  { id: "none", label: "없음" },
];

/** 받침대 타입별 참고 추가 단가 (원, 하단 모듈 1개당) */
export const REFERENCE_PRICE_BASE_TYPE_ADDITION = {
  glide: 0,
  caster: 15000,
  leveler: 10000,
  none: 0,
};

/** 앞면(액세서리) 타입: 오픈 / 도어 / 서랍 / 글라스 */
export const FRONT_TYPES = [
  { id: "open", label: "오픈" },
  { id: "door", label: "도어" },
  { id: "drawer", label: "서랍" },
  { id: "glass", label: "글라스" },
];

/** USM 할러 공식 14색 (참고: RAL 및 USM 명칭) */
export const HALLER_COLORS = [
  { id: "pure_white", label: "Pure White (RAL 9010)", hex: "#F4F4F4" },
  { id: "light_gray", label: "Light Gray (RAL 7035)", hex: "#8F8F8F" },
  { id: "usm_medium_gray", label: "USM Medium Gray", hex: "#5C5C5C" },
  { id: "anthracite_gray", label: "Anthracite Gray (RAL 7016)", hex: "#293133" },
  { id: "graphite_black", label: "Graphite Black (RAL 9011)", hex: "#1F2933" },
  { id: "steel_blue", label: "Steel Blue (RAL 5011)", hex: "#0E4C92" },
  { id: "gentian_blue", label: "Gentian Blue (RAL 5010)", hex: "#2563EB" },
  { id: "golden_yellow", label: "Golden Yellow (RAL 1004)", hex: "#FACC15" },
  { id: "pure_orange", label: "Pure Orange (RAL 2004)", hex: "#E75B12" },
  { id: "usm_ruby_red", label: "USM Ruby Red", hex: "#9B1B30" },
  { id: "usm_brown", label: "USM Brown", hex: "#5D4037" },
  { id: "usm_beige", label: "USM Beige", hex: "#C4A574" },
  { id: "usm_green", label: "USM Green", hex: "#4CAF50" },
  { id: "olive_green", label: "Olive Green (RAL 6003)", hex: "#4A5D23" },
];

export const HALLER_PRESETS = {
  sideboard: {
    id: "sideboard",
    name: "USM 할러 사이드보드",
    modules: [
      { width: 1.5, height: 1.5, depth: 1, color: "#F4F4F4", frontType: "door", gridX: -1, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#FACC15", frontType: "open", gridX: 0, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#2563EB", frontType: "drawer", gridX: 1, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#1F2933", frontType: "door", gridX: -1, gridY: 1, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#4CAF50", frontType: "glass", gridX: 0, gridY: 1, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#F4F4F4", frontType: "open", gridX: 1, gridY: 1, gridZ: 0 },
    ],
  },
  mediaStorage: {
    id: "media_storage",
    name: "USM 할러 미디어 스토리지",
    modules: [
      { width: 1.5, height: 1.5, depth: 1, color: "#1F2933", frontType: "door", gridX: -1, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#4CAF50", frontType: "drawer", gridX: 0, gridY: 0, gridZ: 0 },
      { width: 1.5, height: 1.5, depth: 1, color: "#F4F4F4", frontType: "open", gridX: 1, gridY: 0, gridZ: 0 },
    ],
  },
  shelf: {
    id: "shelf",
    name: "USM 할러 선반",
    modules: [
      { width: 2, height: 1.5, depth: 1, color: "#F4F4F4", frontType: "open", gridX: 0, gridY: 0, gridZ: 0 },
      { width: 2, height: 1.5, depth: 1, color: "#FACC15", frontType: "open", gridX: 0, gridY: 1, gridZ: 0 },
    ],
  },
};
