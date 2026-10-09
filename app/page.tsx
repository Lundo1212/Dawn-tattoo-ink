
"use client";

import { useEffect, useState } from "react";

type SocialPlatform = "Instagram" | "Facebook" | "TikTok" | "YouTube" | "X" | "WhatsApp";
type SocialLink = { platform: SocialPlatform; url: string };

const socialPlatformNames: SocialPlatform[] = ["Instagram", "Facebook", "TikTok", "YouTube", "X", "WhatsApp"];

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (platform === "Instagram") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="5" {...common} /><circle cx="12" cy="12" r="4" {...common} /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></svg>;
  if (platform === "Facebook") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z" {...common} /></svg>;
  if (platform === "TikTok") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M14 4v10.2a4 4 0 1 1-4-4" {...common} /><path d="M14 4c.4 2.4 2 4 4.5 4.5" {...common} /></svg>;
  if (platform === "YouTube") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="4" {...common} /><path d="m10 9 5 3-5 3z" {...common} /></svg>;
  if (platform === "X") return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="m4 4 16 16M20 4 4 20" {...common} /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" {...common} /><path d="M9 9c.7 2 2 3.3 4 4l1-1 2 1c-.4 1.5-1.4 2-2.7 1.8-3-.7-5.1-2.8-5.8-5.8C7.3 7.7 7.8 6.7 9.3 6.3l1 2z" {...common} /></svg>;
}

const fallbackGalleryItems = [
  {
    id: 1,
    name: "Fine Line Floral",
    category: "Fine Line",
    price: 150,
    duration: "1–2 hours",
    media_type: "image",
    video_url: "",
    image_url:
      "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=900&q=85",
    description: "Delicate lines and elegant floral details, designed around you.",
  },
  {
    id: 2,
    name: "Blackwork Art",
    category: "Blackwork",
    price: 250,
    duration: "2–3 hours",
    media_type: "image",
    video_url: "",
    image_url:
      "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?auto=format&fit=crop&w=900&q=85",
    description: "Bold black ink with strong shapes and striking contrast.",
  },
  {
    id: 3,
    name: "Custom Ink",
    category: "Custom",
    price: 350,
    duration: "3–4 hours",
    media_type: "image",
    video_url: "",
    image_url:
      "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=900&q=85",
    description: "A personal design created around your ideas and story.",
  },
  {
    id: 4,
    name: "Traditional Tattoo",
    category: "Traditional",
    price: 200,
    duration: "2 hours",
    media_type: "image",
    video_url: "",
    image_url:
      "https://images.unsplash.com/photo-1590246814883-57c511e6b2f9?auto=format&fit=crop&w=900&q=85",
    description: "Timeless tattoo inspiration with a bold artistic finish.",
  },
];

