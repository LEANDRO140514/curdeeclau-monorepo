import { Pool } from "pg";

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("[smoke:postgres] DATABASE_URL is required");
  }
  return value;
}

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
  });

  try {
    await pool.query("SELECT 1");

    const requiredTables = ["leads", "lead_external_identities"] as const;
    for (const tableName of requiredTables) {
      const result = await pool.query<{ exists: string | null }>(
        `
        SELECT to_regclass($1) AS exists
        `,
        [`public.${tableName}`],
      );
      if (!result.rows[0]?.exists) {
        throw new Error(`[smoke:postgres] missing table: ${tableName}`);
      }
    }

    console.log("[smoke:postgres] OK");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
