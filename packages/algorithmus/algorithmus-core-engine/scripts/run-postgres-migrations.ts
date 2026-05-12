import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("[db:migrate] DATABASE_URL is required");
  }
  return value;
}

async function main(): Promise<void> {
  const databaseUrl = requireDatabaseUrl();
  const migrationsDir = join(process.cwd(), "src", "infra", "postgres", "migrations");
  const allFiles = await readdir(migrationsDir);
  const migrationFiles = allFiles
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (migrationFiles.length === 0) {
    console.log("[db:migrate] no .sql migrations found");
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    for (const file of migrationFiles) {
      const fullPath = join(migrationsDir, file);
      const sql = await readFile(fullPath, "utf8");
      console.log(`[db:migrate] running ${file}`);
      await client.query(sql);
    }
    console.log(`[db:migrate] completed ${migrationFiles.length} migration(s)`);
  } catch (error) {
    console.error("[db:migrate] migration failed");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
