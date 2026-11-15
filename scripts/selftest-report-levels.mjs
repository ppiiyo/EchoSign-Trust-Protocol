/**
 * WP-6: report builder always marks L2 as stored (not independently verified).
 */
function buildLevels(sigValid) {
  return [
    { id: 'L1', status: sigValid ? 'pass' : 'fail' },
    { id: 'L2', status: 'stored' },
    { id: 'L3', status: 'stored' },
    { id: 'L4', status: 'not-checked' },
  ];
}
const levels = buildLevels(true);
if (levels[0].status !== 'pass') { console.error('FAIL L1'); process.exit(1); }
if (levels[1].status === 'pass') { console.error('FAIL L2 must not auto-pass'); process.exit(1); }
if (levels.every((l) => l.status === 'pass')) {
  console.error('FAIL must not claim all levels pass');
  process.exit(1);
}
console.log('OK report levels honesty (L1 can pass; L2/L3 stored; L4 not-checked)');
