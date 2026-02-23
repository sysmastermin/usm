import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
import {
  GRID_UNIT_MM,
  HALLER_GLTF_BASE_URL,
  HALLER_GLTF_MODELS,
} from "../data/hallerConfig";

const USE_GLTF_MODELS = false;

const TUBE_RADIUS = 0.022;
const TUBE_SEG = 10;
const BALL_RADIUS = 0.035;
const BALL_SEG = 8;
const PANEL_THICK = 0.008;
const PANEL_INSET = 0.04;
const HANDLE_R = 0.006;
const HANDLE_LEN = 0.12;
const HANDLE_OFF = 0.018;

function safeColor(hex) {
  try {
    return BABYLON.Color3.FromHexString(hex);
  } catch {
    return new BABYLON.Color3(1, 1, 1);
  }
}

function isMaterialAlive(mat) {
  if (!mat) return false;
  if (typeof mat.isDisposed === "function") {
    return !mat.isDisposed();
  }
  return !mat._isDisposed;
}

function getChromeMat(scene) {
  if (isMaterialAlive(scene._hChrome)) {
    return scene._hChrome;
  }
  const m = new BABYLON.StandardMaterial("hChrome", scene);
  m.diffuseColor = new BABYLON.Color3(0.82, 0.82, 0.80);
  m.specularColor = new BABYLON.Color3(0.95, 0.95, 0.92);
  m.specularPower = 64;
  scene._hChrome = m;
  return m;
}

function getGlideMat(scene) {
  if (isMaterialAlive(scene._hGlide)) {
    return scene._hGlide;
  }
  const m = new BABYLON.StandardMaterial("hGlide", scene);
  m.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.08);
  m.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
  m.specularPower = 16;
  scene._hGlide = m;
  return m;
}

function getRubberMat(scene) {
  if (isMaterialAlive(scene._hRubber)) {
    return scene._hRubber;
  }
  const m = new BABYLON.StandardMaterial("hRubber", scene);
  m.diffuseColor = new BABYLON.Color3(0.06, 0.06, 0.06);
  m.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
  m.specularPower = 4;
  scene._hRubber = m;
  return m;
}

function getHandleMat(scene) {
  if (isMaterialAlive(scene._hHandle)) {
    return scene._hHandle;
  }
  const m = new BABYLON.StandardMaterial("hHandle", scene);
  m.diffuseColor = new BABYLON.Color3(0.78, 0.78, 0.76);
  m.specularColor = new BABYLON.Color3(0.9, 0.9, 0.88);
  m.specularPower = 48;
  scene._hHandle = m;
  return m;
}

function makePanelMat(scene, name, hex, glass = false) {
  const m = new BABYLON.StandardMaterial(name, scene);
  m.diffuseColor = safeColor(hex);
  if (glass) {
    m.diffuseColor = new BABYLON.Color3(0.55, 0.72, 0.82);
    m.specularColor = new BABYLON.Color3(0.95, 0.97, 1.0);
    m.specularPower = 160;
    m.alpha = 0.52;
    m.backFaceCulling = false;
    m.emissiveColor = new BABYLON.Color3(0.12, 0.18, 0.25);
    m.emissiveFresnelParameters =
      new BABYLON.FresnelParameters({
        bias: 0.35,
        power: 2,
        leftColor: new BABYLON.Color3(0.7, 0.85, 1.0),
        rightColor: BABYLON.Color3.Black(),
      });
    m.opacityFresnelParameters =
      new BABYLON.FresnelParameters({
        bias: 0.55,
        power: 1.8,
        leftColor: BABYLON.Color3.White(),
        rightColor: new BABYLON.Color3(0.45, 0.45, 0.45),
      });
  } else {
    m.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    m.specularPower = 32;
  }
  m._isPerModule = true;
  return m;
}

// ── Geometry: Aligned Cylinder ──────────────────────────────

function makeTube(scene, from, to, radius) {
  const d = BABYLON.Vector3.Distance(from, to);
  if (d < 0.001) return null;
  const c = BABYLON.MeshBuilder.CreateCylinder(
    "_t",
    {
      height: d,
      diameter: radius * 2,
      tessellation: TUBE_SEG,
    },
    scene
  );
  c.position = BABYLON.Vector3.Center(from, to);
  const dir = to.subtract(from).normalize();
  const up = BABYLON.Vector3.Up();
  const dot = BABYLON.Vector3.Dot(up, dir);
  if (Math.abs(dot) < 0.9999) {
    const ax = BABYLON.Vector3.Cross(up, dir).normalize();
    const ang = Math.acos(Math.min(1, Math.max(-1, dot)));
    c.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
      ax,
      ang
    );
  } else if (dot < 0) {
    c.rotation.z = Math.PI;
  }
  return c;
}

// ── Geometry: Chrome Frame (12 tubes + 8 ball connectors) ───

