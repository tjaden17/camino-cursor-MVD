import { readFileSync } from "node:fs";

export function readJsonOrThrow<T>(path: string, label: string): T {
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as T;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 500,
      statusMessage: `Could not read or parse ${label}: ${detail}`,
    });
  }
}
