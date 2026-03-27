/**
 * CLI: `npm run onboarding:csv -- --in <file.csv> --out-dir data/onboarding`
 */
import { runCsvToJsonCli } from "./csv-to-json.js";

runCsvToJsonCli(process.argv.slice(2));
