import { NextResponse } from "next/server";
import { sendPaymentConfirmationEmail } from "../../../../lib/email";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderID = typeof body.orderID === "string" ? body.orderID.trim() : "";
    const ticketNumber = typeof body.ticketNumber === "string" ? body.ticketNumber.trim() : "";

    if (!orderID || !ticketNumber) {
      return NextResponse.json(
        { error: "Missing PayPal capture details." },
        { status: 400 },
      );
    }

    if (!supabase) {
      return NextResponse.json({ error: "Booking payment service is not configured." }, { status: 500 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("ticket_number, customer_name, customer_email, service_name, deposit_amount, appointment_date, appointment_time, payment_method, payment_status")
      .eq("ticket_number", ticketNumber)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Ticket not found. Please verify your booking first." }, { status: 404 });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });
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

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("PayPal capture failed:", result);
      return NextResponse.json(
        { error: result.error_description ?? "PayPal payment could not be captured." },
        { status: 500 },
      );
    }

    const purchaseUnit = result.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.find(
      (paymentCapture: { status?: string }) => paymentCapture.status === "COMPLETED",
    );
    const capturedAmount = Number(capture?.amount?.value);
    const expectedAmount = Number(booking.deposit_amount);

    if (
      result.status !== "COMPLETED" ||
      purchaseUnit?.reference_id !== booking.ticket_number ||
      capture?.amount?.currency_code !== "USD" ||
      !Number.isFinite(capturedAmount) ||
      capturedAmount !== expectedAmount
    ) {
      return NextResponse.json(
        { error: "PayPal did not confirm the expected booking deposit." },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ payment_status: "paid" })
      .eq("ticket_number", booking.ticket_number)
      .eq("payment_status", "unpaid");

    if (updateError) {
      console.error("Booking payment update failed:", updateError);
      return NextResponse.json({ error: "Payment was captured, but we could not update the booking." }, { status: 500 });
    }

    let emailSent = true;
    try {
      await sendPaymentConfirmationEmail({
        name: booking.customer_name,
        email: booking.customer_email,
        ticketNumber: booking.ticket_number,
        service: booking.service_name,
        depositAmount: expectedAmount,
        date: booking.appointment_date,
        time: booking.appointment_time,
        paymentMethod: booking.payment_method,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Payment confirmation email failed:", emailError);
    }

    return NextResponse.json(
      {
        ok: true,
        orderId: orderID,
        ticketNumber,
        status: result.status,
        emailSent,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PayPal capture exception:", error);
    return NextResponse.json(
      { error: "Payment capture failed." },
      { status: 500 },
    );
  }
}
