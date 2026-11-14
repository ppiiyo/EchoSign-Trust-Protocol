import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

function buildMerkleTree(leaves: string[]): { root: string; layers: string[][] } {
  if (leaves.length === 0) {
    const emptyRoot = crypto.createHash('sha256').update('EMPTY_MERKLE_ROOT').digest('hex');
    return { root: emptyRoot, layers: [[emptyRoot]] };
  }
  let currentLayer = leaves.map((l) => crypto.createHash('sha256').update(l).digest('hex'));
  const layers: string[][] = [currentLayer];
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
      const combined = left < right ? left + right : right + left;
      nextLayer.push(crypto.createHash('sha256').update(combined).digest('hex'));
    }
    currentLayer = nextLayer;
    layers.push(currentLayer);
  }
  return { root: currentLayer[0], layers };
}

describe('Merkle tree', () => {
  it('produces a stable root for the same leaves', () => {
    const leaves = ['tx-a', 'tx-b', 'tx-c', 'tx-d'];
    expect(buildMerkleTree(leaves).root).toBe(buildMerkleTree(leaves).root);
  });
  it('changes root when any leaf changes', () => {
    expect(buildMerkleTree(['a', 'b', 'c']).root).not.toBe(buildMerkleTree(['a', 'b-TAMPERED', 'c']).root);
  });
  it('handles single leaf', () => {
    const { root, layers } = buildMerkleTree(['only']);
    expect(layers).toHaveLength(1);
    expect(root).toBe(crypto.createHash('sha256').update('only').digest('hex'));
  });
});
