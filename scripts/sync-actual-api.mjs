import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import openapiTS, { astToString } from "openapi-typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const artifact = path.join(root, "src/contracts/actual-krw-v1/openapi.json");
const manifest = path.join(root, "src/contracts/actual-krw-v1/SHA256SUMS");
const artifactHash = createHash("sha256").update(readFileSync(artifact)).digest("hex");
const expectedHash = readFileSync(manifest, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim().split(/\s+/))
  .find(([, filename]) => filename === "openapi.json")?.[0];

if (!expectedHash || artifactHash !== expectedHash) {
  console.error("Actual account OpenAPI artifact checksum mismatch.");
  process.exit(1);
}

const source = process.env.ACTUAL_OPENAPI_SPEC_SOURCE || artifact;
try {
  const sourceUrl = /^https?:\/\//.test(source) || source.startsWith("file:")
    ? new URL(source)
    : pathToFileURL(path.resolve(root, source));
  const ast = await openapiTS(sourceUrl);
  writeFileSync(path.join(root, "src/types/actual-schema.d.ts"), astToString(ast));
} catch (error) {
  console.error(`Actual OpenAPI type generation failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(1);
}
