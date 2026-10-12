import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../../lib/admin-auth";
import { sendVisitorQuestionResponseEmail } from "../../../../../lib/email";
import { supabase } from "../../../../../lib/supabase";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = typeof body.response === "string" ? body.response.trim() : "";
    const id = typeof body.id === "string" || typeof body.id === "number" ? String(body.id) : "";

    if (
      !id ||
      !response ||
      response.length > 5000
    ) {
      return NextResponse.json(
        { error: "A valid question and reply under 5,000 characters are required." },
        { status: 400 },
      );
    }

    const database = supabase;
    if (!database) {
      return NextResponse.json({ error: "Question storage is not configured." }, { status: 503 });
    }

    const questionId = Number(id);
    if (!Number.isSafeInteger(questionId) || questionId <= 0) {
      return NextResponse.json({ error: "A valid question ID is required." }, { status: 400 });
    }

    const { data, error } = await database
      .from("visitor_questions")
      .select("customer_name, customer_email, question_text, answered_at")
      .eq("id", questionId)
      .maybeSingle();
    if (error) {
      console.error("Visitor question lookup failed:", error.message);
      return NextResponse.json({ error: "Unable to verify this question." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    if (data.answered_at) {
      return NextResponse.json({ error: "This question has already been answered." }, { status: 409 });
    }

    const name = data.customer_name ?? "";
    const email = data.customer_email;
    const question = data.question_text;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !question) {
      return NextResponse.json({ error: "The question record has invalid recipient details." }, { status: 400 });
    }

    await sendVisitorQuestionResponseEmail({ name, email, question, response });

    const { data: updatedQuestion, error: updateError } = await database
      .from("visitor_questions")
      .update({ response, answered_at: new Date().toISOString() })
      .eq("id", questionId)
      .is("answered_at", null)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedQuestion) {
      console.error("Visitor question answer status update failed:", updateError?.message ?? "Question was already answered or not found.");
      return NextResponse.json(
        { error: "The reply email was sent, but the question could not be marked answered." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: `Reply emailed to ${email}.` });
  } catch (error) {
    console.error("Visitor question reply failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send the email reply." },
      { status: 500 },
    );
  }
}