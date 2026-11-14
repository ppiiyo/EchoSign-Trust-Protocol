/** RFC 6962–style Merkle tree */
import crypto from 'node:crypto';

const H = (data: Buffer) => crypto.createHash('sha256').update(data).digest();

export function hashLeaf(data: Buffer): Buffer {
  return H(Buffer.concat([Buffer.from([0x00]), data]));
}

export function hashNode(left: Buffer, right: Buffer): Buffer {
  return H(Buffer.concat([Buffer.from([0x01]), left, right]));
}

export function computeRootFromLeafHashes(leafHashes: Buffer[]): Buffer {
  if (leafHashes.length === 0) {
    return H(Buffer.from('EMPTY_MERKLE_ROOT_V1'));
  }
  let level = leafHashes.map((h) => Buffer.from(h));
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) next.push(level[i]);
      else next.push(hashNode(level[i], level[i + 1]));
    }
    level = next;
  }
  return level[0];
}

export function inclusionProof(
  leafHashes: Buffer[],
  index: number
): { leafHash: Buffer; root: Buffer; path: Array<{ side: 'L' | 'R'; hash: Buffer }> } {
  if (index < 0 || index >= leafHashes.length) {
    throw new Error(`leaf index out of range: ${index}`);
  }
  const path: Array<{ side: 'L' | 'R'; hash: Buffer }> = [];
  let level = leafHashes.map((h) => Buffer.from(h));
  let idx = index;
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) {
        next.push(level[i]);
      } else {
        const left = level[i];
        const right = level[i + 1];
        next.push(hashNode(left, right));
        if (idx === i) path.push({ side: 'R', hash: Buffer.from(right) });
        else if (idx === i + 1) path.push({ side: 'L', hash: Buffer.from(left) });
      }
    }
    idx = Math.floor(idx / 2);
    level = next;
  }
  return { leafHash: Buffer.from(leafHashes[index]), root: level[0], path };
}

export function verifyInclusion(
  leafHash: Buffer,
  path: Array<{ side: 'L' | 'R'; hash: Buffer | string }>,
  expectedRoot: Buffer | string
): boolean {
  let acc = Buffer.from(leafHash);
  for (const step of path) {
    const sib = typeof step.hash === 'string' ? Buffer.from(step.hash, 'hex') : Buffer.from(step.hash);
    acc = step.side === 'L' ? hashNode(sib, acc) : hashNode(acc, sib);
  }
  const root = typeof expectedRoot === 'string' ? Buffer.from(expectedRoot, 'hex') : expectedRoot;
  return acc.equals(root);
}

export function consistencyCheck(
  leafHashes: Buffer[],
  oldSize: number,
  oldRootHex: string,
  newRootHex: string
): boolean {
  if (oldSize < 0 || oldSize > leafHashes.length) return false;
  if (oldSize === 0) return true;
  const oldRoot = computeRootFromLeafHashes(leafHashes.slice(0, oldSize));
  const newRoot = computeRootFromLeafHashes(leafHashes);
  return oldRoot.toString('hex') === oldRootHex && newRoot.toString('hex') === newRootHex;
}

export function leafHashHex(data: Buffer): string {
  return hashLeaf(data).toString('hex');
}

export function rootHex(leafHashes: Buffer[]): string {
  return computeRootFromLeafHashes(leafHashes).toString('hex');
}
