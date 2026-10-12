import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { readLocalVisitorQuestions } from "../../../../lib/local-questions";
import { supabase } from "../../../../lib/supabase";

const DEFAULT_ADMIN_SECRET = "dawn-admin-2026";

function readLocalGalleryItems() {
  try {
    const dataPath = path.join(process.cwd(), "data", "gallery-items.json");
    const items = JSON.parse(readFileSync(dataPath, "utf8"));
    return Array.isArray(items) ? items.map((item) => ({ ...item, source: "local" })) : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedToken = process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_SECRET;

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    console.error("Admin dashboard Supabase client is unavailable", {
      urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      serverKeyConfigured: Boolean(
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
      ),
      publishableKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    });
    return NextResponse.json({
      bookings: [],
      questions: process.env.VERCEL === "1" ? [] : readLocalVisitorQuestions(),
      media: readLocalGalleryItems(),
      warnings: [
        "Supabase is not configured. Booking data cannot sync until database credentials are added.",
      ],
    });
  }

  const [{ data: bookings, error: bookingError }, { data: questions, error: questionError }, { data: media, error: mediaError }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, customer_name, customer_email, customer_phone, service_name, appointment_date, appointment_time, payment_status, booking_status, ticket_number, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("visitor_questions")
        .select("id, customer_name, customer_email, question_text, response, answered_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("gallery_items")
        .select("id, title, category, description, price, duration, media_type, image_url, video_url, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (bookingError) {
    console.error("Admin booking fetch failed:", bookingError);
  }

  if (questionError) {
    console.error("Admin visitor questions fetch failed:", questionError);
  }

  if (mediaError) {
    console.error("Admin media fetch failed:", mediaError);
  }

  const warnings = [
    bookingError && "Bookings could not be loaded from the database.",
    questionError && "Some visitor questions could not be loaded from the database.",
    mediaError && "Some gallery items could not be loaded from the database.",
  ].filter((warning): warning is string => Boolean(warning));

  const databaseMedia = (media ?? []).map((item) => ({ ...item, source: "database" }));
  const databaseQuestions = (questions ?? []).map((item) => ({ ...item, source: "database" }));
  const databaseMediaUrls = new Set(
    databaseMedia.flatMap((item) => [item.image_url, item.video_url].filter(Boolean)),
  );
  const localMedia = readLocalGalleryItems().filter(
    (item) => ![item.image_url, item.video_url].some((url) => url && databaseMediaUrls.has(url)),
  );

  return NextResponse.json({
    bookings: bookings ?? [],
    questions: [
      ...databaseQuestions,
      ...(process.env.VERCEL === "1" ? [] : readLocalVisitorQuestions()),
    ],
    media: [...databaseMedia, ...localMedia],
    warnings,
  });
}
