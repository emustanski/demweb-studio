// Parses the manifest output from treosh/lighthouse-ci-action and writes the
// representative run's performance score into src/data/lighthouse-score.json.
// Invoked by .github/workflows/lighthouse.yml — not part of the app build.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const manifestArg = process.argv[2];
if (!manifestArg) {
  console.error('Usage: node write-lighthouse-score.mjs <manifest-json>');
  process.exit(1);
}

const manifest = JSON.parse(manifestArg);
const representative = manifest.find((entry) => entry.isRepresentativeRun) ?? manifest[0];

if (!representative?.summary?.performance) {
  console.error('No performance score found in Lighthouse CI manifest.');
  process.exit(1);
}

const score = Math.round(representative.summary.performance * 100);
const outPath = fileURLToPath(new URL('../src/data/lighthouse-score.json', import.meta.url));

writeFileSync(
  outPath,
  JSON.stringify({ score, updatedAt: new Date().toISOString() }, null, 2) + '\n',
);

console.log(`Wrote Lighthouse score ${score} to ${outPath}`);
