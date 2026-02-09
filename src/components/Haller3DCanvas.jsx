import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
import { HALLER_GLTF_BASE_URL } from "../data/hallerConfig";

/** Phase B: true로 전환 시 glTF 로드 파이프라인 사용. 자산은 HALLER_GLTF_BASE_URL + frontType별 경로. */
const USE_GLTF_MODELS = false;

const Haller3DCanvas = forwardRef(function Haller3DCanvas(
  { configuration, selectedModuleId, onSelectModule },
  ref
) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const shadowGeneratorRef = useRef(null);
  const moduleNodesRef = useRef(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.06, 0.06, 0.06, 1);
    sceneRef.current = scene;

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 3,
      Math.PI / 3,
      14,
      new BABYLON.Vector3(0, 2, 0),
      scene
    );
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 30;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true);

    const hemiLight = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemiLight.intensity = 0.6;

    const dirLight = new BABYLON.DirectionalLight(
      "dirLight",
      new BABYLON.Vector3(-0.5, -1, -0.5),
      scene
    );
    dirLight.position = new BABYLON.Vector3(6, 10, 6);
    dirLight.intensity = 0.9;

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.usePoissonSampling = true;
    shadowGeneratorRef.current = shadowGenerator;

    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 30, height: 30, subdivisions: 40 },
      scene
    );
    const groundMaterial = new BABYLON.StandardMaterial(
      "groundMaterial",
      scene
    );
    groundMaterial.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.12);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    const grid = BABYLON.MeshBuilder.CreateGround(
      "grid",
      { width: 30, height: 30, subdivisions: 30 },
      scene
    );
    const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);
    gridMaterial.diffuseColor = new BABYLON.Color3(0.18, 0.18, 0.18);
    gridMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    gridMaterial.wireframe = true;
    grid.material = gridMaterial;
    grid.position.y = 0.001;

    scene.onPointerObservable.add((pointerInfo) => {
      if (!onSelectModule) return;
      if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERPICK) return;

      const pickInfo = pointerInfo.pickInfo;
      if (!pickInfo?.hit || !pickInfo.pickedMesh) return;

      let current = pickInfo.pickedMesh;
      while (current) {
        const moduleId = current.metadata?.moduleId;
        if (moduleId) {
          onSelectModule(moduleId);
          break;
        }
        current = current.parent;
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.stopRenderLoop();
      engine.dispose();
      sceneRef.current = null;
      engineRef.current = null;
      shadowGeneratorRef.current = null;
      moduleNodesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * frontType별 메쉬 생성 (Phase A: 프리미티브).
   * Phase B: USE_GLTF_MODELS && HALLER_GLTF_BASE_URL일 때
   * SceneLoader.ImportMeshAsync로 glTF 로드 후 노드에 부착·스케일 적용.
   */
  const buildModuleMeshes = (
    scene,
    node,
    id,
    frontType,
    color,
    isSelected,
    shadowGenerator
  ) => {
    void USE_GLTF_MODELS;
    void HALLER_GLTF_BASE_URL;
    node.getChildren().forEach((c) => c.dispose());

    const frame = BABYLON.MeshBuilder.CreateBox(
      `moduleFrame-${id}`,
      {
        width: 1.02,
        height: 1.02,
        depth: 1.02,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      },
      scene
    );
    const frameMat = new BABYLON.StandardMaterial(
      `moduleFrameMaterial-${id}`,
      scene
    );
    frameMat.diffuseColor = new BABYLON.Color3(0.85, 0.85, 0.85);
    frameMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    frameMat.wireframe = true;
    frameMat.backFaceCulling = false;
    frame.material = frameMat;
    frame.parent = node;

    const body = BABYLON.MeshBuilder.CreateBox(
      `moduleBody-${id}`,
      { width: 0.96, height: 0.96, depth: 0.96 },
      scene
    );
    const bodyMat = new BABYLON.StandardMaterial(
      `moduleBodyMaterial-${id}`,
      scene
    );
    try {
      bodyMat.diffuseColor = BABYLON.Color3.FromHexString(color);
    } catch {
      bodyMat.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
    }
    bodyMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    if (frontType === "glass") {
      bodyMat.alpha = 0.65;
      bodyMat.backFaceCulling = false;
    }
    body.material = bodyMat;
    body.parent = node;

    let doorPanel = null;
    let drawerFront = null;
    if (frontType === "door") {
      doorPanel = BABYLON.MeshBuilder.CreatePlane(
        `moduleDoor-${id}`,
        { size: 0.94, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
        scene
      );
      doorPanel.position.z = 0.48;
      const doorMat = new BABYLON.StandardMaterial(
        `moduleDoorMaterial-${id}`,
        scene
      );
      try {
        doorMat.diffuseColor = BABYLON.Color3.FromHexString(color);
      } catch {
        doorMat.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
      }
      doorMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      doorPanel.material = doorMat;
      doorPanel.parent = node;
      if (shadowGenerator) shadowGenerator.addShadowCaster(doorPanel);
    }

    if (frontType === "drawer") {
      drawerFront = BABYLON.MeshBuilder.CreateBox(
        `moduleDrawerFront-${id}`,
        { width: 0.94, height: 0.3, depth: 0.04 },
        scene
      );
      drawerFront.position.y = -0.33;
      drawerFront.position.z = 0.48;
      const drawerMat = new BABYLON.StandardMaterial(
        `moduleDrawerMaterial-${id}`,
        scene
      );
      try {
        drawerMat.diffuseColor = BABYLON.Color3.FromHexString(color);
      } catch {
        drawerMat.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
      }
      drawerMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.25);
      drawerFront.material = drawerMat;
      drawerFront.parent = node;
      if (shadowGenerator) shadowGenerator.addShadowCaster(drawerFront);
    }

    if (shadowGenerator) {
      shadowGenerator.addShadowCaster(frame);
      shadowGenerator.addShadowCaster(body);
    }

    const colorMeshes = [body];
    if (doorPanel) colorMeshes.push(doorPanel);
    if (drawerFront) colorMeshes.push(drawerFront);
    colorMeshes.forEach((mesh) => {
      if (!mesh || !(mesh.material instanceof BABYLON.StandardMaterial)) return;
      mesh.material.emissiveColor = isSelected
        ? BABYLON.Color3.FromHexString("#fbbf24")
        : new BABYLON.Color3(0, 0, 0);
    });
  };

  useEffect(() => {
    const scene = sceneRef.current;
    const shadowGenerator = shadowGeneratorRef.current;
    if (!scene || !configuration) return;

    const modules = Array.isArray(configuration.modules)
      ? configuration.modules
      : [];
    const nodeMap = moduleNodesRef.current;

    const existingIds = new Set(nodeMap.keys());
    const nextIds = new Set(modules.map((m) => m.id));

    existingIds.forEach((id) => {
      if (!nextIds.has(id)) {
        const node = nodeMap.get(id);
        if (node) {
          node.getChildren()?.forEach((child) => child.dispose());
          node.dispose();
        }
        nodeMap.delete(id);
      }
    });

    modules.forEach((module) => {
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
      } = module;

      const safeWidth = Number.isFinite(width) ? Math.max(width, 0.1) : 1;
      const safeHeight = Number.isFinite(height) ? Math.max(height, 0.1) : 1;
      const safeDepth = Number.isFinite(depth) ? Math.max(depth, 0.1) : 1;

      const unit = 1.2;
      const x = gridX * unit;
      const y = safeHeight / 2 + gridY * unit;
      const z = gridZ * unit;

      let node = nodeMap.get(id);
      const needsRebuild =
        !node ||
        (node.metadata?.lastFrontType !== frontType);

      if (!node) {
        node = new BABYLON.TransformNode(`moduleNode-${id}`, scene);
        node.metadata = { moduleId: id };
        nodeMap.set(id, node);
      }

      if (needsRebuild) {
        node.metadata.lastFrontType = frontType;
        buildModuleMeshes(
          scene,
          node,
          id,
          frontType,
          color,
          selectedModuleId === id,
          shadowGenerator
        );
      }

      node.scaling = new BABYLON.Vector3(safeWidth, safeHeight, safeDepth);
      node.position = new BABYLON.Vector3(x, y, z);

      const children = node.getChildren();
      children.forEach((child) => {
        if (!(child instanceof BABYLON.Mesh)) return;
        const isColorMesh =
          child.name.startsWith("moduleBody-") ||
          child.name.startsWith("moduleDoor-") ||
          child.name.startsWith("moduleDrawerFront-");
        if (isColorMesh && child.material instanceof BABYLON.StandardMaterial) {
          try {
            child.material.diffuseColor = BABYLON.Color3.FromHexString(color);
          } catch {
            child.material.diffuseColor =
              BABYLON.Color3.FromHexString("#ffffff");
          }
          if (child.material.alpha !== undefined && frontType === "glass") {
            child.material.alpha = 0.65;
          }
          child.material.emissiveColor =
            selectedModuleId && id === selectedModuleId
              ? BABYLON.Color3.FromHexString("#fbbf24")
              : new BABYLON.Color3(0, 0, 0);
        }
      });
    });
  }, [configuration, selectedModuleId, onSelectModule]);

  useImperativeHandle(ref, () => ({
    captureAsDataURL(mimeType = "image/png") {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL(mimeType);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[400px] md:h-[520px] bg-gray-900 rounded-sm"
    />
  );
});

export default Haller3DCanvas;
