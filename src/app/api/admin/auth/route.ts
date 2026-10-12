import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !password) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const a = Buffer.from(String(password));
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return Response.json({ ok: true });
    }
  } catch {}
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
