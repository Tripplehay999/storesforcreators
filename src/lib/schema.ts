// Features added in migration 004 degrade gracefully until it has been run.

type DbError = { code?: string; message?: string } | null | undefined;

/** True when an error means a table, column or function from a newer migration doesn't exist yet. */
export function isMissingSchema(error: DbError) {
  if (!error) return false;
  return ["42P01", "42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error.code ?? "")
    || /does not exist|schema cache/i.test(error.message ?? "");
}
