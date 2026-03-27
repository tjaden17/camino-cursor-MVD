/**
 * Convert a **structured** onboarding CSV (one row per user) into
 * `*-onboarding-derived.json` files aligned to `onboarding-profile` schema.
 *
 * List fields use pipe `|` separators within a cell. Empty cells use sensible defaults.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join } from "node:path";
import { parse } from "csv-parse/sync";
import { logInfo } from "../logging/logger.js";
import { assertPathUnderRepo } from "../path-safety.js";
import { createMvdValidator } from "../validate/ajv.js";
import { getRepoRoot } from "../repo-root.js";

export interface CsvToJsonOptions {
  inputPath: string;
  outDir: string;
  derivedBy: string;
  documentName?: string;
}

function splitList(cell: string | undefined): string[] {
  if (cell == null || !String(cell).trim()) return [];
  return String(cell)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTeamSize(cell: string | undefined): number | null {
  if (cell == null || !String(cell).trim()) return null;
  const n = Number.parseInt(String(cell).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

/** Build one onboarding profile object from a CSV row (header keys = column names). */
export function rowToOnboardingProfile(
  row: Record<string, string>,
  meta: { derivedBy: string; document: string; derivedAt: string },
): unknown {
  const userId = String(row.user_id ?? row.userId ?? "").trim().toLowerCase();
  if (!userId) throw new Error("Row missing user_id");

  const primaryGoals = splitList(row.primary_goals);
  const reviewMoments = splitList(row.review_moments);
  const decisionOutcomes = splitList(row.decision_outcomes);
  const currentTop = splitList(row.current_top_metrics);
  const additionalFocus = splitList(row.additional_focus_metrics);
  const uses = splitList(row.uses_data_sources);
  const knownConstraints = splitList(row.known_constraints);
  const painPoints = splitList(row.pain_points);
  const requiredTransparency = splitList(row.required_transparency);
  const requested = splitList(row.requested_signal_candidates);
  const recommended = splitList(row.recommended_signal_candidates);
  const missingStructured = splitList(row.missing_structured_fields);

  if (primaryGoals.length < 1) throw new Error(`${userId}: primary_goals must have at least one entry`);
  if (reviewMoments.length < 1) throw new Error(`${userId}: review_moments must have at least one entry`);
  if (decisionOutcomes.length < 1) throw new Error(`${userId}: decision_outcomes must have at least one entry`);
  if (currentTop.length < 1) throw new Error(`${userId}: current_top_metrics must have at least one entry`);
  if (uses.length < 1) throw new Error(`${userId}: uses_data_sources must have at least one entry`);
  if (requested.length < 1) throw new Error(`${userId}: requested_signal_candidates must have at least one entry`);
  if (recommended.length < 1) throw new Error(`${userId}: recommended_signal_candidates must have at least one entry`);

  const gapsNote = String(row.gaps_note ?? "").trim() || "Imported from CSV; review gaps_and_assumptions.";

  return {
    source: {
      type: "derived_from_onboarding_csv",
      document: meta.document,
      derived_by: meta.derivedBy,
      derived_at: meta.derivedAt,
    },
    user: {
      user_id: userId,
      name: String(row.name ?? userId).trim(),
      role: String(row.role ?? "Unknown").trim(),
      experience_summary: String(row.experience_summary ?? "").trim() || undefined,
    },
    company_context: {
      company: String(row.company ?? "unknown").trim(),
      industry: String(row.industry ?? "unknown").trim(),
      business_model: row.business_model?.trim() ? row.business_model.trim() : null,
      stage: row.stage?.trim() ? row.stage.trim() : null,
      team_size: parseTeamSize(row.team_size),
    },
    decision_context: {
      primary_goals: primaryGoals,
      review_moments: reviewMoments,
      decision_outcomes: decisionOutcomes,
    },
    owned_metrics: {
      current_top_metrics: currentTop,
      additional_focus_metrics: additionalFocus.length ? additionalFocus : undefined,
    },
    data_sources: {
      uses,
      known_constraints: knownConstraints.length ? knownConstraints : undefined,
    },
    pain_points: painPoints.length ? painPoints : ["(none recorded)"],
    trust_and_validation: {
      attitude_to_ai: String(row.attitude_to_ai ?? "Needs transparency and verification").trim(),
      required_transparency: requiredTransparency.length ? requiredTransparency : undefined,
    },
    signal_preferences: {
      requested_signal_candidates: requested,
      recommended_signal_candidates: recommended,
    },
    gaps_and_assumptions: {
      missing_structured_fields: missingStructured.length ? missingStructured : ["(review after import)"],
      note: gapsNote,
    },
  };
}

