/**
 * Loose shapes for inspector JSON under `out/` (see IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md).
 */

export interface InspectorFlag {
  id: string;
  page: string;
  itemId?: string;
  section?: string | null;
  note: string;
  createdAt: string;
}

export interface FlagsFile {
  runId?: string;
  flags: InspectorFlag[];
}
