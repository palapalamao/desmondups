// R5: production source and the explicitly built POD expose no demo seed or mock entry.
"use strict";

const fs = require("fs");
const {
  productionSourceFiles,
  requireOutputPod,
  withExtractedPod,
  relative,
} = require("./pod-check-utils");

const forbidden = ["seed.json", "seed-data.js", "MockAdapter", "mock=1"];

function scan(files, label) {
  const hits = [];
  files.forEach((file) => {
    const body = fs.readFileSync(file);
    forbidden.forEach((token) => {
      if (body.includes(Buffer.from(token))) hits.push(label + " " + relative(file) + ": " + token);
    });
  });
  return hits;
}

try {
  const podFile = requireOutputPod(process.argv.slice(2), "node scripts/check/r5-idempotent-seed.cjs");
  const hits = scan(productionSourceFiles(), "source");
  withExtractedPod(podFile, (_podDir, podFiles) => hits.push(...scan(podFiles, "pod")));
  if (hits.length) throw new Error("R5 禁止入口:\n" + hits.join("\n"));
  console.log("PASS R5 production source and explicit output POD contain no seed or mock entry");
} catch (error) {
  console.error("FAIL R5", error.message);
  process.exit(1);
}
