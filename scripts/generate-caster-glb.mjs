/**
 * USM-style caster wheel GLB generator
 * Creates a detailed swivel caster model in glTF 2.0 binary format.
 *
 * Structure: mount plate -> axle stem -> dual fork -> rubber wheel + chrome hub
 */
import { writeFileSync } from "fs";

const PI = Math.PI;
const TWO_PI = PI * 2;

function cylinderGeometry(
  radiusTop,
  radiusBot,
  height,
  segments,
  yOffset = 0
) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * TWO_PI;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    positions.push(
      cos * radiusTop,
      yOffset + height / 2,
      sin * radiusTop
    );
    normals.push(cos, 0, sin);

    positions.push(
      cos * radiusBot,
      yOffset - height / 2,
      sin * radiusBot
    );
    normals.push(cos, 0, sin);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, c, b, d);
  }

  const topCenter = positions.length / 3;
  positions.push(0, yOffset + height / 2, 0);
  normals.push(0, 1, 0);
  const botCenter = topCenter + 1;
  positions.push(0, yOffset - height / 2, 0);
  normals.push(0, -1, 0);

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const c = (i + 1) * 2;
    indices.push(topCenter, c, a);
    indices.push(botCenter, a + 1, c + 1);
  }

  return { positions, normals, indices };
}

function torusGeometry(
  majorR,
  minorR,
  majorSeg,
  minorSeg,
  yOffset = 0
) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let j = 0; j <= majorSeg; j++) {
    const phi = (j / majorSeg) * TWO_PI;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let i = 0; i <= minorSeg; i++) {
      const theta = (i / minorSeg) * TWO_PI;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const x =
        (majorR + minorR * cosTheta) * cosPhi;
      const y = minorR * sinTheta + yOffset;
      const z =
        (majorR + minorR * cosTheta) * sinPhi;

      positions.push(x, y, z);

      const nx = cosTheta * cosPhi;
      const ny = sinTheta;
      const nz = cosTheta * sinPhi;
      normals.push(nx, ny, nz);
    }
  }

  for (let j = 0; j < majorSeg; j++) {
    for (let i = 0; i < minorSeg; i++) {
      const a = j * (minorSeg + 1) + i;
      const b = a + minorSeg + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  return { positions, normals, indices };
}

function mergeGeometries(geoList) {
  const pos = [];
  const nrm = [];
  const idx = [];
  let offset = 0;

  for (const g of geoList) {
    pos.push(...g.positions);
    nrm.push(...g.normals);
    for (const i of g.indices) idx.push(i + offset);
    offset += g.positions.length / 3;
  }

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nrm),
    indices: new Uint16Array(idx),
  };
}

