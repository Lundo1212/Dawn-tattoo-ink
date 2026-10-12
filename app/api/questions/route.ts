import { NextResponse } from "next/server";
import { saveLocalVisitorQuestion } from "../../../lib/local-questions";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !question ||
      question.length > 5000 ||
      name.length > 120
    ) {
      return NextResponse.json(
        { error: "Enter a valid email and a question under 5,000 characters." },
        { status: 400 },
      );
    }

    if (supabase) {
      const { error } = await supabase.from("visitor_questions").insert({
        customer_name: name || null,
        customer_email: email,
        question_text: question,
      });

      if (!error) {
        return NextResponse.json({
          ok: true,
          message: "Your question has been sent to the studio.",
        }, { status: 201 });
      }

      console.error("Visitor question insert failed:", error.message);
      if (process.env.VERCEL === "1") {
        return NextResponse.json(
          { error: "We could not save your question right now. Please try again later." },
          { status: 503 },
        );
      }
    } else if (process.env.VERCEL === "1") {
      console.error("Visitor question could not be saved because Supabase is not configured.");
      return NextResponse.json(
        { error: "Question storage is unavailable. Please try again later." },
        { status: 503 },
      );
    }

    saveLocalVisitorQuestion({
      customer_name: name || null,
      customer_email: email,
      question_text: question,
    });

    return NextResponse.json({
      ok: true,
      message: "Thanks for your question we shall respond to you shortly via an email.",
    }, { status: 201 });
  } catch (error) {
    console.error("Visitor question submission failed:", error);
    return NextResponse.json(
      { error: "We could not save your question right now. Please try again later." },
      { status: 500 },
    );
  }
}
