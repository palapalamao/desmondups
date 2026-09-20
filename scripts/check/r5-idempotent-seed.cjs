// R5: production source and the explicitly built POD expose no demo seed or mock entry.
"use strict";

const fs = require("fs");
const {
  ROOT,
  productionSourceFiles,
  normalizedRelative,
  findForbiddenPathHits,
  findForbiddenContentHits,
  requireOutputPod,
  withExtractedPod,
} = require("./pod-check-utils");

const forbidden = ["seed.json", "seed-data.js", "MockAdapter", "mock=1"];

const sourcePathRules = {
  exact: [
    "extensions/upsPod/frontend/seed.json",
    "extensions/upsPod/frontend/seed-data.js",
    "scripts/seed/demoSeed.js",
    "scripts/seed/upsPodTreeSeed.fan",
  ],
  prefixes: ["scripts/seed/"],
};
const podPathRules = {
  exact: ["frontend/seed.json", "frontend/seed-data.js", "scripts/seed/demoSeed.js"],
  prefixes: ["scripts/seed/"],
};
const seedBoundaryRules = [
  { name: "upsPodTreeSeed", pattern: /upsPodTreeSeed/i },
  { name: "demoSeed", pattern: /demoSeed/i },
  { name: "seed project tree", pattern: /seed project tree/i },
  { name: "seed deployment", pattern: /\bseed\b/i, paths: /^scripts\/(?:deploy|install).*\.ps1$/i },
];

function scan(files, label, baseDir) {
  const hits = [];
  files.forEach((file) => {
    const body = fs.readFileSync(file);
    forbidden.forEach((token) => {
      if (body.includes(Buffer.from(token))) {
        hits.push(label + " " + normalizedRelative(baseDir, file) + ": " + token);
      }
    });
  });
  return hits;
}

try {
  const podFile = requireOutputPod(process.argv.slice(2), "node scripts/check/r5-idempotent-seed.cjs");
  const sourceFiles = productionSourceFiles();
  const hits = scan(sourceFiles, "source", ROOT);
  hits.push(...findForbiddenPathHits(sourceFiles, ROOT, sourcePathRules, "source"));
  hits.push(...findForbiddenContentHits(sourceFiles, ROOT, seedBoundaryRules, "source"));
  withExtractedPod(podFile, (podDir, podFiles, podEntries) => {
    hits.push(...scan(podFiles, "pod", podDir));
    hits.push(...findForbiddenPathHits(podEntries, null, podPathRules, "pod"));
    hits.push(...findForbiddenContentHits(podFiles, podDir, seedBoundaryRules, "pod"));
  });
  if (hits.length) throw new Error("R5 禁止入口:\n" + hits.join("\n"));
  console.log("PASS R5 production source and explicit output POD contain no seed or mock entry");
} catch (error) {
  console.error("FAIL R5", error.message);
  process.exit(1);
}
