import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { deleteLocalAnsweredQuestion } from "../../../../lib/local-questions";
import { supabase } from "../../../../lib/supabase";

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) {
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
    if (process.env.VERCEL === "1") {
      return NextResponse.json(
        { error: "Local questions cannot be deleted on the live site." },
        { status: 503 },
      );
    }

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
