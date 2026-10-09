import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

const DEFAULT_ADMIN_SECRET = "dawn-admin-2026";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedToken = process.env.ADMIN_ACCESS_KEY || DEFAULT_ADMIN_SECRET;

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Booking update service is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const bookingId = Number(body.bookingId);
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });
    }

    if (!["pending", "confirmed", "attended"].includes(status)) {
      return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
    }

    if (status === "attended") {
      const { data, error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId)
        .select("id")
        .single();

      if (error || !data) {
        console.error("Attended booking removal failed:", error);
        return NextResponse.json(
          { error: "Unable to remove this attended ticket from active bookings." },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, removed: true, booking: data });
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({ booking_status: status })
      .eq("id", bookingId)
      .select("id, booking_status")
      .single();

    if (error || !data) {
      console.error("Booking status update failed:", error);
      return NextResponse.json(
        { error: "Unable to update booking status." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      booking: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid update request." },
      { status: 400 },
    );
  }
}
