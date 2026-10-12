"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const services = [
  { name: "Fine Line Floral", price: 1500 },
  { name: "Blackwork Art", price: 800 },
  { name: "Custom Ink", price: 1500 },
] as const;

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
  const [payment, setPayment] = useState("card");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const selectedService =
    services.find((item) => item.name === service) ?? services[0];

  const deposit = selectedService.price * 0.3;
  const balance = selectedService.price - deposit;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date) {
      setMessage("Please select your preferred appointment date.");
      return;
    }

    setMessage(
      "Your request has been entered, but it has not been saved. Online payments and appointment confirmation are not active yet.",
    );
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
                <option value="card">Visa / Mastercard</option>
                <option value="paypal">PayPal</option>
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
              Prices can change from time to time. Amounts are displayed in USD.
            </p>
          </section>

          <button
            type="submit"
            className="w-full rounded-lg bg-amber-400 px-6 py-3.5 font-bold text-black transition hover:bg-amber-300 sm:py-4"
          >
            Request Appointment
          </button>

          {message && (
            <p
              role="status"
              className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200"
            >
              {message}
            </p>
          )}

          <p className="text-center text-xs leading-5 text-gray-500">
            This website was created by Davetech solutions
          </p>
        </form>

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