const faqs = [
  {
    question: "How do I book a tattoo session?",
    answer:
      "Choose a design, select an available date and time, enter your details, and pay the required deposit.",
  },
  {
    question: "How much is the deposit?",
    answer:
      "The deposit is 30% of the listed service price. The remaining 70% is payable according to the studio's payment policy.",
  },
  {
    question: "Will I receive a booking ticket?",
    answer:
      "Yes. Once your deposit has been verified, the booking system will generate a unique reference and send your confirmation to your email.",
  },
  {
    question: "Can I request a custom design?",
    answer:
      "Absolutely. Contact the studio with your ideas and reference images so the artist can discuss your design.",
  },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export default function Home() {
  const [galleryItems, setGalleryItems] = useState(fallbackGalleryItems);
  const [category, setCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [questionStatus, setQuestionStatus] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questionStatusIsError, setQuestionStatusIsError] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    async function loadGallery() {
      try {
        const response = await fetch("/api/media");
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        const items = Array.isArray(result.items) ? result.items : [];

        if (items.length > 0) {
          setGalleryItems(
            items.map((item: any) => ({
              id: item.id,
              name: item.title || item.name,
              category: item.category || "Custom",
              price: Number(item.price || 0),
              duration: item.duration || "Custom session",
              image_url: item.image_url || item.image || "",
              video_url: item.video_url || "",
              media_type: item.media_type || (item.video_url ? "video" : "image"),
              description: item.description || "Art made around your story.",
            })),
          );
        }
      } catch {
        // Fall back to the built-in gallery if the database is not yet populated.
      }
    }

    void loadGallery();

    async function loadSocialLinks() {
      try {
        const response = await fetch("/api/social-links");
        if (!response.ok) return;
        const result = await response.json();
        const links = result.links as Partial<Record<SocialPlatform, string>>;
        setSocialLinks(socialPlatformNames.flatMap((platform) => {
          const url = links[platform];
          return url ? [{ platform, url }] : [];
        }));
      } catch {
        setSocialLinks([]);
      }
    }

    void loadSocialLinks();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(galleryItems.map((item) => item.category))),
  ];

  const visibleTattoos =
    category === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === category);

  return (
    <main className="min-h-screen bg-[#101010] text-white">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#101010]/95 backdrop-blur-xl">
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-5 lg:px-8">
          <a href="#" className="text-sm font-black tracking-[0.12em] sm:text-lg sm:tracking-[0.16em]">
            DAWN <span className="text-[#c9a46a]">TATTOO INK</span>
          </a>

          <div className="hidden items-center gap-5 text-xs text-gray-300 md:flex lg:gap-7 lg:text-sm">
            <a href="#gallery" className="hover:text-[#c9a46a]">Gallery</a>
            <a href="#studio" className="hover:text-[#c9a46a]">Our Studio</a>
            <a href="#booking" className="hover:text-[#c9a46a]">Booking</a>
            <a href="#location" className="hover:text-[#c9a46a]">Location</a>
            <a href="#faq" className="hover:text-[#c9a46a]">FAQs</a>
          </div>

          <a
            href="#gallery"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-full bg-[#c9a46a] px-3 py-2 text-[10px] font-bold text-black transition hover:bg-white sm:px-4 sm:text-xs lg:px-5 lg:text-sm"
          >
            <span className="sm:hidden">BOOK</span>
            <span className="hidden sm:inline">BOOK A SESSION</span>
          </a>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-[#c9a46a] hover:text-[#c9a46a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a46a] md:hidden"
          >
            {mobileMenuOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          {mobileMenuOpen && (
            <div
              id="mobile-navigation"
              className="absolute inset-x-4 top-full z-50 mt-2 rounded-xl border border-white/10 bg-[#101010] p-2 shadow-2xl md:hidden"
            >
              {[
                ["Gallery", "#gallery"],
                ["Our Studio", "#studio"],
                ["Booking", "#booking"],
                ["Location", "#location"],
                ["FAQs", "#faq"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block min-h-11 rounded-lg px-4 py-3 text-sm text-gray-200 transition hover:bg-white/5 hover:text-[#c9a46a] focus-visible:outline-2 focus-visible:outline-[#c9a46a]"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-20 sm:pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(12,12,12,.98) 0%, rgba(12,12,12,.83) 48%, rgba(12,12,12,.3) 100%), url('https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=2000&q=90')",
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-5 sm:py-24 lg:px-8">
          <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9a46a] sm:text-xs lg:text-sm">
            Dallas, Texas · Custom Tattoo Studio
          </p>

          <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-8xl">
            Your Skin.
            <br />
            <span className="text-[#c9a46a]">Your Story.</span>
            <br />
            Our Art.
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-6 text-gray-300 sm:mt-7 sm:text-base sm:leading-7">
            Discover original designs, explore our art, and turn your vision
            into something permanent at Dawn Tattoo Ink.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
            <a
              href="#gallery"
              className="rounded-full bg-[#c9a46a] px-5 py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-white sm:px-7 sm:py-4"
            >
              Explore Tattoos ↗
            </a>
            <a
              href="#studio"
              className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold uppercase tracking-wider transition hover:border-[#c9a46a] hover:text-[#c9a46a] sm:px-7 sm:py-4"
            >
              Discover Our Studio
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-6 border-t border-white/20 pt-7 sm:mt-16 sm:gap-10">
            <div>
              <p className="text-2xl font-black text-[#c9a46a]">01</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 sm:text-xs">
                Your vision
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#c9a46a]">02</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 sm:text-xs">
                Our expertise
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#c9a46a]">03</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 sm:text-xs">
                Your masterpiece
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="scroll-mt-24 px-4 py-16 sm:px-5 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:mb-12 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a46a] sm:text-xs">
                The collection
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase sm:text-5xl">
                Find Your <span className="text-[#c9a46a]">Ink.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Explore our featured styles and discover a design that feels
                like you.
              </p>
            </div>

            <p className="text-xs text-gray-500 sm:text-sm">
              Prices shown are illustrative starting prices.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-2 text-xs transition sm:px-5 sm:py-2.5 sm:text-sm ${
                  category === item
                    ? "border-[#c9a46a] bg-[#c9a46a] text-black"
                    : "border-white/15 text-gray-300 hover:border-[#c9a46a]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleTattoos.map((tattoo) => (
              <article
                key={tattoo.id ?? tattoo.name}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#181818] transition hover:-translate-y-1 hover:border-[#c9a46a]/60"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {tattoo.media_type === "video" || tattoo.video_url ? (
                    <video
                      src={tattoo.video_url || tattoo.image_url}
                      controls
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={tattoo.image_url || "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=900&q=85"}
                      alt={tattoo.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1.5 text-xs text-[#e2c18d] backdrop-blur">
                    {tattoo.category}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold">{tattoo.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-gray-400">
                    {tattoo.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Starting at</p>
                      <p className="text-xl font-black text-[#c9a46a]">
                        {money(Number(tattoo.price || 0))}
                      </p>
                    </div>
                    <span className="text-right text-xs text-gray-500">
                      {tattoo.duration}
                    </span>
                  </div>

                  <a
                    href={`/book?service=${encodeURIComponent(tattoo.name)}`}
                    className="mt-5 block rounded-full border border-[#c9a46a]/60 py-3 text-center text-sm font-bold transition hover:bg-[#c9a46a] hover:text-black"
                  >
                    Book This Tattoo ↗
                  </a>
                  <p className="mt-3 text-center text-xs text-gray-500">
                    30% deposit: {money(Number(tattoo.price || 0) * 0.3)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="scroll-mt-24 bg-[#191919] px-4 py-16 sm:px-5 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a46a] sm:text-xs">
              Beyond the needle
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl">
              More Than Ink.
              <br />
              <span className="text-[#c9a46a]">An Experience.</span>
            </h2>
            <p className="mt-6 text-sm leading-7 text-gray-400 sm:text-base">
              Welcome to Dawn Tattoo Ink, where individual expression meets
              thoughtful design. Explore the space, meet your artist, and
              collaborate on a piece made for you.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-400 sm:text-base">
              Have a reference image or a concept in mind? Bring your ideas.
              We can discuss your preferred style, placement, and design.
            </p>
            <a
              href="#booking"
              className="mt-8 inline-flex rounded-full bg-[#c9a46a] px-6 py-3 text-sm font-bold uppercase text-black transition hover:bg-white sm:px-7 sm:py-4"
            >
              Start Your Journey ↗
            </a>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1200&q=85"
                alt="Tattoo artwork"
                className="h-64 w-full object-cover sm:h-96"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#c9a46a] sm:text-xs">
                Studio film
              </p>
              <h3 className="mt-2 text-xl font-bold">Step Inside Our World</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                our studios.
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Videos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking callout */}
      <section id="booking" className="scroll-mt-24 px-4 py-16 sm:px-5 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#c9a46a]/30 bg-gradient-to-br from-[#252019] to-[#141414] px-5 py-10 text-center sm:px-12 sm:py-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a46a] sm:text-xs">
            Your next chapter starts here
          </p>
          <h2 className="mt-5 text-3xl font-black uppercase sm:text-6xl">
            Ready For Your <span className="text-[#c9a46a]">Next Tattoo?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base sm:leading-7">
            Choose your design, book a suitable session, and reserve your
            appointment with a 30% deposit.
          </p>
          <a
            href="#gallery"
            className="mt-8 inline-flex w-full justify-center rounded-full bg-[#c9a46a] px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-white sm:w-auto sm:px-8 sm:py-4"
          >
            Choose Your Tattoo ↗
          </a>
          <p className="mt-4 text-xs text-gray-500">
            Card and PayPal checkout will be activated after payment setup.
          </p>
        </div>
      </section>

      {/* Location */}
      <section id="location" className="scroll-mt-24 bg-[#191919] px-4 py-16 sm:px-5 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a46a] sm:text-xs">
            Find your way
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase sm:text-5xl">
            Visit Our <span className="text-[#c9a46a]">Studio.</span>
          </h2>

          <div className="mt-10 grid overflow-hidden rounded-2xl border border-white/10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col justify-center bg-[#111111] p-6 sm:p-10">
              <p className="text-[10px] uppercase tracking-widest text-[#c9a46a] sm:text-xs">
                Dawn Tattoo Ink
              </p>
              <h3 className="mt-4 text-2xl font-bold">Come Say Hello.</h3>
              <p className="mt-4 text-sm leading-7 text-gray-400 sm:text-base">
                2717 Main Street
                <br />
                Dallas, TX 75226
                <br />
                United States
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=2717+Main+Street%2C+Dallas%2C+TX+75226"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex w-fit rounded-full bg-[#c9a46a] px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
              >
                Get Directions ↗
              </a>
              <p className="mt-4 text-xs leading-5 text-gray-500">
                welcome all.
              </p>
            </div>

            <iframe
              title="Dawn Tattoo Ink studio map"
              src="https://maps.google.com/maps?q=2717%20Main%20Street%2C%20Dallas%2C%20TX%2075226&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="h-[290px] w-full border-0 sm:h-[430px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="scroll-mt-24 px-4 py-16 sm:px-5 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a46a] sm:text-xs">
              Need to know?
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase sm:text-5xl">
              Frequently Asked <span className="text-[#c9a46a]">Questions.</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-400 sm:text-base">
              Find answers about deposits, appointments, and custom tattoo
              designs.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-xl border border-white/10 bg-[#181818]"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold"
                  aria-expanded={openFaq === index}
                >
                  {faq.question}
                  <span className="text-xl text-[#c9a46a]">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                {openFaq === index && (
                  <p className="px-5 pb-5 text-sm leading-7 text-gray-400">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="bg-[#191919] px-4 py-16 sm:px-5 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a46a] sm:text-xs">
              Let's talk
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
              Have a <span className="text-[#c9a46a]">Question?</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-400 sm:text-base">
              Tell us about your idea, ask about a service, or start a
              conversation about your next tattoo.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsSubmittingQuestion(true);
              setQuestionStatus("");
              setQuestionStatusIsError(false);

              try {
                const response = await fetch("/api/questions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: "",
                    email,
                    question,
                  }),
                });

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error ?? "Unable to send your question.");
                }

                setQuestionStatus(result.message ?? "Your question has been sent to the studio.");
                setQuestion("");
                setEmail("");
              } catch (error) {
                setQuestionStatusIsError(true);
                setQuestionStatus(
                  error instanceof Error
                    ? error.message
                    : "We could not send your question right now.",
                );
              } finally {
                setIsSubmittingQuestion(false);
              }
            }}
          >
            <label className="block text-sm text-gray-300">
              Your email
              <input
                required
                type="email"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#101010] px-4 py-3 outline-none focus:border-[#c9a46a]"
              />
            </label>
            <label className="block text-sm text-gray-300">
              Your question
              <textarea
                required
                maxLength={5000}
                rows={4}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Tell us what you would like to know..."
                className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-[#101010] px-4 py-3 outline-none focus:border-[#c9a46a]"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmittingQuestion}
              className="w-full rounded-full bg-[#c9a46a] px-6 py-4 font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#d6b57a]"
            >
              {isSubmittingQuestion ? "Sending..." : "Send Your Question ↗"}
            </button>

            {questionStatus && (
              <p
                role="status"
                className={`rounded-xl border p-3 text-sm ${questionStatusIsError ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-[#c9a46a]/30 bg-[#c9a46a]/10 text-[#f2d39a]"}`}
              >
                {questionStatus}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0b0b0b] px-4 py-12 sm:px-5 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="#" className="text-lg font-black tracking-wider">
              DAWN <span className="text-[#c9a46a]">TATTOO INK</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
              Thoughtful designs. Personal expression. Art made to last.
            </p>
            {socialLinks.length > 0 && (
              <nav aria-label="Social media" className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map(({ platform, url }) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Dawn Tattoo Ink on ${platform}`}
                    title={platform}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-gray-300 transition hover:border-[#c9a46a] hover:text-[#c9a46a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a46a]"
                  >
                    <SocialIcon platform={platform} />
                  </a>
                ))}
              </nav>
            )}
          </div>

          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <a href="#gallery" className="hover:text-[#c9a46a]">Tattoo Gallery</a>
              <a href="#studio" className="hover:text-[#c9a46a]">Our Studio</a>
              <a href="#booking" className="hover:text-[#c9a46a]">Book a Session</a>
              <a href="#faq" className="hover:text-[#c9a46a]">FAQs</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Visit Us</h3>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              2717 Main Street
              <br />
              Dallas, TX 75226
              <br />
              United States
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=2717+Main+Street%2C+Dallas%2C+TX+75226"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-[#c9a46a]"
            >
              Get Directions ↗
            </a>
          </div>

          <div>
            <h3 className="font-bold">Studio Information</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
              <a href="#location" className="hover:text-[#c9a46a]">Location & Map</a>
              <a href="#faq" className="hover:text-[#c9a46a]">Booking FAQs</a>
              <a href="#faq" className="hover:text-[#c9a46a]">Deposit Information</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p>© {currentYear} Dawn Tattoo Ink. All rights reserved.</p>
          <p>Dallas, Texas · Art that tells your story.</p>
        </div>
      </footer>
    </main>
  );
}