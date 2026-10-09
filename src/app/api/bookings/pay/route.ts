import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Booking payment service is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const ticketNumber =
      typeof body.ticketNumber === "string" ? body.ticketNumber.trim() : "";

    if (!ticketNumber) {
      return NextResponse.json(
        { error: "Missing ticket number." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("id, ticket_number, customer_name, service_name, service_price, appointment_date, appointment_time, payment_method")
      .eq("ticket_number", ticketNumber)
      .single();

    if (error || !data) {
      console.error("Payment lookup failed:", error);
      return NextResponse.json(
        { error: "Ticket not found. Please verify your booking first." },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
      })
      .eq("id", data.id);

    if (updateError) {
      console.error("Payment update failed:", updateError);
      return NextResponse.json(
        { error: "We could not confirm your payment." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Payment confirmed and ticket issued.",
        ticketNumber: data.ticket_number,
        status: "paid",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Payment route failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid payment request. Please try again.",
      },
      { status: 400 },
    );
  }
}
