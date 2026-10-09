import { NextResponse } from "next/server";
import { readSocialLinks, saveSocialLinks, validateSocialLinks } from "../../../../lib/social-links";

const DEFAULT_ADMIN_SECRET = "dawn-admin-2026";

function isAuthorized(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  return Boolean(token && token === (process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_SECRET));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ links: readSocialLinks() });
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const links = validateSocialLinks(body.links);
    if (!links) {
      return NextResponse.json(
        { error: "Enter valid HTTPS links for supported social platforms." },
        { status: 400 },
      );
    }

    saveSocialLinks(links);
    return NextResponse.json({ ok: true, links });
  } catch {
    return NextResponse.json({ error: "Unable to save social links." }, { status: 400 });
  }
}