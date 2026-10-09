import { NextResponse } from "next/server";
import { sendVisitorQuestionResponseEmail } from "../../../../../lib/email";

const DEFAULT_ADMIN_SECRET = "dawn-admin-2026";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedToken = process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_SECRET;

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const response = typeof body.response === "string" ? body.response.trim() : "";

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !question ||
      !response ||
      response.length > 5000
    ) {
      return NextResponse.json(
        { error: "A valid recipient, original question, and reply under 5,000 characters are required." },
        { status: 400 },
      );
    }

    await sendVisitorQuestionResponseEmail({ name, email, question, response });
    return NextResponse.json({ ok: true, message: `Reply emailed to ${email}.` });
  } catch (error) {
    console.error("Visitor question reply failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send the email reply." },
      { status: 500 },
    );
  }
}