function computeBounds(positions) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    maxY = Math.max(maxY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

function buildCasterMeshes() {
  const mountGeo = cylinderGeometry(0.025, 0.025, 0.01, 20, 0);
  const axleGeo = cylinderGeometry(0.01, 0.01, 0.02, 12, -0.015);

  const forkGeos = [];
  const forkH = 0.05;
  const forkSpread = 0.022;
  const forkR = 0.005;
  for (const side of [-1, 1]) {
    const fg = cylinderGeometry(forkR, forkR, forkH, 8, -0.025 - forkH / 2);
    for (let i = 0; i < fg.positions.length; i += 3) {
      fg.positions[i + 2] += side * forkSpread;
    }
    forkGeos.push(fg);
  }

  const bridgeGeo = cylinderGeometry(forkR, forkR, forkSpread * 2, 8, 0);
  for (let i = 0; i < bridgeGeo.positions.length; i += 3) {
    const oldY = bridgeGeo.positions[i + 1];
    const oldZ = bridgeGeo.positions[i + 2];
    bridgeGeo.positions[i + 1] = -0.025 - forkH + (-oldZ);
    bridgeGeo.positions[i + 2] = oldY;

    const ony = bridgeGeo.normals[i + 1];
    const onz = bridgeGeo.normals[i + 2];
    bridgeGeo.normals[i + 1] = -onz;
    bridgeGeo.normals[i + 2] = ony;
  }

  const chromeMesh = mergeGeometries([
    mountGeo, axleGeo, ...forkGeos, bridgeGeo,
  ]);

  const wheelR = 0.06;
  const wheelMinorR = 0.012;
  const wheelCenterY = -0.025 - forkH + wheelR * 0.15;
  const wheelGeo = torusGeometry(
    wheelR - wheelMinorR,
    wheelMinorR,
    24,
    12,
    wheelCenterY
  );

  const hubGeo = cylinderGeometry(
    wheelR * 0.3,
    wheelR * 0.3,
    0.018,
    12,
    0
  );
  for (let i = 0; i < hubGeo.positions.length; i += 3) {
    const oldY = hubGeo.positions[i + 1];
    const oldZ = hubGeo.positions[i + 2];
    hubGeo.positions[i + 1] = wheelCenterY + (-oldZ);
    hubGeo.positions[i + 2] = oldY;

    const ony = hubGeo.normals[i + 1];
    const onz = hubGeo.normals[i + 2];
    hubGeo.normals[i + 1] = -onz;
    hubGeo.normals[i + 2] = ony;
  }

  const rubberMesh = mergeGeometries([wheelGeo, hubGeo]);

  return { chromeMesh, rubberMesh };
}

function buildGLB() {
  const { chromeMesh, rubberMesh } = buildCasterMeshes();

  const posBytes1 = chromeMesh.positions.byteLength;
  const nrmBytes1 = chromeMesh.normals.byteLength;
  const idxBytes1 = chromeMesh.indices.byteLength;

  const posBytes2 = rubberMesh.positions.byteLength;
  const nrmBytes2 = rubberMesh.normals.byteLength;
  const idxBytes2 = rubberMesh.indices.byteLength;

  const totalBinSize =
    posBytes1 + nrmBytes1 + idxBytes1 +
    posBytes2 + nrmBytes2 + idxBytes2;

  const padded = totalBinSize % 4 === 0
    ? totalBinSize
    : totalBinSize + (4 - (totalBinSize % 4));

  const binBuf = new ArrayBuffer(padded);
  const binView = new DataView(binBuf);
  let off = 0;

  function writeF32Arr(arr) {
    const start = off;
    for (let i = 0; i < arr.length; i++) {
      binView.setFloat32(off, arr[i], true);
      off += 4;
    }
    return start;
  }

  function writeU16Arr(arr) {
    const start = off;
    for (let i = 0; i < arr.length; i++) {
      binView.setUint16(off, arr[i], true);
      off += 2;
    }
    return start;
  }

  const pos1Off = writeF32Arr(chromeMesh.positions);
  const nrm1Off = writeF32Arr(chromeMesh.normals);
  const idx1Off = writeU16Arr(chromeMesh.indices);

  const pos2Off = writeF32Arr(rubberMesh.positions);
  const nrm2Off = writeF32Arr(rubberMesh.normals);
  const idx2Off = writeU16Arr(rubberMesh.indices);

  const bounds1 = computeBounds(chromeMesh.positions);
  const bounds2 = computeBounds(rubberMesh.positions);

  const gltf = {
    asset: { version: "2.0", generator: "usm-caster-gen" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "Caster", children: [1, 2] },
      { name: "Chrome", mesh: 0 },
      { name: "Rubber", mesh: 1 },
    ],
    materials: [
      {
        name: "Chrome",
        pbrMetallicRoughness: {
          baseColorFactor: [0.85, 0.85, 0.88, 1],
          metallicFactor: 0.95,
          roughnessFactor: 0.1,
        },
      },
      {
        name: "Rubber",
        pbrMetallicRoughness: {
          baseColorFactor: [0.06, 0.06, 0.06, 1],
          metallicFactor: 0.0,
          roughnessFactor: 0.85,
        },
      },
    ],
    meshes: [
      {
        name: "ChromeMesh",
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
      {
        name: "RubberMesh",
        primitives: [
          {
            attributes: { POSITION: 3, NORMAL: 4 },
            indices: 5,
            material: 1,
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: chromeMesh.positions.length / 3,
        type: "VEC3",
        max: bounds1.max,
        min: bounds1.min,
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: chromeMesh.normals.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: chromeMesh.indices.length,
        type: "SCALAR",
      },
      {
        bufferView: 3,
        componentType: 5126,
        count: rubberMesh.positions.length / 3,
        type: "VEC3",
        max: bounds2.max,
        min: bounds2.min,
      },
      {
        bufferView: 4,
        componentType: 5126,
        count: rubberMesh.normals.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 5,
        componentType: 5123,
        count: rubberMesh.indices.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: pos1Off,
        byteLength: posBytes1,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: nrm1Off,
        byteLength: nrmBytes1,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: idx1Off,
        byteLength: idxBytes1,
        target: 34963,
      },
      {
        buffer: 0,
        byteOffset: pos2Off,
        byteLength: posBytes2,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: nrm2Off,
        byteLength: nrmBytes2,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: idx2Off,
        byteLength: idxBytes2,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: padded }],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBuf = new TextEncoder().encode(jsonStr);
  const jsonPad =
    jsonBuf.byteLength % 4 === 0
      ? jsonBuf.byteLength
      : jsonBuf.byteLength + (4 - (jsonBuf.byteLength % 4));

  const totalLen = 12 + 8 + jsonPad + 8 + padded;

  const glb = new ArrayBuffer(totalLen);
  const dv = new DataView(glb);
  let p = 0;

  dv.setUint32(p, 0x46546c67, true); p += 4;
  dv.setUint32(p, 2, true); p += 4;
  dv.setUint32(p, totalLen, true); p += 4;

  dv.setUint32(p, jsonPad, true); p += 4;
  dv.setUint32(p, 0x4e4f534a, true); p += 4;
  const jsonArr = new Uint8Array(glb, p, jsonPad);
  jsonArr.fill(0x20);
  jsonArr.set(jsonBuf);
  p += jsonPad;

  dv.setUint32(p, padded, true); p += 4;
  dv.setUint32(p, 0x004e4942, true); p += 4;
  new Uint8Array(glb, p, padded).set(new Uint8Array(binBuf));

  return Buffer.from(glb);
}

const glb = buildGLB();
const outPath = "public/models/haller/caster.glb";
writeFileSync(outPath, glb);
console.log(`Wrote ${glb.length} bytes to ${outPath}`);
