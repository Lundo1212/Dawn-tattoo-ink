import { NextResponse } from "next/server";
import { deleteLocalAnsweredQuestion } from "../../../../lib/local-questions";
import { supabase } from "../../../../lib/supabase";

const DEFAULT_ADMIN_SECRET = "dawn-admin-2026";

function isAuthorized(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  return Boolean(token && token === (process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_SECRET));
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const source = input.source;
  const id = input.id;
  if (
    (source !== "local" && source !== "database") ||
    (typeof id !== "string" && typeof id !== "number") ||
    !String(id).trim()
  ) {
    return NextResponse.json({ error: "A valid answered question is required." }, { status: 400 });
  }

  if (source === "local") {
    if (!deleteLocalAnsweredQuestion(String(id))) {
      return NextResponse.json(
        { error: "Only answered questions can be deleted." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Question storage is not configured." },
      { status: 503 },
    );
  }

  const questionId = typeof id === "number" ? id : Number(id);
  if (!Number.isSafeInteger(questionId) || questionId <= 0) {
    return NextResponse.json({ error: "A valid question ID is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("visitor_questions")
    .delete()
    .eq("id", questionId)
    .not("answered_at", "is", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Answered visitor question delete failed:", error.message);
    return NextResponse.json({ error: "Unable to delete the answered question." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Only answered questions can be deleted." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
