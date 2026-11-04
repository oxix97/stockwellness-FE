import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const script = `${root}/scripts/sync-actual-api.mjs`;

describe("actual account schema generation", () => {
  it("generates the dedicated schema from the checked-in OpenAPI artifact", () => {
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });

    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(`${root}/src/types/actual-schema.d.ts`, "utf8")).toContain('"listActualAccounts"');
  });
});
