import { NextResponse } from "next/server";

const DEFAULT_ADMIN_SECRET = "dawn-admin-2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    const expectedSecret = process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_SECRET;

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid admin secret. Please use the studio admin key." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      token: expectedSecret,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to validate admin access." },
      { status: 400 },
    );
  }
}
