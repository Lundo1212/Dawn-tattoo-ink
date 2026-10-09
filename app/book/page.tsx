"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const services = [
  { name: "Fine Line Floral", price: 150 },
  { name: "Blackwork Art", price: 250 },
  { name: "Custom Ink", price: 350 },
  { name: "Traditional Tattoo", price: 200 },
] as const;

type PayPalWindow = Window & {
  paypal?: {
    Buttons: (options: Record<string, unknown>) => {
      render: (selector: string) => void;
    };
  };
};

function BookingForm() {
  const searchParams = useSearchParams();
  const requestedService = searchParams.get("service") ?? "";

  const [service, setService] = useState(
    services.some((item) => item.name === requestedService)
      ? requestedService
      : services[0].name,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [payment, setPayment] = useState("paypal");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [step, setStep] = useState<"booking" | "payment" | "paid">("booking");
  const [ticketNumber, setTicketNumber] = useState("");

  const selectedService =
    services.find((item) => item.name === service) ?? services[0];

  const deposit = selectedService.price * 0.3;
  const balance = selectedService.price - deposit;
  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID ?? "";

  function finalizeSuccessfulPayment(nextTicketNumber: string, emailSent: boolean) {
    setStep("paid");
    triggerTicketDownload(nextTicketNumber);
    setMessage(
      emailSent
        ? `Payment confirmed. Your ticket was issued and a confirmation email was sent. Ticket: ${nextTicketNumber}`
        : `Payment confirmed and your ticket was issued, but we could not send the confirmation email. Please contact the studio. Ticket: ${nextTicketNumber}`,
    );
  }

  useEffect(() => {
    if (step !== "payment" || payment !== "paypal" || !ticketNumber) {
      return;
    }

    if (!paypalClientId) {
      setMessage("PayPal has not been configured yet. Please add the PayPal client ID to continue.");
      return;
    }

    const existingScript = document.getElementById("paypal-sdk");

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = () => setPaypalReady(true);
      document.body.appendChild(script);
      return;
    }

    const paypalWindow = window as PayPalWindow;

    if (paypalWindow.paypal) {
      setPaypalReady(true);
    }
  }, [step, payment, ticketNumber, paypalClientId]);

  useEffect(() => {
    const paypalWindow = window as PayPalWindow;

    if (step !== "payment" || payment !== "paypal" || !ticketNumber || !paypalReady || !paypalWindow.paypal) {
      return;
    }

    const container = document.getElementById("paypal-button-container");
    if (!container) {
      return;
    }

    container.innerHTML = "";

    const paypalButtons = paypalWindow.paypal.Buttons({
      createOrder: async () => {
        const response = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketNumber,
            amount: deposit.toFixed(2),
            currency: "USD",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to start PayPal checkout.");
        }

        return result.orderId;
      },
      onApprove: async (data: { orderID: string }) => {
        const response = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID, ticketNumber }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "PayPal payment could not be captured.");
        }

        finalizeSuccessfulPayment(result.ticketNumber ?? ticketNumber, result.emailSent === true);
      },
      onError: () => {
        setMessage("PayPal checkout could not be completed. Please try again or use another payment method.");
      },
    });

    paypalButtons.render("#paypal-button-container");

    return () => {
      container.innerHTML = "";
    };
  }, [step, payment, paypalReady, ticketNumber, deposit]);

  function triggerTicketDownload(nextTicketNumber: string) {
    const brandName = "DAWN TATTOO INK";
    const customerName = name.trim();
    const customerEmail = email.trim();
    const customerPhone = phone.trim();
    const notesText = notes.trim() ? notes.trim() : "No additional notes provided.";

    const ticketHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${brandName} Ticket</title>
        <style>
          :root {
            --bg: #120d0b;
            --panel: #1a1614;
            --panel-alt: #221c19;
            --gold: #f7bf54;
            --gold-soft: #ffd57d;
            --text: #f8f4ef;
            --muted: #d1c7bc;
            --line: rgba(247, 191, 84, 0.35);
            --success: #2dd4bf;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: linear-gradient(135deg, #120d0b 0%, #1d120d 45%, #261b16 100%);
            color: var(--text);
            padding: 30px 16px;
          }
          .ticket {
            max-width: 760px;
            margin: 0 auto;
            border: 1px solid var(--line);
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(17,17,17,0.98), rgba(32,26,23,0.98));
            box-shadow: 0 30px 80px rgba(0,0,0,0.45);
            overflow: hidden;
          }
          .brand-bar {
            background: linear-gradient(90deg, var(--gold) 0%, #d49b2d 100%);
            color: #120d0b;
            padding: 18px 24px;
            text-align: center;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }
          .content { padding: 28px 28px 8px; }
          h1 {
            margin: 0 0 12px;
            color: var(--gold-soft);
            font-size: 32px;
            letter-spacing: 0.04em;
          }
          .subtitle {
            margin: 0 0 24px;
            color: var(--muted);
            font-size: 15px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 18px;
          }
          .row {
            background: var(--panel-alt);
            border: 1px solid rgba(247,191,84,.2);
            border-radius: 12px;
            padding: 14px 16px;
          }
          .row-label {
            display: block;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 7px;
          }
          .row-value {
            font-size: 18px;
            font-weight: 700;
            color: var(--text);
          }
          .notes {
            border-top: 1px solid rgba(247,191,84,.15);
            margin-top: 18px;
            padding-top: 18px;
          }
          .status {
            margin: 24px 0 12px;
            display: inline-block;
            background: rgba(45,212,191,0.12);
            border: 1px solid rgba(45,212,191,0.4);
            color: #8ef1de;
            border-radius: 999px;
            padding: 10px 18px;
            font-weight: 700;
            letter-spacing: 0.04em;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="brand-bar">${brandName}</div>
          <div class="content">
            <h1>Appointment Ticket</h1>
            <p class="subtitle">Your session has been confirmed and is awaiting your studio experience.</p>
            <div class="summary">
              <div class="row">
                <span class="row-label">Ticket Number</span>
                <span class="row-value">${nextTicketNumber}</span>
              </div>
              <div class="row">
                <span class="row-label">Service</span>
                <span class="row-value">${selectedService.name}</span>
              </div>
              <div class="row">
                <span class="row-label">Date</span>
                <span class="row-value">${date}</span>
              </div>
              <div class="row">
                <span class="row-label">Time</span>
                <span class="row-value">${time}</span>
              </div>
              <div class="row">
                <span class="row-label">Deposit</span>
                <span class="row-value">${deposit.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="row-label">Balance</span>
                <span class="row-value">${balance.toFixed(2)}</span>
              </div>
              <div class="row" style="grid-column: 1 / -1;">
                <span class="row-label">Client</span>
                <span class="row-value">${customerName}</span>
              </div>
              <div class="row" style="grid-column: 1 / -1;">
                <span class="row-label">Contact</span>
                <span class="row-value">${customerEmail} • ${customerPhone}</span>
              </div>
            </div>
            <div class="notes">
              <div class="row">
                <span class="row-label">Notes</span>
                <span class="row-value" style="font-size:15px; line-height:1.5;">${notesText}</span>
              </div>
            </div>
            <div class="status">Payment confirmed • Ticket issued</div>
          </div>
        </div>
      </body>
      </html>`;

    const blob = new Blob([ticketHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `dawn-tattoo-ink-ticket-${nextTicketNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedNotes = notes.trim();

    if (!date || !trimmedName || !trimmedEmail || !trimmedPhone) {
      setMessage("Please fill in all required booking details.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Saving your booking request...");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          service,
          date,
          time,
          payment,
          notes: trimmedNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save your booking request.");
      }

      setTicketNumber(result.ticketNumber ?? "");
      setStep("payment");
      setMessage(result.emailSent
        ? `${result.message} A payment reminder email was sent.`
        : result.message ?? "Your appointment was saved, but the payment reminder email could not be sent. Please contact the studio.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not save your booking request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-3 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="text-sm text-amber-400 transition hover:text-amber-300"
        >
          ← Back to home
        </a>

        <header className="mt-6 text-center sm:mt-8">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-400 sm:text-sm">
            Dawn Tattoo Ink
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
            Book Your Tattoo
          </h1>

          <p className="mt-4 text-sm text-gray-400 sm:text-base">
            Tell us what you have in mind. Let&apos;s create something meaningful.
          </p>
        </header>

        {step === "booking" && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-[#151515] p-4 shadow-2xl sm:mt-10 sm:space-y-6 sm:p-9"
          >
            <div>
              <label
                htmlFor="service"
                className="mb-2 block text-sm text-gray-300"
              >
                Choose your tattoo
              </label>

              <select
                id="service"
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 text-white outline-none focus:border-amber-400"
              >
                {services.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} — ${item.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label
                  htmlFor="customer-name"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Full name
                </label>

                <input
                  id="customer-name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-email"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Email address
                </label>

                <input
                  id="customer-email"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Phone number
                </label>

                <input
                  id="customer-phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Your phone number"
                  className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label
                  htmlFor="appointment-date"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Preferred date
                </label>

                <input
                  id="appointment-date"
                  required
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label
                  htmlFor="appointment-time"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Preferred time
                </label>

                <select
                  id="appointment-time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 outline-none focus:border-amber-400"
                >
                  {[
                    "10:00",
                    "11:00",
                    "12:00",
                    "13:00",
                    "14:00",
                    "15:00",
                    "16:00",
                  ].map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="payment-method"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Preferred payment method
                </label>

                <select
                  id="payment-method"
                  value={payment}
                  onChange={(event) => setPayment(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 outline-none focus:border-amber-400"
                >
                  <option value="paypal">PayPal or available card options</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="tattoo-notes"
                className="mb-2 block text-sm text-gray-300"
              >
                Tattoo ideas or additional notes
              </label>

              <textarea
                id="tattoo-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Describe your design, size, placement, or questions..."
                className="w-full rounded-lg border border-white/10 bg-[#0b0b0b] p-3 outline-none focus:border-amber-400"
              />
            </div>

            <section className="rounded-xl border border-amber-400/30 bg-black/40 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-amber-400">
                Booking Summary
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Selected service</span>
                  <span className="text-right">{selectedService.name}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Service price</span>
                  <span>${selectedService.price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4 text-amber-400">
                  <span>30% deposit</span>
                  <span>${deposit.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Remaining 70%</span>
                  <span>${balance.toFixed(2)}</span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Prices can vary from time to time. Amounts are displayed in USD.
              </p>
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-amber-400 px-6 py-3.5 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200 sm:py-4"
            >
              {isSubmitting ? "Saving Booking..." : "Request Appointment"}
            </button>
          </form>
        )}

        {step === "payment" && (
          <section className="mt-8 rounded-2xl border border-amber-400/30 bg-[#151515] p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-amber-400">Payment</h2>
            <p className="mt-3 text-sm text-gray-300">
              Your appointment has been created and saved. Please confirm your deposit to issue the appointment ticket.
            </p>

            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-[#0b0b0b] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Ticket number</span>
                <span className="font-semibold text-white">{ticketNumber}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Service</span>
                <span>{selectedService.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Deposit</span>
                <span>${deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Date & time</span>
                <span>{date} at {time}</span>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-300">
              PayPal displays eligible card payment options based on your region and account. Your ticket is issued after PayPal confirms payment.
            </p>
            <div id="paypal-button-container" className="mt-5 min-h-[58px]" />
          </section>
        )}

        {step === "paid" && (
          <section className="mt-8 rounded-2xl border border-emerald-400/30 bg-[#151515] p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-emerald-400">Payment Confirmed</h2>
            <p className="mt-3 text-sm text-gray-300">
              Your appointment is confirmed and your ticket file has been downloaded.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("booking");
                setMessage("");
                setTicketNumber("");
                setName("");
                setEmail("");
                setPhone("");
                setDate("");
                setTime("10:00");
                setPayment("paypal");
                setNotes("");
              }}
              className="mt-6 rounded-lg border border-white/10 px-5 py-3 font-semibold text-white transition hover:border-amber-400 hover:text-amber-400"
            >
              Book Another Appointment
            </button>
          </section>
        )}

        {message && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200"
          >
            {message}
          </p>
        )}

        {step !== "paid" && (
          <p className="mt-6 text-center text-xs leading-5 text-gray-500">
            Your booking request is sent for review and
            confirmation. Payment processing is still pending approval.
          </p>
        )}

        <footer className="mt-8 text-center text-xs text-gray-500 sm:text-sm">
          Dawn Tattoo Ink · 2717 Main Street, Dallas, TX 75226
        </footer>
      </div>
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0b0b] p-10 text-white">
          Loading booking form...
        </main>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
