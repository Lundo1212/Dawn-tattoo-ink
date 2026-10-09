import { NextResponse } from "next/server";
import { sendBookingReminderEmail } from "../../../lib/email";
import { supabase } from "../../../lib/supabase";

const services = {
  "Fine Line Floral": 150,
  "Blackwork Art": 250,
  "Custom Ink": 350,
  "Traditional Tattoo": 200,
} as const;

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Booking service is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const service = typeof body.service === "string" ? body.service : "";
    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";
    const payment = typeof body.payment === "string" ? body.payment : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (
      !name ||
      name.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !phone ||
      phone.length > 40 ||
      !(service in services) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].includes(time) ||
      !["card", "paypal"].includes(payment) ||
      notes.length > 2000
    ) {
      return NextResponse.json(
        { error: "Please check your booking details and try again." },
        { status: 400 },
      );
    }

    const appointmentDate = new Date(`${date}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (
      Number.isNaN(appointmentDate.getTime()) ||
      appointmentDate.toISOString().slice(0, 10) !== date ||
      appointmentDate < today
    ) {
      return NextResponse.json(
        { error: "Please choose a valid future appointment date." },
        { status: 400 },
      );
    }

    const servicePrice = services[service as keyof typeof services];
    const depositAmount = Math.round(servicePrice * 30) / 100;
    const balanceAmount = servicePrice - depositAmount;
    const generatedTicketNumber = `DTI-${Date.now().toString().slice(-8)}`;

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        service_name: service,
        service_price: servicePrice,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        appointment_date: date,
        appointment_time: time,
        payment_method: payment,
        tattoo_notes: notes || null,
        ticket_number: generatedTicketNumber,
        booking_status: "pending",
        payment_status: "unpaid",
      })
      .select("id, ticket_number")
      .single();

    if (error) {
      console.error("Booking insert failed:", error.message);
      return NextResponse.json(
        { error: "We could not save your request. Please try again." },
        { status: 500 },
      );
    }

    let emailSent = true;
    try {
      await sendBookingReminderEmail({
        name,
        email,
        ticketNumber: data?.ticket_number ?? generatedTicketNumber,
        service,
        depositAmount: depositAmount,
        date,
        time,
        paymentMethod: payment,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Reminder email failed:", emailError);
    }

    return NextResponse.json(
      {
        message: emailSent
          ? "Your appointment request has been saved. Please complete payment to process your ticket."
          : "Your appointment request was saved, but we could not email your payment instructions. Please contact the studio.",
        emailSent,
        ticketNumber: data?.ticket_number ?? generatedTicketNumber,
        bookingId: data?.id ?? null,
        bookingStatus: "pending",
        paymentStatus: "unpaid",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Please try again." },
      { status: 400 },
    );
  }
}
