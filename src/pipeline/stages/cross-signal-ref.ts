/**
 * Thin re-export layer — the canonical graph and all intelligence
 * functions now live in signal-graph-intel.ts.
 *
 * Existing imports of `getRelatedSignals` and `RelatedSignal` continue
 * to work unchanged.
 */
export type { RelatedSignal } from "./signal-graph-intel.js";
export { getRelatedSignals, SIGNAL_GRAPH } from "./signal-graph-intel.js";
