"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

type Booking = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  payment_status: string;
  booking_status: string;
  ticket_number: string;
  created_at?: string;
};

type VisitorQuestion = {
  id: number | string;
  customer_name?: string | null;
  customer_email: string;
  question_text: string;
  response?: string | null;
  answered_at?: string | null;
  created_at?: string;
  source?: "local" | "database";
};

type GalleryItem = {
  id: number | string;
  title: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  media_type: string;
  image_url?: string | null;
  video_url?: string | null;
  source?: "local" | "database";
};

const platforms = ["Instagram", "Facebook", "TikTok", "YouTube", "X", "WhatsApp"] as const;
type Platform = (typeof platforms)[number];
type SocialLinks = Record<Platform, string>;

const emptyLinks: SocialLinks = {
  Instagram: "",
  Facebook: "",
  TikTok: "",
  YouTube: "",
  X: "",
  WhatsApp: "",
};

const categories = [
  "Fine Line",
  "Blackwork",
  "Custom",
  "Traditional",
  "Realism",
  "Lettering",
  "Geometric",
  "Watercolor",
  "Other",
];

const blankMedia = {
  title: "",
  category: "Fine Line",
  description: "",
  price: "150",
  duration: "1-2 hours",
  image_url: "",
  video_url: "",
  media_type: "image",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 text-white outline-none focus:border-[#c9a46a]";
const cardClass = "rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6";
const buttonClass =
  "rounded-full bg-[#c9a46a] px-5 py-3 font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
}

function SocialIcon({ platform }: { platform: Platform }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (platform === "Instagram") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="5" {...common} /><circle cx="12" cy="12" r="4" {...common} /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></svg>;
  }
  if (platform === "Facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z" {...common} /></svg>;
  }
  if (platform === "TikTok") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M14 4v10.2a4 4 0 1 1-4-4" {...common} /><path d="M14 4c.4 2.4 2 4 4.5 4.5" {...common} /></svg>;
  }
  if (platform === "YouTube") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="4" {...common} /><path d="m10 9 5 3-5 3z" {...common} /></svg>;
  }
  if (platform === "X") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="m4 4 16 16M20 4 4 20" {...common} /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" {...common} /><path d="M9 9c.7 2 2 3.3 4 4l1-1 2 1c-.4 1.5-1.4 2-2.7 1.8-3-.7-5.1-2.8-5.8-5.8C7.3 7.7 7.8 6.7 9.3 6.3l1 2z" {...common} /></svg>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [questions, setQuestions] = useState<VisitorQuestion[]>([]);
  const [mediaItems, setMediaItems] = useState<GalleryItem[]>([]);
  const [links, setLinks] = useState<SocialLinks>(emptyLinks);
  const [media, setMedia] = useState({ ...blankMedia });
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [replyId, setReplyId] = useState<number | string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyNotice, setReplyNotice] = useState("");
  const [linkNotice, setLinkNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [actionId, setActionId] = useState<string | number | null>(null);

  const tokenOrRedirect = useCallback(() => {
    const token = sessionStorage.getItem("dawn-admin-token");
    if (!token) router.replace("/admin/login");
    return token;
  }, [router]);

  const adminFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = tokenOrRedirect();
      if (!token) throw new Error("Your admin session ended. Sign in again.");

      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch(url, { ...init, headers, cache: "no-store" });

      if (response.status === 401) {
        sessionStorage.removeItem("dawn-admin-token");
        router.replace("/admin/login");
        throw new Error("Your admin session is invalid or expired. Sign in again.");
      }

      return response;
    },
    [router, tokenOrRedirect],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const warningsFound: string[] = [];
    try {
      const response = await adminFetch("/api/admin/dashboard");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load dashboard data.");
      setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      setQuestions(Array.isArray(result.questions) ? result.questions : []);
      setMediaItems(Array.isArray(result.media) ? result.media : []);
      warningsFound.push(...(Array.isArray(result.warnings) ? result.warnings : []));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load dashboard data.");
    }

    try {
      const response = await adminFetch("/api/admin/social-links");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load social links.");
      setLinks({ ...emptyLinks, ...(result.links ?? {}) });
    } catch (cause) {
      warningsFound.push(cause instanceof Error ? cause.message : "Unable to load social links.");
    } finally {
      setWarnings(warningsFound);
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (!tokenOrRedirect()) return;
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard, tokenOrRedirect]);

  async function updateBooking(booking: Booking, status: string) {
    setActionId(booking.id);
    setError("");
    try {
      const response = await adminFetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update booking.");
      setBookings((current) =>
        result.removed
          ? current.filter((item) => item.id !== booking.id)
          : current.map((item) =>
              item.id === booking.id ? { ...item, booking_status: status } : item,
            ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update booking.");
    } finally {
      setActionId(null);
    }
  }

  function resetMedia() {
    setMedia({ ...blankMedia });
    setFile(null);
    setFileInputKey((current) => current + 1);
    setEditing(null);
  }

  function startEdit(item: GalleryItem) {
    setEditing(item);
    setMedia({
      title: item.title,
      category: item.category,
      description: item.description,
      price: String(item.price),
      duration: item.duration,
      image_url: item.image_url ?? "",
      video_url: item.video_url ?? "",
      media_type: item.media_type,
    });
    setFile(null);
    setFileInputKey((current) => current + 1);
    document.getElementById("gallery-editor")?.scrollIntoView({ behavior: "smooth" });
  }

  async function saveMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    let uploadedPath: string | null = null;

    try {
      const form = new FormData();
      form.set("title", media.title.trim());
      form.set("category", media.category);
      form.set("description", media.description.trim());
      form.set("price", String(Number(media.price)));
      form.set("duration", media.duration.trim());
      form.set("media_type", media.media_type);
      if (media.image_url) form.set("image_url", media.image_url);
      if (media.video_url) form.set("video_url", media.video_url);

      if (file) {
        const preflight = await adminFetch("/api/admin/media/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });
        const uploadInfo = await preflight.json();
        if (!preflight.ok) {
          throw new Error(uploadInfo.error ?? "Unable to prepare the file upload.");
        }

        if (uploadInfo.localFallback) {
          form.set("file", file);
        } else {
          const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
          if (!publicUrl || !publishableKey || !uploadInfo.bucket || !uploadInfo.path || !uploadInfo.token) {
            throw new Error("The gallery upload is not configured. Check the public Supabase settings.");
          }
          const browserClient = createClient(publicUrl, publishableKey);
          const { error: storageError } = await browserClient.storage
            .from(uploadInfo.bucket)
            .uploadToSignedUrl(uploadInfo.path, uploadInfo.token, file, {
              contentType: file.type,
            });
          if (storageError) throw new Error(`File upload failed: ${storageError.message}`);

          uploadedPath = uploadInfo.path;
          const url = browserClient.storage.from(uploadInfo.bucket).getPublicUrl(uploadInfo.path).data.publicUrl;
          const video = file.type.startsWith("video/");
          form.set("media_type", video ? "video" : "image");
          form.set(video ? "video_url" : "image_url", url);
          form.set(video ? "image_url" : "video_url", "");
        }
      }

      const method = editing ? "PATCH" : "POST";
      if (editing) {
        form.set("id", String(editing.id));
        form.set("source", editing.source ?? "local");
      }
      const response = await adminFetch("/api/admin/media", { method, body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save gallery item.");

      setMediaItems((current) =>
        editing
          ? current.map((item) => (String(item.id) === String(editing.id) ? result.item : item))
          : [result.item, ...current],
      );
      resetMedia();
      setNotice(editing ? "Gallery item updated." : "Gallery item added.");
    } catch (cause) {
      if (uploadedPath) {
        try {
          await adminFetch("/api/admin/media/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: uploadedPath }),
          });
        } catch (cleanupError) {
          console.error("Unable to clean up a failed gallery upload:", cleanupError);
        }
      }
      setError(cause instanceof Error ? cause.message : "Unable to save gallery item.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(item: GalleryItem) {
    if (!window.confirm(`Delete "${item.title}" from the gallery?`)) return;
    setActionId(item.id);
    setError("");
    try {
      const response = await adminFetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, source: item.source ?? "local" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete gallery item.");
      setMediaItems((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      if (String(editing?.id) === String(item.id)) resetMedia();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete gallery item.");
    } finally {
      setActionId(null);
    }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>, question: VisitorQuestion) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setReplyNotice("");
    try {
      const response = await adminFetch("/api/admin/questions/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: question.id,
          source: question.source ?? "database",
          name: question.customer_name ?? "",
          email: question.customer_email,
          question: question.question_text,
          response: replyText,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to send email reply.");
      setQuestions((current) =>
        current.map((item) =>
          item.id === question.id
            ? { ...item, response: replyText.trim(), answered_at: new Date().toISOString() }
            : item,
        ),
      );
      setReplyText("");
      setReplyId(null);
      setReplyNotice(result.message ?? "Reply sent by email.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send email reply.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuestion(question: VisitorQuestion) {
    if (!question.answered_at || !window.confirm("Delete this answered question? This cannot be undone.")) return;
    setActionId(question.id);
    setError("");
    try {
      const response = await adminFetch("/api/admin/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: question.id, source: question.source ?? "database" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete answered question.");
      setQuestions((current) => current.filter((item) => item.id !== question.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete answered question.");
    } finally {
      setActionId(null);
    }
  }

  async function saveSocialLinks(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setLinkNotice("");
    setError("");
    try {
      const response = await adminFetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save social links.");
      setLinks({ ...emptyLinks, ...result.links });
      setLinkNotice("Social links saved. They are now shown in the public footer.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save social links.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("dawn-admin-token");
    router.replace("/admin/login");
  }

  const unanswered = questions.filter((question) => !question.answered_at).length;
  const activeBookings = bookings.filter((booking) => booking.booking_status !== "attended").length;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46a]">Studio admin</p>
            <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-400">Manage bookings, visitor questions, gallery media, and social links.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-[#c9a46a] disabled:opacity-50">
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button type="button" onClick={logout} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-[#c9a46a]">
              Log out
            </button>
          </div>
        </header>

        <nav aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2">
          {[
            ["overview", "Overview"],
            ["bookings", `Bookings (${activeBookings})`],
            ["questions", `Questions (${unanswered})`],
            ["gallery", "Gallery"],
            ["social", "Social links"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-[#c9a46a] hover:text-[#c9a46a]">
              {label}
            </a>
          ))}
        </nav>

        {error && <div role="alert" className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {warnings.length > 0 && (
          <div role="status" className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p className="font-semibold">Some dashboard data could not be loaded.</p>
            <ul className="mt-2 list-inside list-disc space-y-1">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </div>
        )}
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">{notice}</p>}

        {loading ? (
          <div className={`${cardClass} text-gray-300`}>Loading admin data...</div>
        ) : (
          <div className="space-y-8">
            <section id="overview" className="grid gap-4 sm:grid-cols-3">
              {[
                ["Active bookings", activeBookings],
                ["Waiting for reply", unanswered],
                ["Gallery items", mediaItems.length],
              ].map(([label, count]) => (
                <div key={label} className={cardClass}>
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#c9a46a]">{count}</p>
                </div>
              ))}
            </section>

            <section id="bookings" className={cardClass}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#c9a46a]">Bookings and tickets</h2>
                  <p className="mt-1 text-sm text-gray-400">Appointment date and time are shown for each ticket.</p>
                </div>
              </div>
              {bookings.length === 0 ? <p className="text-sm text-gray-400">No bookings found.</p> : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <article key={booking.id} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row">
                        <div>
                          <h3 className="font-bold">{booking.customer_name}</h3>
                          <p className="text-sm text-gray-400">{booking.customer_email} · {booking.customer_phone}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-sm font-semibold text-[#c9a46a]">{booking.ticket_number}</p>
                          <p className="text-xs capitalize text-gray-400">{booking.booking_status}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-gray-300 sm:grid-cols-2 lg:grid-cols-3">
                        <p><span className="text-gray-500">Service:</span> {booking.service_name}</p>
                        <p><span className="text-gray-500">Appointment date:</span> {formatDate(booking.appointment_date)}</p>
                        <p><span className="text-gray-500">Appointment time:</span> {booking.appointment_time}</p>
                        <p><span className="text-gray-500">Payment:</span> <span className="capitalize">{booking.payment_status}</span></p>
                        <p><span className="text-gray-500">Booking status:</span> <span className="capitalize">{booking.booking_status}</span></p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["pending", "confirmed", "attended"].map((status) => (
                          <button key={status} type="button" onClick={() => void updateBooking(booking, status)} disabled={actionId === booking.id || booking.booking_status === status} className="rounded-full border border-white/15 px-3 py-2 text-xs capitalize transition hover:border-[#c9a46a] disabled:cursor-not-allowed disabled:opacity-40">
                            {actionId === booking.id ? "Updating..." : status === "attended" ? "Mark attended / archive" : `Mark ${status}`}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section id="questions" className={cardClass}>
              <h2 className="text-xl font-bold text-[#c9a46a]">Visitor questions</h2>
              <p className="mb-5 mt-1 text-sm text-gray-400">Only authenticated admins can view questions. Replies are emailed to the visitor.</p>
              {questions.length === 0 ? <p className="text-sm text-gray-400">No visitor questions received yet.</p> : (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <article key={`${question.source ?? "database"}-${question.id}`} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
                      <p className="font-semibold">{question.customer_name || "Visitor"}</p>
                      <p className="text-sm text-gray-400">{question.customer_email}{question.created_at ? ` · ${formatDate(question.created_at)}` : ""}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-200">{question.question_text}</p>
                      {question.answered_at ? (
                        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                          <p className="text-xs font-semibold uppercase text-emerald-300">Answered · {formatDate(question.answered_at)}</p>
                          {question.response && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{question.response}</p>}
                          <button type="button" onClick={() => void deleteQuestion(question)} disabled={actionId === question.id} className="mt-3 rounded-full border border-red-400/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                            {actionId === question.id ? "Deleting..." : "Delete answered question"}
                          </button>
                        </div>
                      ) : replyId === question.id ? (
                        <form onSubmit={(event) => void sendReply(event, question)} className="mt-4 space-y-3">
                          <label className="block text-sm text-gray-300">
                            Your email reply
                            <textarea required maxLength={5000} rows={4} value={replyText} onChange={(event) => setReplyText(event.target.value)} className={inputClass} />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button type="submit" disabled={busy || !replyText.trim()} className={buttonClass}>{busy ? "Sending email..." : "Send reply by email"}</button>
                            <button type="button" disabled={busy} onClick={() => { setReplyId(null); setReplyText(""); }} className="rounded-full border border-white/15 px-4 py-2 text-sm">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <button type="button" onClick={() => { setReplyId(question.id); setReplyText(""); setError(""); }} className="mt-4 rounded-full border border-[#c9a46a]/40 px-4 py-2 text-xs font-semibold text-[#e2c18d] hover:bg-[#c9a46a]/10">
                          Reply by email
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
              {replyNotice && <p role="status" className="mt-4 text-sm text-emerald-300">{replyNotice}</p>}
            </section>

            <section id="gallery" className={cardClass}>
              <h2 id="gallery-editor" className="text-xl font-bold text-[#c9a46a]">{editing ? "Edit gallery item" : "Add gallery item"}</h2>
              <form onSubmit={(event) => void saveMedia(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-gray-300">Title
                  <input required maxLength={160} value={media.title} onChange={(event) => setMedia((current) => ({ ...current, title: event.target.value }))} className={inputClass} />
                </label>
                <label className="text-sm text-gray-300">Category
                  <select value={media.category} onChange={(event) => setMedia((current) => ({ ...current, category: event.target.value }))} className={inputClass}>
                    {[...new Set([...categories, ...(editing ? [editing.category] : [])])].map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label className="text-sm text-gray-300">Price (USD)
                  <input required type="number" min="0" step="0.01" value={media.price} onChange={(event) => setMedia((current) => ({ ...current, price: event.target.value }))} className={inputClass} />
                </label>
                <label className="text-sm text-gray-300">Duration
                  <input value={media.duration} onChange={(event) => setMedia((current) => ({ ...current, duration: event.target.value }))} className={inputClass} />
                </label>
                <label className="text-sm text-gray-300 sm:col-span-2">Description
                  <textarea required rows={3} value={media.description} onChange={(event) => setMedia((current) => ({ ...current, description: event.target.value }))} className={inputClass} />
                </label>
                <label className="text-sm text-gray-300 sm:col-span-2">Upload image or video
                  <input key={fileInputKey} type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#c9a46a] file:px-4 file:py-2 file:font-semibold file:text-black`} />
                </label>
                <p className="text-xs text-gray-500 sm:col-span-2">Or enter an existing image or video URL:</p>
                <label className="text-sm text-gray-300">Image URL
                  <input type="url" value={media.image_url} onChange={(event) => setMedia((current) => ({ ...current, image_url: event.target.value }))} className={inputClass} placeholder="https://..." />
                </label>
                <label className="text-sm text-gray-300">Video URL
                  <input type="url" value={media.video_url} onChange={(event) => setMedia((current) => ({ ...current, video_url: event.target.value }))} className={inputClass} placeholder="https://..." />
                </label>
                <div className="flex flex-wrap gap-3 sm:col-span-2">
                  <button type="submit" disabled={busy} className={buttonClass}>{busy ? "Saving..." : editing ? "Save changes" : "Add to gallery"}</button>
                  {editing && <button type="button" disabled={busy} onClick={resetMedia} className="rounded-full border border-white/15 px-5 py-3 text-sm">Cancel edit</button>}
                </div>
              </form>
              {mediaItems.length === 0 ? <p className="mt-6 text-sm text-gray-400">No gallery items saved.</p> : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mediaItems.map((item) => (
                    <article key={`${item.source ?? "database"}-${item.id}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b]">
                      {item.video_url ? <video controls src={item.video_url} className="h-44 w-full bg-black object-cover" /> : item.image_url ? <div className="relative h-44 w-full bg-black"><Image unoptimized fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={item.image_url} alt={item.title} className="object-cover" /></div> : null}
                      <div className="p-4">
                        <h3 className="font-bold">{item.title}</h3>
                        <p className="mt-1 text-xs text-gray-400">{item.category} · ${item.price} · {item.duration}</p>
                        <p className="mt-3 line-clamp-3 text-sm text-gray-300">{item.description}</p>
                        <div className="mt-4 flex gap-2">
                          <button type="button" disabled={busy || actionId !== null} onClick={() => startEdit(item)} className="rounded-full border border-[#c9a46a]/40 px-3 py-2 text-xs text-[#e2c18d] disabled:opacity-50">Edit</button>
                          <button type="button" disabled={busy || actionId === item.id} onClick={() => void deleteMedia(item)} className="rounded-full border border-red-400/30 px-3 py-2 text-xs text-red-300 disabled:opacity-50">{actionId === item.id ? "Deleting..." : "Delete"}</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section id="social" className={cardClass}>
              <h2 className="text-xl font-bold text-[#c9a46a]">Social media links</h2>
              <p className="mt-1 text-sm text-gray-400">Saved URLs appear as clickable icons in the website footer. Clear a field to remove its icon.</p>
              <form onSubmit={(event) => void saveSocialLinks(event)} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {platforms.map((platform) => (
                    <label key={platform} className="text-sm text-gray-300">{platform}
                      <div className="flex items-center gap-2">
                        <input type="url" inputMode="url" value={links[platform]} onChange={(event) => setLinks((current) => ({ ...current, [platform]: event.target.value }))} className={inputClass} placeholder="https://..." />
                        {links[platform] && <button type="button" aria-label={`Remove ${platform}`} onClick={() => setLinks((current) => ({ ...current, [platform]: "" }))} className="mt-2 h-11 w-11 rounded-full border border-white/15 text-xl hover:border-red-400">×</button>}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button type="submit" disabled={busy} className={buttonClass}>{busy ? "Saving..." : "Save social links"}</button>
                  {linkNotice && <p role="status" className="text-sm text-emerald-300">{linkNotice}</p>}
                </div>
              </form>
              <nav aria-label="Social link preview" className="mt-5 flex gap-2">
                {platforms.filter((platform) => links[platform]).map((platform) => (
                  <a key={platform} href={links[platform]} target="_blank" rel="noopener noreferrer" aria-label={platform} title={platform} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-gray-300 hover:border-[#c9a46a] hover:text-[#c9a46a]">
                    <SocialIcon platform={platform} />
                  </a>
                ))}
              </nav>
            </section>
          </div>
        )}

        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-gray-500">
          Admin routes: <code>/api/admin/dashboard</code>, <code>/api/admin/bookings</code>, <code>/api/admin/questions</code>, <code>/api/admin/questions/respond</code>, <code>/api/admin/media</code>, <code>/api/admin/media/upload</code>, and <code>/api/admin/social-links</code>.
        </footer>
      </div>
    </main>
  );
}
