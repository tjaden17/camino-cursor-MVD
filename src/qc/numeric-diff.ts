/**
 * Compare AI-reported or UI-reported numbers to deterministic replay.
 * Tolerance: integer counts exact; percentages use relative epsilon.
 */

export interface NumericDiffResult {
  pass: boolean;
  replayValue: number;
  claimedValue: number;
  delta: number;
  toleranceUsed: number;
  message: string;
}

const DEFAULT_EPS = 1e-9;

export function diffNumeric(
  replayValue: number,
  claimedValue: number,
  options?: { tolerance?: number; isInteger?: boolean }
): NumericDiffResult {
  const tol = options?.tolerance ?? (options?.isInteger !== false ? 0 : DEFAULT_EPS);
  const delta = Math.abs(replayValue - claimedValue);
  const pass = delta <= tol;
  return {
    pass,
    replayValue,
    claimedValue,
    delta,
    toleranceUsed: tol,
    message: pass
      ? "Numeric match within tolerance."
      : `Mismatch: replay=${replayValue}, claimed=${claimedValue}, |Δ|=${delta}, tol=${tol}`,
  };
}
