import { spawnSync } from "node:child_process";

/**
 * Regenerate the checked-in OpenAPI type artifact when a backend source is
 * explicitly provided. CI and local UI-only builds use the last verified
 * schema artifact; setting OPENAPI_SPEC_SOURCE makes sync failures fatal.
 */
const source = process.env.OPENAPI_SPEC_SOURCE;

if (!source) {
  console.log("OPENAPI_SPEC_SOURCE is not set; using the verified schema artifact.");
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["--no-install", "openapi-typescript", source, "-o", "src/types/schema.d.ts"],
  { stdio: "inherit", shell: process.platform === "win32" },
);

if (result.error) {
  console.error(`OpenAPI schema generation failed: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
