"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Booking = {
  ticketNumber: string;
  serviceName: string;
  servicePrice: number;
  depositAmount: number;
  balanceAmount: number;
  appointmentDate: string;
  appointmentTime: string;
  bookingStatus: string;
  paymentStatus: string;
};

type PayPalWindow = Window & {
  paypal?: {
    Buttons: (options: Record<string, unknown>) => {
      render: (selector: string) => void;
    };
  };
};

function TrackBooking() {
  const searchParams = useSearchParams();
  const urlTicketNumber = searchParams.get("ticketNumber")?.trim() ?? "";
  const [ticketNumber, setTicketNumber] = useState(urlTicketNumber);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [message, setMessage] = useState("");
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainer = useRef<HTMLDivElement>(null);
  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID ?? "";

  const lookupBooking = useCallback(async (number: string) => {
    const normalizedNumber = number.trim();
    if (!normalizedNumber) {
      setBooking(null);
      setMessage("Enter your ticket number to view your booking.");
      return;
    }

    setIsLookingUp(true);
    setBooking(null);
    setMessage("");
    try {
      const response = await fetch(
        `/api/bookings?ticketNumber=${encodeURIComponent(normalizedNumber)}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to look up this ticket.");
      }
      setBooking(result.booking as Booking);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to look up this ticket.",
      );
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  useEffect(() => {
    if (!booking || booking.paymentStatus === "paid") return;
    if (!paypalClientId) return;

    const paypalWindow = window as PayPalWindow;
    if (paypalWindow.paypal) return;

    const existingScript = document.getElementById("paypal-sdk") as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");
    const handleLoad = () => setPaypalReady(true);
    const handleError = () => setMessage("PayPal could not be loaded. Please try again later.");

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (!existingScript) {
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [booking, paypalClientId]);

  useEffect(() => {
    const paypalWindow = window as PayPalWindow;
    const container = paypalContainer.current;
    if (
      !booking ||
      booking.paymentStatus === "paid" ||
      (!paypalReady && !paypalWindow.paypal) ||
      !paypalWindow.paypal ||
      !container
    ) {
      return;
    }

    container.innerHTML = "";
    const buttons = paypalWindow.paypal.Buttons({
      createOrder: async () => {
        const response = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketNumber: booking.ticketNumber }),
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
          body: JSON.stringify({
            orderID: data.orderID,
            ticketNumber: booking.ticketNumber,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "PayPal payment could not be captured.");
        }

        setBooking((current) =>
          current ? { ...current, paymentStatus: "paid" } : current,
        );
        setMessage(
          result.emailSent
            ? "Payment confirmed. A confirmation email has been sent."
            : "Payment confirmed, but the confirmation email could not be sent. Please contact the studio.",
        );
      },
      onError: () => {
        setMessage("PayPal checkout could not be completed. Please try again.");
      },
    });

    buttons.render("#paypal-track-button-container");
    return () => {
      container.innerHTML = "";
    };
  }, [booking, paypalReady]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void lookupBooking(ticketNumber);
  }

  const bookingStatusLabel: Record<string, string> = {
    pending: "Awaiting studio confirmation",
    confirmed: "Confirmed",
    attended: "Completed",
  };

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-3 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-amber-400 transition hover:text-amber-300">
          ← Back to home
        </Link>

        <header className="mt-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-400 sm:text-sm">
            Dawn Tattoo Ink
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
            Track Your Booking
          </h1>
          <p className="mt-4 text-sm text-gray-400 sm:text-base">
            Enter the ticket number from your email to check your booking or pay an outstanding deposit.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#151515] p-4 shadow-2xl sm:flex-row sm:p-6"
        >
          <label htmlFor="ticket-number" className="sr-only">
            Ticket number
          </label>
          <input
            id="ticket-number"
            autoComplete="off"
            required
            maxLength={64}
            value={ticketNumber}
            onChange={(event) => setTicketNumber(event.target.value)}
            placeholder="e.g. DTI-12345678"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b0b0b] p-3 text-white outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={isLookingUp}
            className="rounded-lg bg-amber-400 px-6 py-3 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLookingUp ? "Looking up..." : "Track Ticket"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200"
          >
            {message}
          </p>
        )}

        {booking && (
          <section className="mt-6 rounded-2xl border border-amber-400/30 bg-[#151515] p-5 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-amber-400">Booking Details</h2>
                <p className="mt-1 text-sm text-gray-400">{booking.ticketNumber}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold capitalize text-gray-200">
                {bookingStatusLabel[booking.bookingStatus] ?? booking.bookingStatus}
              </span>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#0b0b0b] p-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Service</dt>
                <dd className="mt-1 font-semibold">{booking.serviceName}</dd>
              </div>
              <div className="rounded-lg bg-[#0b0b0b] p-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Appointment</dt>
                <dd className="mt-1 font-semibold">
                  {booking.appointmentDate} at {booking.appointmentTime.slice(0, 5)}
                </dd>
              </div>
              <div className="rounded-lg bg-[#0b0b0b] p-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Payment status</dt>
                <dd className={`mt-1 font-semibold ${booking.paymentStatus === "paid" ? "text-emerald-300" : "text-amber-300"}`}>
                  {booking.paymentStatus === "paid" ? "Deposit paid" : "Deposit due"}
                </dd>
              </div>
              <div className="rounded-lg bg-[#0b0b0b] p-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Total service price</dt>
                <dd className="mt-1 font-semibold">${booking.servicePrice.toFixed(2)} USD</dd>
              </div>
              <div className="rounded-lg bg-[#0b0b0b] p-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Deposit</dt>
                <dd className="mt-1 font-semibold">${booking.depositAmount.toFixed(2)} USD</dd>
              </div>
              <div className="rounded-lg bg-[#0b0b0b] p-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Remaining balance</dt>
                <dd className="mt-1 font-semibold">${booking.balanceAmount.toFixed(2)} USD</dd>
              </div>
            </dl>

            {booking.paymentStatus !== "paid" && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="font-semibold">Complete your deposit payment</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Pay the ${booking.depositAmount.toFixed(2)} USD deposit to continue your booking.
                </p>
                {paypalClientId ? (
                  <div
                    id="paypal-track-button-container"
                    ref={paypalContainer}
                    className="mt-4 min-h-[48px]"
                  />
                ) : (
                  <p className="mt-4 text-sm text-amber-200">
                    Online payment is not available right now. Please contact the studio.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-gray-500 sm:text-sm">
          Dawn Tattoo Ink · 2717 Main Street, Dallas, TX 75226
        </footer>
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0b0b] p-10 text-white">
          Loading booking tracker...
        </main>
      }
    >
      <TrackBooking />
    </Suspense>
  );
}
