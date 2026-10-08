// ============================================================
// Server-side insert of `generations` rows (service role)
// ============================================================
// Every generate route registers its row(s) here BEFORE calling
// n8n. The generation id is created in the browser, so the insert
// must never overwrite a row that already exists:
//
//   • the old `Prefer: resolution=merge-duplicates` upsert let a
//     caller re-send any existing id and take over / reset that row
//     (including someone else's), and
//   • re-sending your own id charged credits a second time.
//
// `ignore-duplicates` + a row-count check turns a re-used id into
// a clean 409 instead.
// ============================================================

export class DuplicateGenerationIdError extends Error {
  constructor() {
    super("This generation id was already used. Please start the generation again.");
    this.name = "DuplicateGenerationIdError";
  }
}

export type NewGenerationRow = {
  id: string;
  user_id: string;
  status: "pending";
  [column: string]: unknown;
};

export async function insertGenerationRowsStrict(rows: NewGenerationRow[]): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role env vars missing.");
  }
  if (rows.length === 0) return;

  const response = await fetch(`${url}/rest/v1/generations?select=id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`generations insert failed: ${text}`);
  }

  const inserted = (await response.json().catch(() => [])) as unknown;
  const insertedCount = Array.isArray(inserted) ? inserted.length : 0;

  if (insertedCount !== rows.length) {
    // At least one id already existed. Remove the rows this call DID
    // create so a failed request leaves nothing half-registered.
    const newIds = Array.isArray(inserted)
      ? inserted
          .map((r: unknown) => (r as { id?: unknown } | null)?.id)
          .filter((id): id is string => typeof id === "string")
      : [];
    if (newIds.length > 0) {
      await fetch(
        `${url}/rest/v1/generations?id=in.(${newIds.map((id) => `"${id}"`).join(",")})&status=eq.pending`,
        {
          method: "DELETE",
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: "no-store",
        },
      ).catch(() => undefined);
    }
    throw new DuplicateGenerationIdError();
  }
}

/** Shared-secret header for n8n webhooks (see N8N_WEBHOOK_SECRET). */
export function n8nHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) headers["x-af-webhook-secret"] = secret;
  return headers;
}
