import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ticketNumber =
      typeof body.ticketNumber === "string" ? body.ticketNumber.trim() : "";

    if (!ticketNumber || ticketNumber.length > 64) {
      return NextResponse.json(
        { error: "Enter a valid ticket number." },
        { status: 400 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Booking payment service is not configured." },
        { status: 503 },
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("ticket_number, deposit_amount, payment_status")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    if (bookingError) {
      console.error("PayPal booking lookup failed:", bookingError.message);
      return NextResponse.json(
        { error: "We could not verify this booking for payment." },
        { status: 500 },
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Ticket not found. Please check the number and try again." },
        { status: 404 },
      );
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json(
        { error: "This booking has already been paid." },
        { status: 409 },
      );
    }

    const amount = Number(booking.deposit_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      console.error("Invalid booking deposit amount:", booking.ticket_number);
      return NextResponse.json(
        { error: "This booking does not have a valid deposit amount." },
        { status: 500 },
      );
    }

    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl =
      process.env.PAYPAL_BASE_URL ||
      process.env.PAYPAL_API_BASE ||
      "https://api-m.sandbox.paypal.com";

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "PayPal credentials are not configured." },
        { status: 500 },
      );
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: booking.ticket_number,
            description: `Dawn Tattoo Ink booking deposit for ${booking.ticket_number}`,
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Dawn Tattoo Ink",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("PayPal create order failed:", result);
      return NextResponse.json(
        { error: result.error_description ?? "Unable to create PayPal order." },
        { status: 500 },
      );
    }

    return NextResponse.json({ orderId: result.id }, { status: 200 });
  } catch (error) {
    console.error("PayPal create order exception:", error);
    return NextResponse.json(
      { error: "Unable to start PayPal checkout." },
      { status: 500 },
    );
  }
}
