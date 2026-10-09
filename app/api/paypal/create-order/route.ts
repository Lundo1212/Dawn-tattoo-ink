import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { ticketNumber, amount, currency = "USD" } = await request.json();

    if (!ticketNumber || typeof amount !== "string" || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid PayPal order details." },
        { status: 400 },
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
            reference_id: ticketNumber,
            description: `Dawn Tattoo Ink booking deposit for ${ticketNumber}`,
            amount: {
              currency_code: currency,
              value: Number(amount).toFixed(2),
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
