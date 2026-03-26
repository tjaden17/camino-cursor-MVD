export interface LogContext {
  event: string;
  [key: string]: unknown;
}

export function logInfo(ctx: LogContext): void {
  process.stdout.write(`${JSON.stringify({ level: "info", ts: new Date().toISOString(), ...ctx })}\n`);
}

export function logError(ctx: LogContext): void {
  process.stderr.write(`${JSON.stringify({ level: "error", ts: new Date().toISOString(), ...ctx })}\n`);
}
