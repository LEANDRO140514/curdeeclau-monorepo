import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../../../core/supabase_client";

/**
 * LEGACY: Supabase is only used for GHL webhook integration.
 * It is NOT part of the Core Engine runtime.
 * Core Engine uses PostgreSQL via LeadsRepository.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadRow = {
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  branch_id: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function pickString(rec: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function buildName(rec: Record<string, unknown>): string | null {
  const full =
    pickString(rec, ["name", "fullName", "full_name", "contactName"]) ??
    [pickString(rec, ["firstName", "first_name"]), pickString(rec, ["lastName", "last_name"])]
      .filter(Boolean)
      .join(" ")
      .trim();
  return full || null;
}

/** GHL suele mandar custom fields como objeto clave-valor o lista { id, value }. */
function extractBranchId(rec: Record<string, unknown>): string | null {
  const direct = pickString(rec, [
    "branch_id",
    "branchId",
    "sucursal_id",
    "sucursalId",
    "locationId",
    "location_id",
    "id_sucursal",
  ]);
  if (direct) return direct;

  const cf = rec.customField ?? rec.customFields ?? rec.custom_fields;
  const obj = asRecord(cf);
  if (obj) {
    const fromKeys = pickString(obj, [
      "branch_id",
      "branchId",
      "sucursal_id",
      "sucursalId",
      "id_sucursal",
    ]);
    if (fromKeys) return fromKeys;
  }

  if (Array.isArray(cf)) {
    for (const item of cf) {
      const row = asRecord(item);
      if (!row) continue;
      const id = String(row.id ?? row.key ?? "").toLowerCase();
      if (
        id.includes("sucursal") ||
        id.includes("branch") ||
        id === "location" ||
        id.includes("location")
      ) {
        const val = row.value ?? row.fieldValue;
        if (typeof val === "string" && val.trim()) return val.trim();
      }
    }
  }

  return null;
}

/**
 * Normaliza el POST de GoHighLevel (forma varía según workflow / inbound webhook).
 * Si en docs/brain/PRD_MASTER.md definís más campos, mapealos aquí.
 */
function extractLeadFromGhlPayload(body: unknown): LeadRow | null {
  const root = asRecord(body);
  if (!root) return null;

  const contact = asRecord(root.contact) ?? asRecord(root.Contact) ?? root;

  const name = buildName(contact);
  const email = pickString(contact, ["email", "Email", "emailAddress", "email_address"]);
  const phone = pickString(contact, [
    "phone",
    "Phone",
    "phoneNumber",
    "phone_number",
    "mobile",
    "Mobile",
  ]);
  const source = pickString(contact, [
    "source",
    "Source",
    "utm_source",
    "utmSource",
    "leadSource",
    "lead_source",
  ]);

  const branch_id = extractBranchId(contact) ?? extractBranchId(root);

  if (!email && !phone) return null;

  return {
    name,
    email,
    phone,
    source,
    branch_id,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const lead = extractLeadFromGhlPayload(body);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "missing_contact" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("leads").insert(lead);

    if (error) {
      console.error("[ghl webhook] supabase insert", error.message, error.code);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  } catch (e) {
    console.error("[ghl webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