function assertOnboardingProfileHasUser(
  profile: unknown,
): asserts profile is { user: { user_id: string } } {
  if (
    typeof profile !== "object" ||
    profile === null ||
    !("user" in profile) ||
    typeof (profile as { user: unknown }).user !== "object" ||
    (profile as { user: unknown }).user === null ||
    typeof (profile as { user: { user_id?: unknown } }).user.user_id !== "string"
  ) {
    throw new Error("Profile missing user.user_id after schema validation");
  }
}

export function convertCsvToOnboardingFiles(opts: CsvToJsonOptions): string[] {
  const raw = readFileSync(opts.inputPath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const ajv = createMvdValidator();
  const validate = ajv.getSchema("https://camin.local/schemas/onboarding-profile.json");
  if (!validate) throw new Error("Missing onboarding-profile schema");

  mkdirSync(opts.outDir, { recursive: true });
  const derivedAt = new Date().toISOString().slice(0, 10);
  const document = opts.documentName ?? basename(opts.inputPath);
  const written: string[] = [];

  for (const row of rows) {
    const profile = rowToOnboardingProfile(row, {
      derivedBy: opts.derivedBy,
      document,
      derivedAt,
    });
    if (!validate(profile)) {
      throw new Error(`Invalid profile for row: ${ajv.errorsText()}`);
    }
    assertOnboardingProfileHasUser(profile);
    const uid = profile.user.user_id;
    const outPath = join(opts.outDir, `${uid}-onboarding-derived.json`);
    writeFileSync(outPath, JSON.stringify(profile, null, 2), "utf8");
    written.push(outPath);
  }
  return written;
}

function parseArgs(argv: string[]): CsvToJsonOptions {
  let inputPath = "";
  let outDir = "";
  let derivedBy = "csv-to-json";
  let documentName: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in" && argv[i + 1]) inputPath = argv[++i]!;
    else if (a === "--out-dir" && argv[i + 1]) outDir = argv[++i]!;
    else if (a === "--derived-by" && argv[i + 1]) derivedBy = argv[++i]!;
    else if (a === "--document" && argv[i + 1]) documentName = argv[++i]!;
  }
  if (!inputPath) throw new Error("Usage: --in <file.csv> --out-dir <dir> [--derived-by name] [--document name]");
  const repoRoot = getRepoRoot();
  const resolvedIn = isAbsolute(inputPath) ? inputPath : join(repoRoot, inputPath);
  const resolvedOut = outDir
    ? isAbsolute(outDir)
      ? outDir
      : join(repoRoot, outDir)
    : join(repoRoot, "data", "onboarding");
  assertPathUnderRepo(repoRoot, resolvedIn, "--in");
  assertPathUnderRepo(repoRoot, resolvedOut, "--out-dir");
  return { inputPath: resolvedIn, outDir: resolvedOut, derivedBy, documentName };
}

export function runCsvToJsonCli(argv: string[]): void {
  const opts = parseArgs(argv);
  const paths = convertCsvToOnboardingFiles(opts);
  logInfo({
    event: "onboarding_csv_wrote",
    count: paths.length,
    paths,
  });
}
