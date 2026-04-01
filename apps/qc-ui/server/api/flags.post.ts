import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FlagsFile, InspectorFlag } from "../../types/pipeline-inspector";

export default defineEventHandler(async (event) => {
  const root = String(useRuntimeConfig().mvdRepoRoot || "");
  const body = await readBody<{
    page: string;
    itemId?: string;
    section?: string | null;
    note?: string;
    runId?: string;
  }>(event);

  if (!body?.page || typeof body.page !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing page" });
  }

  const outDir = join(root, "out");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "flags.json");

  let doc: FlagsFile = { flags: [] };
  if (existsSync(path)) {
    try {
      doc = JSON.parse(readFileSync(path, "utf8")) as FlagsFile;
      if (!Array.isArray(doc.flags)) doc.flags = [];
    } catch {
      doc = { flags: [] };
    }
  }

  const flag: InspectorFlag = {
    id: `flag-${randomUUID().slice(0, 12)}`,
    page: body.page,
    itemId: body.itemId,
    section: body.section ?? null,
    note: typeof body.note === "string" ? body.note : "",
    createdAt: new Date().toISOString(),
  };

  if (body.runId && typeof body.runId === "string") doc.runId = body.runId;

  doc.flags.push(flag);
  writeFileSync(path, JSON.stringify(doc, null, 2), "utf8");
  return { ok: true, flag };
});
