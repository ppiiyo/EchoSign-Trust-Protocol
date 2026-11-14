/** Minimal QR Code generator → SVG (byte mode, ECC M). Real scannable QR, no network. */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i; x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}
function polyMul(p, q) {
  const r = new Uint8Array(p.length + q.length - 1);
  for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) r[i + j] ^= gfMul(p[i], q[j]);
  return r;
}
function rsGenerator(ecCount) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) g = polyMul(g, new Uint8Array([1, EXP[i]]));
  return g;
}
function rsEncode(data, ecCount) {
  const gen = rsGenerator(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
  }
  return res.slice(data.length);
}
const VERSIONS = {
  2: { size: 25, ec: 16, data: 28 },
  3: { size: 29, ec: 26, data: 44 },
  4: { size: 33, ec: 36, data: 64 },
  5: { size: 37, ec: 48, data: 86 },
  6: { size: 41, ec: 64, data: 108 },
  7: { size: 45, ec: 72, data: 124 },
};
function chooseVersion(byteLen) {
  const need = Math.ceil((4 + 8 + byteLen * 8 + 4) / 8);
  for (const v of [2, 3, 4, 5, 6, 7]) if (VERSIONS[v].data >= need) return v;
  throw new Error(`Payload too long for built-in QR (${byteLen} bytes).`);
}
function encodeData(bytes, version) {
  const { data: dataCw, ec: ecCw } = VERSIONS[version];
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, 8);
  for (const b of bytes) put(b, 8);
  const maxBits = dataCw * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    codewords.push(v);
  }
  const pads = [0xec, 0x11]; let pi = 0;
  while (codewords.length < dataCw) { codewords.push(pads[pi % 2]); pi++; }
  const data = new Uint8Array(codewords);
  const ecc = rsEncode(data, ecCw);
  const all = new Uint8Array(data.length + ecc.length);
  all.set(data); all.set(ecc, data.length);
  return all;
}
function makeMatrix(version) {
  const size = VERSIONS[version].size;
  const m = Array.from({ length: size }, () => Array(size).fill(null));
  function finder(r0, c0) {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
      const on = r === -1 || r === 7 || c === -1 || c === 7 ? false
        : r === 0 || r === 6 || c === 0 || c === 6 ? true
        : r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[rr][cc] = on;
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
  m[size - 8][8] = true;
  for (let i = 0; i < 9; i++) { if (m[8][i] === null) m[8][i] = false; if (m[i][8] === null) m[i][8] = false; }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = false;
    if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = false;
  }
  if (version >= 2) {
    const positions = ({ 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38] })[version] || [6, 18];
    for (const r of positions) for (const c of positions) {
      if (r <= 8 && c <= 8) continue;
      if (r <= 8 && c >= size - 9) continue;
      if (r >= size - 9 && c <= 8) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const d = Math.max(Math.abs(dr), Math.abs(dc));
        m[rr][cc] = d === 0 || d === 2;
      }
    }
  }
  return m;
}
function placeData(matrix, codewords) {
  const size = matrix.length; const bits = [];
  for (const b of codewords) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  let bitIdx = 0, upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (matrix[row][c] !== null) continue;
        matrix[row][c] = bitIdx < bits.length ? bits[bitIdx++] === 1 : false;
      }
    }
    upward = !upward;
  }
}
function isFunctionModule(size, r, c) {
  if (r < 9 && c < 9) return true;
  if (r < 9 && c >= size - 8) return true;
  if (r >= size - 8 && c < 9) return true;
  if (r === 6 || c === 6) return true;
  return false;
}
function applyMask(matrix) {
  const size = matrix.length;
  const out = matrix.map((row) => row.slice());
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (isFunctionModule(size, r, c)) continue;
    if ((r + c) % 2 === 0) out[r][c] = !out[r][c];
  }
  return out;
}
function setFormat(matrix, bits) {
  const size = matrix.length;
  const b = []; for (let i = 14; i >= 0; i--) b.push((bits >> i) & 1);
  const coords = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  const coords2 = [[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],[8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]];
  for (let i = 0; i < 15; i++) { matrix[coords[i][0]][coords[i][1]] = b[i] === 1; matrix[coords2[i][0]][coords2[i][1]] = b[i] === 1; }
}
export function qrSvg(text, opts = {}) {
  const scale = opts.scale ?? 4, margin = opts.margin ?? 2;
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  const codewords = encodeData(bytes, version);
  let matrix = makeMatrix(version);
  placeData(matrix, codewords);
  matrix = applyMask(matrix);
  setFormat(matrix, 0x5412);
  const size = matrix.length;
  const dim = (size + margin * 2) * scale;
  let rects = '';
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (matrix[r][c]) {
    rects += `<rect x="${(c + margin) * scale}" y="${(r + margin) * scale}" width="${scale}" height="${scale}" fill="#000"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`;
}
