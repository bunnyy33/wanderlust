/**
 * scripts/sync-provider.mjs
 * Keeps prisma/schema.prisma usable for BOTH local dev (SQLite) and Vercel
 * production (PostgreSQL/Neon) without flipping the file by hand.
 *   - If DATABASE_URL starts with "file:"  -> set provider = "sqlite"
 *   - Otherwise (postgres:// / postgresql://) -> set provider = "postgresql"
 * The committed schema is "postgresql" (Vercel needs it). This script runs
 * locally before prisma commands to flip to sqlite when a local file DB is in use.
 * Idempotent — safe to run repeatedly.
 */
import { readFileSync, writeFileSync } from "node:fs";

const SCHEMA = "prisma/schema.prisma";
const url = process.env.DATABASE_URL ?? "";
const provider = url.startsWith("file:") ? "sqlite" : "postgresql";

let src = readFileSync(SCHEMA, "utf8");
const re = /(\ndatasource db \{\n\s*provider = )"(sqlite|postgresql)"/;
if (!re.test(src)) {
  console.log(`[sync-provider] datasource block not matched, leaving as-is (target=${provider})`);
  process.exit(0);
}
src = src.replace(re, `$1"${provider}"`);
writeFileSync(SCHEMA, src);
console.log(`[sync-provider] provider set to "${provider}" (DATABASE_URL=${url ? "<set>" : "<empty>"})`);