function buildHallerFrame(scene, node, id, hw, hh, hd, sg) {
  const corners = [
    new BABYLON.Vector3(-hw, -hh, -hd),
    new BABYLON.Vector3(hw, -hh, -hd),
    new BABYLON.Vector3(hw, hh, -hd),
    new BABYLON.Vector3(-hw, hh, -hd),
    new BABYLON.Vector3(-hw, -hh, hd),
    new BABYLON.Vector3(hw, -hh, hd),
    new BABYLON.Vector3(hw, hh, hd),
    new BABYLON.Vector3(-hw, hh, hd),
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  const parts = [];

  corners.forEach((pos) => {
    const b = BABYLON.MeshBuilder.CreateSphere(
      "_b",
      { diameter: BALL_RADIUS * 2, segments: BALL_SEG },
      scene
    );
    b.position = pos;
    parts.push(b);
  });

  edges.forEach(([a, b]) => {
    const t = makeTube(
      scene,
      corners[a],
      corners[b],
      TUBE_RADIUS
    );
    if (t) parts.push(t);
  });

  if (parts.length === 0) return;
  const merged = BABYLON.Mesh.MergeMeshes(
    parts,
    true,
    true,
    undefined,
    false,
    true
  );
  if (!merged) return;
  merged.name = `frame-${id}`;
  merged.material = getChromeMat(scene);
  merged.parent = node;
  merged.metadata = { meshType: "chrome" };
  if (sg) sg.addShadowCaster(merged);
}

// ── Geometry: 5-face Colored Panels ─────────────────────────

function buildHallerPanels(
  scene,
  node,
  id,
  hw,
  hh,
  hd,
  color,
  sg
) {
  const ins = PANEL_INSET;
  const pw = hw - ins;
  const ph = hh - ins;
  const pd = hd - ins;
  const t = PANEL_THICK;

  const defs = [
    {
      w: pw * 2,
      h: ph * 2,
      d: t,
      x: 0,
      y: 0,
      z: -hd + t / 2,
    },
    {
      w: pw * 2,
      h: t,
      d: pd * 2,
      x: 0,
      y: -hh + t / 2,
      z: 0,
    },
    {
      w: pw * 2,
      h: t,
      d: pd * 2,
      x: 0,
      y: hh - t / 2,
      z: 0,
    },
    {
      w: t,
      h: ph * 2,
      d: pd * 2,
      x: -hw + t / 2,
      y: 0,
      z: 0,
    },
    {
      w: t,
      h: ph * 2,
      d: pd * 2,
      x: hw - t / 2,
      y: 0,
      z: 0,
    },
  ];

  const parts = defs.map((p) => {
    const bx = BABYLON.MeshBuilder.CreateBox(
      "_p",
      { width: p.w, height: p.h, depth: p.d },
      scene
    );
    bx.position = new BABYLON.Vector3(p.x, p.y, p.z);
    return bx;
  });

  const merged = BABYLON.Mesh.MergeMeshes(
    parts,
    true,
    true,
    undefined,
    false,
    true
  );
  if (!merged) return;
  merged.name = `panels-${id}`;
  merged.material = makePanelMat(
    scene,
    `panelMat-${id}`,
    color
  );
  merged.parent = node;
  merged.metadata = { meshType: "panel" };
  if (sg) sg.addShadowCaster(merged);
}

// ── Geometry: Front Face (door / drawer / glass) ────────────

const DOOR_OPEN_ANGLE = Math.PI * 0.45;
const DRAWER_OPEN_RATIO = 0.7;
const ANIM_FPS = 30;
const ANIM_FRAMES = 15;

const _openStateMap = new Map();

function toggleFrontOpen(scene, moduleId) {
  const isOpen = _openStateMap.get(moduleId) || false;
  const target = !isOpen;
  _openStateMap.set(moduleId, target);

  const rootNode = scene.getTransformNodeByName(
    `mod-${moduleId}`
  );
  if (!rootNode) return;

  const pivot = rootNode.getChildren().find(
    (c) =>
      c instanceof BABYLON.TransformNode &&
      c.metadata?.isPivot
  );
  if (!pivot) return;

  const ft = pivot.metadata.frontType;
  const ease = new BABYLON.QuadraticEase();
  ease.setEasingMode(
    BABYLON.EasingFunction.EASINGMODE_EASEINOUT
  );

  if (ft === "door") {
    const from = pivot.rotation.x;
    const to = target ? DOOR_OPEN_ANGLE : 0;
    const anim = new BABYLON.Animation(
      `doorAnim-${moduleId}`,
      "rotation.x",
      ANIM_FPS,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    anim.setKeys([
      { frame: 0, value: from },
      { frame: ANIM_FRAMES, value: to },
    ]);
    anim.setEasingFunction(ease);
    pivot.animations = [anim];
    scene.beginAnimation(pivot, 0, ANIM_FRAMES, false);
  } else if (ft === "drawer") {
    const baseZ = pivot.metadata.closedZ;
    const openZ =
      baseZ + pivot.metadata.depth * DRAWER_OPEN_RATIO;
    const from = pivot.position.z;
    const to = target ? openZ : baseZ;
    const anim = new BABYLON.Animation(
      `drawerAnim-${moduleId}`,
      "position.z",
      ANIM_FPS,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    anim.setKeys([
      { frame: 0, value: from },
      { frame: ANIM_FRAMES, value: to },
    ]);
    anim.setEasingFunction(ease);
    pivot.animations = [anim];
    scene.beginAnimation(pivot, 0, ANIM_FRAMES, false);
  }
}

function restoreFrontOpenState(pivot, moduleId) {
  const isOpen = _openStateMap.get(moduleId) || false;
  if (!isOpen) return;
  const ft = pivot.metadata.frontType;
  if (ft === "door") {
    pivot.rotation.x = DOOR_OPEN_ANGLE;
  } else if (ft === "drawer") {
    pivot.position.z =
      pivot.metadata.closedZ +
      pivot.metadata.depth * DRAWER_OPEN_RATIO;
  }
}

function buildHallerFront(
  scene,
  node,
  id,
  hw,
  hh,
  hd,
  frontType,
  color,
  sg
) {
  if (frontType === "open") return;

  const ins = PANEL_INSET;
  const pw = hw - ins;
  const ph = hh - ins;
  const isGlass = frontType === "glass";
  const needsPivot =
    frontType === "door" || frontType === "drawer";

  let pivotNode = null;
  if (needsPivot) {
    pivotNode = new BABYLON.TransformNode(
      `frontPivot-${id}`,
      scene
    );
    pivotNode.parent = node;
    if (frontType === "door") {
      pivotNode.position.y = -ph;
      pivotNode.metadata = {
        isPivot: true,
        frontType,
        moduleId: id,
      };
    } else {
      pivotNode.position = BABYLON.Vector3.Zero();
      pivotNode.metadata = {
        isPivot: true,
        frontType,
        moduleId: id,
        closedZ: 0,
        depth: hd * 2,
      };
    }
  }

  const parentForFront = pivotNode || node;

  const panelY = frontType === "door" ? ph : 0;
  const panel = BABYLON.MeshBuilder.CreateBox(
    `front-${id}`,
    { width: pw * 2, height: ph * 2, depth: PANEL_THICK },
    scene
  );
  panel.position = new BABYLON.Vector3(
    0,
    panelY,
    hd - PANEL_THICK / 2
  );
  panel.material = makePanelMat(
    scene,
    `frontMat-${id}`,
    color,
    isGlass
  );
  panel.parent = parentForFront;
  panel.metadata = {
    meshType: "front",
    frontType,
    pivotNode,
  };
  if (sg) sg.addShadowCaster(panel);

  if (isGlass) return;

  const hMat = getHandleMat(scene);

  if (frontType === "door") {
    const knobR = 0.022;
    const knobDepth = 0.008;
    const stemR = 0.006;
    const stemLen = HANDLE_OFF;
    const handleY = panelY + ph - knobR - 0.02;

    const stem = BABYLON.MeshBuilder.CreateCylinder(
      `hStem-${id}`,
      {
        height: stemLen,
        diameter: stemR * 2,
        tessellation: 12,
      },
      scene
    );
    stem.rotation.x = Math.PI / 2;
    stem.position = new BABYLON.Vector3(
      0,
      handleY,
      hd + stemLen / 2
    );
    stem.material = hMat;
    stem.parent = parentForFront;
    stem.metadata = {
      meshType: "handle",
      frontType,
      pivotNode,
    };

    const knob = BABYLON.MeshBuilder.CreateCylinder(
      `hdl-${id}`,
      {
        height: knobDepth,
        diameter: knobR * 2,
        tessellation: 24,
      },
      scene
    );
    knob.rotation.x = Math.PI / 2;
    knob.position = new BABYLON.Vector3(
      0,
      handleY,
      hd + stemLen + knobDepth / 2
    );
    knob.material = hMat;
    knob.parent = parentForFront;
    knob.metadata = {
      meshType: "handle",
      frontType,
      pivotNode,
    };

    const rimR = knobR + 0.002;
    const rim = BABYLON.MeshBuilder.CreateTorus(
      `hRim-${id}`,
      {
        diameter: rimR * 2,
        thickness: 0.003,
        tessellation: 24,
      },
      scene
    );
    rim.rotation.x = Math.PI / 2;
    rim.position = new BABYLON.Vector3(
      0,
      handleY,
      hd + stemLen + knobDepth
    );
    rim.material = hMat;
    rim.parent = parentForFront;
    rim.metadata = {
      meshType: "handle",
      frontType,
      pivotNode,
    };

    restoreFrontOpenState(pivotNode, id);
    return;
  }

  if (frontType === "drawer") {
    const frameMat = getChromeMat(scene);
    const wallH = ph * 0.45;
    const wallD = hd * 1.6;
    const wallT = PANEL_THICK;
    const wallZ = hd - wallD / 2 - PANEL_THICK;

    const leftWall = BABYLON.MeshBuilder.CreateBox(
      `dWallL-${id}`,
      { width: wallT, height: wallH, depth: wallD },
      scene
    );
    leftWall.position = new BABYLON.Vector3(
      -(pw - wallT / 2),
      -(ph - wallH / 2),
      wallZ
    );
    leftWall.material = frameMat;
    leftWall.parent = parentForFront;
    leftWall.metadata = { meshType: "frame" };

    const rightWall = BABYLON.MeshBuilder.CreateBox(
      `dWallR-${id}`,
      { width: wallT, height: wallH, depth: wallD },
      scene
    );
    rightWall.position = new BABYLON.Vector3(
      pw - wallT / 2,
      -(ph - wallH / 2),
      wallZ
    );
    rightWall.material = frameMat;
    rightWall.parent = parentForFront;
    rightWall.metadata = { meshType: "frame" };

    const floor = BABYLON.MeshBuilder.CreateBox(
      `dFloor-${id}`,
      { width: pw * 2, height: wallT, depth: wallD },
      scene
    );
    floor.position = new BABYLON.Vector3(
      0,
      -ph + wallT / 2,
      wallZ
    );
    floor.material = frameMat;
    floor.parent = parentForFront;
    floor.metadata = { meshType: "frame" };

    const knobR = 0.022;
    const knobDepth = 0.008;
    const stemR = 0.006;
    const stemLen = HANDLE_OFF;

    const stem = BABYLON.MeshBuilder.CreateCylinder(
      `hStem-${id}`,
      {
        height: stemLen,
        diameter: stemR * 2,
        tessellation: 12,
      },
      scene
    );
    stem.rotation.x = Math.PI / 2;
    stem.position = new BABYLON.Vector3(
      0,
      0,
      hd + stemLen / 2
    );
    stem.material = hMat;
    stem.parent = parentForFront;
    stem.metadata = {
      meshType: "handle",
      frontType,
      pivotNode,
    };

    const knob = BABYLON.MeshBuilder.CreateCylinder(
      `hdl-${id}`,
      {
        height: knobDepth,
        diameter: knobR * 2,
        tessellation: 24,
      },
      scene
    );
    knob.rotation.x = Math.PI / 2;
    knob.position = new BABYLON.Vector3(
      0,
      0,
      hd + stemLen + knobDepth / 2
    );
    knob.material = hMat;
    knob.parent = parentForFront;
    knob.metadata = {
      meshType: "handle",
      frontType,
      pivotNode,
    };

    const rimR = knobR + 0.002;
    const rim = BABYLON.MeshBuilder.CreateTorus(
      `hRim-${id}`,
      {
        diameter: rimR * 2,
        thickness: 0.003,
        tessellation: 24,
      },
      scene
    );
    rim.rotation.x = Math.PI / 2;
    rim.position = new BABYLON.Vector3(
      0,
      0,
      hd + stemLen + knobDepth
    );
    rim.material = hMat;
    rim.parent = parentForFront;
    rim.metadata = {
      meshType: "handle",
      frontType,
      pivotNode,
    };

    restoreFrontOpenState(pivotNode, id);
  }
}

// ── Geometry: Glide Feet (4 corners) ────────────────────────
// USM spec: chrome cone glide with felt pad

const GLD_STEM_R = 0.01;
const GLD_STEM_H = 0.02;
const GLD_CONE_TOP_R = 0.012;
const GLD_CONE_BOT_R = 0.032;
const GLD_CONE_H = 0.06;
const GLD_PAD_R = 0.032;
const GLD_PAD_H = 0.006;

function buildHallerGlides(scene, node, id, hw, hh, hd) {
  const positions = [
    [-hw, -hh, -hd],
    [hw, -hh, -hd],
    [-hw, -hh, hd],
    [hw, -hh, hd],
  ];

  const chrome = getChromeMat(scene);
  const rubber = getRubberMat(scene);

  positions.forEach(([x, y, z], i) => {
    let cy = y;

    const stem = BABYLON.MeshBuilder.CreateCylinder(
      `gs-${id}-${i}`,
      {
        height: GLD_STEM_H,
        diameter: GLD_STEM_R * 2,
        tessellation: 8,
      },
      scene
    );
    cy -= GLD_STEM_H / 2;
    stem.position = new BABYLON.Vector3(x, cy, z);
    stem.material = chrome;
    stem.parent = node;
    stem.metadata = { meshType: "glide" };
    cy -= GLD_STEM_H / 2;

    const cone = BABYLON.MeshBuilder.CreateCylinder(
      `gc-${id}-${i}`,
      {
        height: GLD_CONE_H,
        diameterTop: GLD_CONE_TOP_R * 2,
        diameterBottom: GLD_CONE_BOT_R * 2,
        tessellation: 14,
      },
      scene
    );
    cy -= GLD_CONE_H / 2;
    cone.position = new BABYLON.Vector3(x, cy, z);
    cone.material = chrome;
    cone.parent = node;
    cone.metadata = { meshType: "glide" };
    cy -= GLD_CONE_H / 2;

    const pad = BABYLON.MeshBuilder.CreateCylinder(
      `gp-${id}-${i}`,
      {
        height: GLD_PAD_H,
        diameter: GLD_PAD_R * 2,
        tessellation: 14,
      },
      scene
    );
    cy -= GLD_PAD_H / 2;
    pad.position = new BABYLON.Vector3(x, cy, z);
    pad.material = rubber;
    pad.parent = node;
    pad.metadata = { meshType: "glide" };
  });
}

// ── Geometry: Caster Wheels (4 corners) ─────────────────────

const CASTER_GLB_URL = "/models/haller/caster.glb";
let casterContainer = null;
let casterLoadFailed = false;

function buildHallerCasters(scene, node, id, hw, hh, hd) {
  const positions = [
    [-hw, -hh, -hd],
    [hw, -hh, -hd],
    [-hw, -hh, hd],
    [hw, -hh, hd],
  ];

  if (casterLoadFailed) {
    buildHallerCastersFallback(scene, node, id, positions);
    return;
  }

  const place = (container) => {
    positions.forEach(([x, y, z], i) => {
      const inst = container.instantiateModelsToScene(
        (name) => `${name}-${id}-${i}`
      );
      const root = inst.rootNodes[0];
      if (!root) return;
      root.position = new BABYLON.Vector3(x, y, z);
      root.parent = node;
      root.metadata = { meshType: "caster" };
      root.getChildMeshes().forEach((m) => {
        m.metadata = { meshType: "caster" };
      });
    });
  };

  if (casterContainer) {
    place(casterContainer);
    return;
  }

  BABYLON.SceneLoader.LoadAssetContainerAsync(
    "",
    CASTER_GLB_URL,
    scene
  )
    .then((container) => {
      casterContainer = container;
      place(container);
    })
    .catch(() => {
      casterLoadFailed = true;
      buildHallerCastersFallback(
        scene, node, id, positions
      );
    });
}

function buildHallerCastersFallback(
  scene, node, id, positions
) {
  const chrome = getChromeMat(scene);
  const rubber = getRubberMat(scene);

  const MOUNT_R = 0.025;
  const MOUNT_H = 0.01;
  const AXLE_R = 0.01;
  const AXLE_H = 0.02;
  const FORK_R = 0.006;
  const FORK_H = 0.05;
  const FORK_SPREAD = 0.022;
  const WHEEL_R = 0.06;
  const WHEEL_W = 0.02;

  positions.forEach(([x, y, z], i) => {
    let cy = y;

    const mount = BABYLON.MeshBuilder.CreateCylinder(
      `cm-${id}-${i}`,
      { height: MOUNT_H, diameter: MOUNT_R * 2, tessellation: 16 },
      scene
    );
    cy -= MOUNT_H / 2;
    mount.position = new BABYLON.Vector3(x, cy, z);
    mount.material = chrome;
    mount.parent = node;
    mount.metadata = { meshType: "caster" };
    cy -= MOUNT_H / 2;

    const axle = BABYLON.MeshBuilder.CreateCylinder(
      `ca-${id}-${i}`,
      { height: AXLE_H, diameter: AXLE_R * 2, tessellation: 10 },
      scene
    );
    cy -= AXLE_H / 2;
    axle.position = new BABYLON.Vector3(x, cy, z);
    axle.material = chrome;
    axle.parent = node;
    axle.metadata = { meshType: "caster" };
    cy -= AXLE_H / 2;

    const forkL = BABYLON.MeshBuilder.CreateCylinder(
      `cfl-${id}-${i}`,
      { height: FORK_H, diameter: FORK_R * 2, tessellation: 8 },
      scene
    );
    forkL.position = new BABYLON.Vector3(
      x, cy - FORK_H / 2, z - FORK_SPREAD
    );
    forkL.material = chrome;
    forkL.parent = node;
    forkL.metadata = { meshType: "caster" };

    const forkR = BABYLON.MeshBuilder.CreateCylinder(
      `cfr-${id}-${i}`,
      { height: FORK_H, diameter: FORK_R * 2, tessellation: 8 },
      scene
    );
    forkR.position = new BABYLON.Vector3(
      x, cy - FORK_H / 2, z + FORK_SPREAD
    );
    forkR.material = chrome;
    forkR.parent = node;
    forkR.metadata = { meshType: "caster" };

    const bridge = BABYLON.MeshBuilder.CreateCylinder(
      `cfb-${id}-${i}`,
      { height: FORK_SPREAD * 2, diameter: FORK_R * 2, tessellation: 8 },
      scene
    );
    bridge.rotation.x = Math.PI / 2;
    bridge.position = new BABYLON.Vector3(
      x, cy - FORK_H, z
    );
    bridge.material = chrome;
    bridge.parent = node;
    bridge.metadata = { meshType: "caster" };

    const wCenter = cy - FORK_H + WHEEL_R * 0.15;
    const wheel = BABYLON.MeshBuilder.CreateCylinder(
      `cw-${id}-${i}`,
      { height: WHEEL_W, diameter: WHEEL_R * 2, tessellation: 24 },
      scene
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position = new BABYLON.Vector3(x, wCenter, z);
    wheel.material = rubber;
    wheel.parent = node;
    wheel.metadata = { meshType: "caster" };

    const hub = BABYLON.MeshBuilder.CreateCylinder(
      `cwh-${id}-${i}`,
      { height: WHEEL_W + 0.002, diameter: WHEEL_R * 0.7, tessellation: 12 },
      scene
    );
    hub.rotation.x = Math.PI / 2;
    hub.position = new BABYLON.Vector3(x, wCenter, z);
    hub.material = chrome;
    hub.parent = node;
    hub.metadata = { meshType: "caster" };
  });
}

// ── Geometry: Leveler Feet (4 corners) ──────────────────────
// USM spec: adjustable height leveler with hex nut

const LVL_CAP_R = 0.016;
const LVL_CAP_H = 0.014;
const LVL_STEM_R = 0.008;
const LVL_STEM_H = 0.06;
const LVL_NUT_R = 0.016;
const LVL_NUT_H = 0.018;
const LVL_PAD_R = 0.028;
const LVL_PAD_H = 0.008;

function buildHallerLevelers(
  scene,
  node,
  id,
  hw,
  hh,
  hd
) {
  const positions = [
    [-hw, -hh, -hd],
    [hw, -hh, -hd],
    [-hw, -hh, hd],
    [hw, -hh, hd],
  ];

  const chrome = getChromeMat(scene);
  const rubber = getRubberMat(scene);

  positions.forEach(([x, y, z], i) => {
    let cy = y;

    const cap = BABYLON.MeshBuilder.CreateCylinder(
      `lc-${id}-${i}`,
      {
        height: LVL_CAP_H,
        diameterTop: LVL_CAP_R * 1.6,
        diameterBottom: LVL_CAP_R * 2,
        tessellation: 12,
      },
      scene
    );
    cy -= LVL_CAP_H / 2;
    cap.position = new BABYLON.Vector3(x, cy, z);
    cap.material = chrome;
    cap.parent = node;
    cap.metadata = { meshType: "leveler" };
    cy -= LVL_CAP_H / 2;

    const stem = BABYLON.MeshBuilder.CreateCylinder(
      `ls-${id}-${i}`,
      {
        height: LVL_STEM_H,
        diameter: LVL_STEM_R * 2,
        tessellation: 10,
      },
      scene
    );
    cy -= LVL_STEM_H / 2;
    stem.position = new BABYLON.Vector3(x, cy, z);
    stem.material = chrome;
    stem.parent = node;
    stem.metadata = { meshType: "leveler" };
    cy -= LVL_STEM_H / 2;

    const nutY = y - LVL_CAP_H - LVL_STEM_H * 0.45;
    const nut = BABYLON.MeshBuilder.CreateCylinder(
      `ln-${id}-${i}`,
      {
        height: LVL_NUT_H,
        diameter: LVL_NUT_R * 2,
        tessellation: 6,
      },
      scene
    );
    nut.position = new BABYLON.Vector3(x, nutY, z);
    nut.material = chrome;
    nut.parent = node;
    nut.metadata = { meshType: "leveler" };

    const pad = BABYLON.MeshBuilder.CreateCylinder(
      `lp-${id}-${i}`,
      {
        height: LVL_PAD_H,
        diameter: LVL_PAD_R * 2,
        tessellation: 16,
      },
      scene
    );
    pad.position = new BABYLON.Vector3(x, cy - LVL_PAD_H / 2, z);
    pad.material = rubber;
    pad.parent = node;
    pad.metadata = { meshType: "leveler" };
  });
}

// ── glTF Loading Pipeline (Phase B-3) ───────────────────────

const gltfCache = new Map();

async function tryLoadGltf(
  scene,
  node,
  id,
  frontType,
  color,
  hw,
  hh,
  hd
) {
  if (!USE_GLTF_MODELS || !HALLER_GLTF_BASE_URL) return false;

  const modelMap = HALLER_GLTF_MODELS || {};
  const modelFile = modelMap[frontType] || modelMap.frame;
  if (!modelFile) return false;

  const url = `${HALLER_GLTF_BASE_URL}${modelFile}`;

  try {
    let container = gltfCache.get(url);
    if (!container) {
      container =
        await BABYLON.SceneLoader.LoadAssetContainerAsync(
          "",
          url,
          scene
        );
      gltfCache.set(url, container);
    }

    const entries = container.instantiateModelsToScene(
      (name) => `${name}-${id}`
    );
    const root = entries.rootNodes[0];
    if (!root) return false;

    root.scaling = new BABYLON.Vector3(
      hw * 2,
      hh * 2,
      hd * 2
    );
    root.parent = node;
    root.metadata = { meshType: "gltfRoot" };

    root.getChildMeshes().forEach((mesh) => {
      if (
        mesh.material instanceof BABYLON.StandardMaterial
      ) {
        mesh.material.diffuseColor = safeColor(color);
      }
    });

    return true;
  } catch (err) {
    console.warn("glTF load failed, using procedural:", err);
    return false;
  }
}

// ── Orchestrator ────────────────────────────────────────────

function disposeChildren(node) {
  node.getChildren().forEach((c) => {
    if (
      c instanceof BABYLON.Mesh &&
      c.material?._isPerModule
    ) {
      c.material.dispose();
    }
    if (c instanceof BABYLON.TransformNode) {
      disposeChildren(c);
    }
    c.dispose();
  });
}

function buildModuleMeshes(
  scene,
  node,
  id,
  frontType,
  color,
  isSelected,
  sg,
  w,
  h,
  d,
  isBottom,
  baseType
) {
  disposeChildren(node);

  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;

  buildHallerFrame(scene, node, id, hw, hh, hd, sg);
  buildHallerPanels(
    scene,
    node,
    id,
    hw,
    hh,
    hd,
    color,
    sg
  );
  buildHallerFront(
    scene,
    node,
    id,
    hw,
    hh,
    hd,
    frontType,
    color,
    sg
  );
  if (isBottom) {
    const bt = baseType || "glide";
    if (bt === "glide") {
      buildHallerGlides(scene, node, id, hw, hh, hd);
    } else if (bt === "caster") {
      buildHallerCasters(scene, node, id, hw, hh, hd);
    } else if (bt === "leveler") {
      buildHallerLevelers(scene, node, id, hw, hh, hd);
    }
  }

  applySelection(node, isSelected);

  if (USE_GLTF_MODELS && HALLER_GLTF_BASE_URL) {
    tryLoadGltf(
      scene,
      node,
      id,
      frontType,
      color,
      hw,
      hh,
      hd
    ).then((ok) => {
      if (ok) {
        node.getChildren().forEach((c) => {
          if (c.metadata?.meshType !== "gltfRoot") {
            if (c.material?._isPerModule) {
              c.material.dispose();
            }
            c.dispose();
          }
        });
      }
    });
  }
}

const SEL_OUTLINE_COLOR = new BABYLON.Color3(1, 1, 1);
const SEL_OUTLINE_WIDTH = 0.012;

function getAllDescendantMeshes(node) {
  const result = [];
  node.getChildren().forEach((c) => {
    if (c instanceof BABYLON.Mesh) result.push(c);
    if (c instanceof BABYLON.TransformNode) {
      result.push(...getAllDescendantMeshes(c));
    }
  });
  return result;
}

function applySelection(node, isSelected) {
  getAllDescendantMeshes(node).forEach((c) => {
    const t = c.metadata?.meshType;
    if (!t) return;

    if (t === "panel" || t === "front") {
      if (c.material instanceof BABYLON.StandardMaterial) {
        c.material.emissiveColor = BABYLON.Color3.Black();
      }
      c.renderOutline = isSelected;
      c.outlineColor = SEL_OUTLINE_COLOR;
      c.outlineWidth = SEL_OUTLINE_WIDTH;
    } else if (t === "tube" || t === "ball") {
      c.renderOutline = isSelected;
      c.outlineColor = SEL_OUTLINE_COLOR;
      c.outlineWidth = SEL_OUTLINE_WIDTH * 0.6;
    }
  });
}

function updateColors(node, color, frontType, isSelected) {
  getAllDescendantMeshes(node).forEach((c) => {
    const t = c.metadata?.meshType;
    if (
      (t === "panel" || t === "front") &&
      c.material instanceof BABYLON.StandardMaterial
    ) {
      c.material.diffuseColor = safeColor(color);
      if (t === "front" && frontType === "glass") {
        c.material.alpha = 0.52;
      }
    }
  });
  applySelection(node, isSelected);
}

// ── Dimension Lines ─────────────────────────────────────────

const DIM_COLOR = new BABYLON.Color3(0.1, 0.1, 0.1);
const DIM_OFFSET = 0.18;
const DIM_TICK_LEN = 0.06;
const DIM_TAG = "dimensionHelper";

function disposeDimensionHelpers(scene) {
  scene.meshes
    .filter((m) => m.metadata?.tag === DIM_TAG)
    .forEach((m) => {
      if (m.material) m.material.dispose();
      m.dispose();
    });
}

function makeLabel(scene, text, pos, size = 0.2) {
  const texW = 512;
  const texH = 160;
  const dt = new BABYLON.DynamicTexture(
    `dtDim-${text}`,
    { width: texW, height: texH },
    scene,
    false
  );
  const ctx = dt.getContext();
  ctx.clearRect(0, 0, texW, texH);

  const pad = 12;
  const rr = 16;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(pad, pad, texW - pad * 2, texH - pad * 2, rr);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111111";
  ctx.font = "bold 72px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, texW / 2, texH / 2);
  dt.update();

  const ratio = texW / texH;
  const plane = BABYLON.MeshBuilder.CreatePlane(
    `dimLbl-${text}`,
    { width: size * ratio, height: size },
    scene
  );
  const mat = new BABYLON.StandardMaterial(
    `dimLblM-${text}`,
    scene
  );
  mat.diffuseTexture = dt;
  mat.diffuseTexture.hasAlpha = true;
  mat.specularColor = BABYLON.Color3.Black();
  mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  mat.useAlphaFromDiffuseTexture = true;
  mat.backFaceCulling = false;
  plane.material = mat;
  plane.position = pos;
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  plane.metadata = { tag: DIM_TAG };
  return plane;
}

function makeDimLine(scene, points) {
  const line = BABYLON.MeshBuilder.CreateLines(
    "dimLine",
    {
      points,
      updatable: false,
    },
    scene
  );
  line.color = DIM_COLOR;
  line.metadata = { tag: DIM_TAG };
  return line;
}

function buildDimensionLines(
  scene, modules, maxW, maxH, maxD, baseHeight
) {
  disposeDimensionHelpers(scene);
  if (!modules || modules.length === 0) return;

  const bh = baseHeight || 0;
  const clampDim = (v) =>
    Number.isFinite(v) ? Math.max(v, 0.1) : 1;

  let bMinX = Infinity,
    bMaxX = -Infinity;
  let bMinY = Infinity,
    bMaxY = -Infinity;
  let bMinZ = Infinity,
    bMaxZ = -Infinity;

  modules.forEach((mod) => {
    const w = clampDim(mod.width);
    const h = clampDim(mod.height);
    const d = clampDim(mod.depth);
    const gx = mod.gridX || 0;
    const gy = mod.gridY || 0;
    const gz = mod.gridZ || 0;

    const cx = gx * maxW;
    const cy = h / 2 + gy * maxH + bh;
    const cz = gz * maxD;

    bMinX = Math.min(bMinX, cx - w / 2);
    bMaxX = Math.max(bMaxX, cx + w / 2);
    bMinY = Math.min(bMinY, cy - h / 2);
    bMaxY = Math.max(bMaxY, cy + h / 2);
    bMinZ = Math.min(bMinZ, cz - d / 2);
    bMaxZ = Math.max(bMaxZ, cz + d / 2);
  });

  const widthMM = Math.round(
    (bMaxX - bMinX) * GRID_UNIT_MM
  );
  const heightMM = Math.round(
    (bMaxY - bMinY) * GRID_UNIT_MM
  );
  const depthMM = Math.round(
    (bMaxZ - bMinZ) * GRID_UNIT_MM
  );

  const topY = bMaxY + DIM_OFFSET;
  makeDimLine(scene, [
    new BABYLON.Vector3(bMinX, topY, bMinZ),
    new BABYLON.Vector3(bMaxX, topY, bMinZ),
  ]);
  makeDimLine(scene, [
    new BABYLON.Vector3(bMinX, topY - DIM_TICK_LEN, bMinZ),
    new BABYLON.Vector3(bMinX, topY + DIM_TICK_LEN, bMinZ),
  ]);
  makeDimLine(scene, [
    new BABYLON.Vector3(bMaxX, topY - DIM_TICK_LEN, bMinZ),
    new BABYLON.Vector3(bMaxX, topY + DIM_TICK_LEN, bMinZ),
  ]);
  makeLabel(
    scene,
    `${widthMM}mm`,
    new BABYLON.Vector3(
      (bMinX + bMaxX) / 2,
      topY + DIM_OFFSET * 0.8,
      bMinZ
    )
  );

  const rightX = bMaxX + DIM_OFFSET;
  makeDimLine(scene, [
    new BABYLON.Vector3(rightX, bMinY, bMinZ),
    new BABYLON.Vector3(rightX, bMaxY, bMinZ),
  ]);
  makeDimLine(scene, [
    new BABYLON.Vector3(
      rightX - DIM_TICK_LEN,
      bMinY,
      bMinZ
    ),
    new BABYLON.Vector3(
      rightX + DIM_TICK_LEN,
      bMinY,
      bMinZ
    ),
  ]);
  makeDimLine(scene, [
    new BABYLON.Vector3(
      rightX - DIM_TICK_LEN,
      bMaxY,
      bMinZ
    ),
    new BABYLON.Vector3(
      rightX + DIM_TICK_LEN,
      bMaxY,
      bMinZ
    ),
  ]);
  makeLabel(
    scene,
    `${heightMM}mm`,
    new BABYLON.Vector3(
      rightX + DIM_OFFSET * 0.8,
      (bMinY + bMaxY) / 2,
      bMinZ
    )
  );

  const frontZ = bMinZ - DIM_OFFSET;
  makeDimLine(scene, [
    new BABYLON.Vector3(bMinX, bMinY, bMinZ),
    new BABYLON.Vector3(bMinX, bMinY, bMaxZ),
  ]);
  makeDimLine(scene, [
    new BABYLON.Vector3(bMinX, bMinY, bMinZ),
    new BABYLON.Vector3(
      bMinX - DIM_TICK_LEN,
      bMinY,
      bMinZ
    ),
  ]);
  makeDimLine(scene, [
    new BABYLON.Vector3(bMinX, bMinY, bMaxZ),
    new BABYLON.Vector3(
      bMinX - DIM_TICK_LEN,
      bMinY,
      bMaxZ
    ),
  ]);
  makeLabel(
    scene,
    `${depthMM}mm`,
    new BABYLON.Vector3(
      bMinX - DIM_OFFSET * 1.2,
      bMinY,
      (bMinZ + bMaxZ) / 2
    )
  );
}

// ── Component ───────────────────────────────────────────────

const Haller3DCanvas = forwardRef(function Haller3DCanvas(
  { configuration, selectedModuleId, onSelectModule },
  ref
) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const sgRef = useRef(null);
  const nodesRef = useRef(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(
      0.94, 0.94, 0.94, 1
    );
    sceneRef.current = scene;

    const camera = new BABYLON.ArcRotateCamera(
      "cam",
      Math.PI / 3,
      Math.PI / 3.2,
      5,
      new BABYLON.Vector3(0, 0.8, 0),
      scene
    );
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 35;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 2000;
    camera.minZ = 0.1;
    camera.attachControl(canvas, true);

    const hemi = new BABYLON.HemisphericLight(
      "hemi",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemi.intensity = 0.7;
    hemi.groundColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    const dir = new BABYLON.DirectionalLight(
      "dir",
      new BABYLON.Vector3(-0.4, -1, -0.3),
      scene
    );
    dir.position = new BABYLON.Vector3(6, 12, 8);
    dir.intensity = 0.6;

    const sg = new BABYLON.ShadowGenerator(2048, dir);
    sg.usePercentageCloserFiltering = true;
    sg.filteringQuality =
      BABYLON.ShadowGenerator.QUALITY_MEDIUM;
    sg.bias = 0.001;
    sg.normalBias = 0.02;
    sgRef.current = sg;

    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 40, height: 40, subdivisions: 2 },
      scene
    );
    const gMat = new BABYLON.StandardMaterial(
      "gMat",
      scene
    );
    gMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    gMat.specularColor = new BABYLON.Color3(
      0.15, 0.15, 0.15
    );
    ground.material = gMat;
    ground.receiveShadows = true;

    const gridLines = BABYLON.MeshBuilder.CreateGround(
      "gridLines",
      { width: 40, height: 40, subdivisions: 32 },
      scene
    );
    const gridMat = new BABYLON.StandardMaterial(
      "gridMat",
      scene
    );
    gridMat.diffuseColor = new BABYLON.Color3(
      0.82, 0.82, 0.82
    );
    gridMat.specularColor = BABYLON.Color3.Black();
    gridMat.wireframe = true;
    gridMat.alpha = 0.4;
    gridLines.material = gridMat;
    gridLines.position.y = 0.002;

    let _hoveredFront = null;

    const HOVER_OUTLINE_COLOR =
      new BABYLON.Color3(0.3, 0.6, 1.0);
    const HOVER_OUTLINE_W = 0.006;

    scene.constantlyUpdateMeshUnderPointer = true;

    function findModuleId(mesh) {
      let cur = mesh;
      while (cur) {
        if (cur.metadata?.moduleId)
          return cur.metadata.moduleId;
        cur = cur.parent;
      }
      return null;
    }

    function isDoorOrDrawerMesh(mesh) {
      const t = mesh?.metadata?.meshType;
      if (t !== "front" && t !== "handle") return false;
      const ft = mesh?.metadata?.frontType;
      return ft === "door" || ft === "drawer";
    }

    function findFrontPanel(mesh) {
      if (mesh?.metadata?.meshType === "front") return mesh;
      const pivot = mesh?.metadata?.pivotNode;
      if (pivot) {
        const ch = pivot.getChildMeshes(true);
        for (const c of ch) {
          if (c.metadata?.meshType === "front") return c;
        }
      }
      let cur = mesh?.parent;
      while (cur) {
        const ch = cur.getChildMeshes
          ? cur.getChildMeshes(true)
          : [];
        for (const c of ch) {
          if (c.metadata?.meshType === "front") return c;
        }
        cur = cur.parent;
      }
      return null;
    }

    function clearHover() {
      if (_hoveredFront) {
        _hoveredFront.renderOutline = false;
        _hoveredFront = null;
      }
      canvas.style.cursor = "";
    }

    scene.onPointerObservable.add((pi) => {
      if (
        pi.type === BABYLON.PointerEventTypes.POINTERMOVE
      ) {
        const mesh = scene.meshUnderPointer;
        if (!mesh || !isDoorOrDrawerMesh(mesh)) {
          clearHover();
          return;
        }
        const fp = findFrontPanel(mesh);
        if (fp && fp !== _hoveredFront) {
          clearHover();
          _hoveredFront = fp;
          fp.renderOutline = true;
          fp.outlineColor = HOVER_OUTLINE_COLOR;
          fp.outlineWidth = HOVER_OUTLINE_W;
        }
        canvas.style.cursor = "pointer";
        return;
      }

      if (
        pi.type ===
        BABYLON.PointerEventTypes.POINTERDOUBLETAP
      ) {
        const pk = pi.pickInfo;
        if (!pk?.hit || !pk.pickedMesh) return;
        const mesh = pk.pickedMesh;
        if (isDoorOrDrawerMesh(mesh)) {
          const mid = findModuleId(mesh);
          if (mid) {
            toggleFrontOpen(scene, mid);
            return;
          }
        }
      }

      if (
        pi.type !== BABYLON.PointerEventTypes.POINTERPICK
      ) {
        return;
      }
      const pk = pi.pickInfo;
      if (!pk?.hit || !pk.pickedMesh) return;
      const moduleId = findModuleId(pk.pickedMesh);
      if (moduleId && onSelectModule) {
        onSelectModule(moduleId);
      }
    });

    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => engine.resize());
    if (canvasRef.current) ro.observe(canvasRef.current);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      engine.stopRenderLoop();
      gltfCache.clear();
      engine.dispose();
      sceneRef.current = null;
      engineRef.current = null;
      sgRef.current = null;
      nodesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const sg = sgRef.current;
    if (!scene || !configuration) return;

    const modules = Array.isArray(configuration.modules)
      ? configuration.modules
      : [];
    const cfgBaseType = configuration.baseType || "glide";
    const nodeMap = nodesRef.current;

    const existingIds = new Set(nodeMap.keys());
    const nextIds = new Set(modules.map((m) => m.id));

    existingIds.forEach((mid) => {
      if (!nextIds.has(mid)) {
        const nd = nodeMap.get(mid);
        if (nd) {
          disposeChildren(nd);
          nd.dispose();
        }
        nodeMap.delete(mid);
      }
    });

    const clampDim = (v) =>
      Number.isFinite(v) ? Math.max(v, 0.1) : 1;

    const maxW = modules.length
      ? Math.max(...modules.map((m) => clampDim(m.width)))
      : 1;
    const maxH = modules.length
      ? Math.max(...modules.map((m) => clampDim(m.height)))
      : 1;
    const maxD = modules.length
      ? Math.max(...modules.map((m) => clampDim(m.depth)))
      : 1;

    const BASE_HEIGHTS = {
      caster: 0.14,
      glide: 0.086,
      leveler: 0.082,
      none: 0,
    };
    const baseHeight = BASE_HEIGHTS[cfgBaseType] || 0;

    let minX = Infinity,
      maxX = -Infinity,
      maxY = 0;

    modules.forEach((mod) => {
      const {
        id,
        width = 1,
        height = 1,
        depth = 1,
        color = "#ffffff",
        frontType = "open",
        gridX = 0,
        gridY = 0,
        gridZ = 0,
      } = mod;

      const w = clampDim(width);
      const h = clampDim(height);
      const d = clampDim(depth);

      const x = gridX * maxW;
      const y = h / 2 + gridY * maxH + baseHeight;
      const z = gridZ * maxD;
      const isSelected = selectedModuleId === id;
      const isBottom = gridY === 0;

      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
      maxY = Math.max(maxY, y + h / 2);

      let node = nodeMap.get(id);
      const meta = node?.metadata;
      const needsRebuild =
        !node ||
        meta?.lastFront !== frontType ||
        meta?.lastW !== w ||
        meta?.lastH !== h ||
        meta?.lastD !== d ||
        meta?.lastBaseType !== cfgBaseType;

      if (!node) {
        node = new BABYLON.TransformNode(
          `mod-${id}`,
          scene
        );
        node.metadata = { moduleId: id };
        nodeMap.set(id, node);
      }

      if (needsRebuild) {
        node.metadata = {
          ...node.metadata,
          lastFront: frontType,
          lastW: w,
          lastH: h,
          lastD: d,
          lastBaseType: cfgBaseType,
        };
        buildModuleMeshes(
          scene,
          node,
          id,
          frontType,
          color,
          isSelected,
          sg,
          w,
          h,
          d,
          isBottom,
          cfgBaseType
        );
      } else {
        updateColors(node, color, frontType, isSelected);
      }

      node.position = new BABYLON.Vector3(x, y, z);
    });

    buildDimensionLines(
      scene, modules, maxW, maxH, maxD, baseHeight
    );

    if (modules.length > 0) {
      const cam = scene.activeCamera;
      if (cam instanceof BABYLON.ArcRotateCamera) {
        const cX = (minX + maxX) / 2;
        const cY = maxY / 2;
        cam.target = new BABYLON.Vector3(cX, cY, 0);
        const span = Math.max(maxX - minX, maxY, 1);
        cam.radius = span * 2.2;
      }
    }
  }, [configuration, selectedModuleId, onSelectModule]);

  useImperativeHandle(ref, () => ({
    captureAsDataURL(mimeType = "image/png") {
      const c = canvasRef.current;
      if (!c) return null;
      return c.toDataURL(mimeType);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      style={{ touchAction: "none" }}
      className={
        "w-full h-full rounded-sm " +
        "bg-neutral-200 dark:bg-gray-900"
      }
    />
  );
});

export default Haller3DCanvas;
