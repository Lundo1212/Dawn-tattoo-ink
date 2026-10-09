import { connection, NextResponse } from "next/server";
import { readSocialLinks } from "../../../lib/social-links";

export async function GET() {
  await connection();
  return NextResponse.json({ links: readSocialLinks() });
}