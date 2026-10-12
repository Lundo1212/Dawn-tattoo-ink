"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type BookingRecord = {
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

type QuestionRecord = {
  id: number | string;
  customer_name?: string | null;
  customer_email: string;
  question_text: string;
  created_at?: string;
  source?: "local" | "database";
};

type GalleryItemRecord = {
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

const socialPlatforms = ["Instagram", "Facebook", "TikTok", "YouTube", "X", "WhatsApp"] as const;
type SocialPlatform = (typeof socialPlatforms)[number];
type SocialLinks = Record<SocialPlatform, string>;

const emptySocialLinks: SocialLinks = {
  Instagram: "",
  Facebook: "",
  TikTok: "",
  YouTube: "",
  X: "",
  WhatsApp: "",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [mediaItems, setMediaItems] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardWarnings, setDashboardWarnings] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [mediaForm, setMediaForm] = useState({
    title: "",
    category: "Fine Line",
    description: "",
    price: "150",
    duration: "1-2 hours",
    image_url: "",
    video_url: "",
    media_type: "image",
  });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [mediaSubmitting, setMediaSubmitting] = useState(false);
  const [editingMedia, setEditingMedia] = useState<GalleryItemRecord | null>(null);
  const [galleryFileInputKey, setGalleryFileInputKey] = useState(0);
  const [deletingMediaId, setDeletingMediaId] = useState<number | string | null>(null);
  const [replyingQuestionId, setReplyingQuestionId] = useState<number | string | null>(null);
  const [questionReply, setQuestionReply] = useState("");
  const [questionReplySending, setQuestionReplySending] = useState(false);
  const [questionReplyStatus, setQuestionReplyStatus] = useState<{
    id: number | string;
    message: string;
    isError: boolean;
  } | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(emptySocialLinks);
  const [socialLinksSaving, setSocialLinksSaving] = useState(false);
  const [socialLinksStatus, setSocialLinksStatus] = useState("");
  const [socialLinksError, setSocialLinksError] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("dawn-admin-token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    async function loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load dashboard.");
        }

        setBookings(result.bookings ?? []);
        setQuestions(result.questions ?? []);
        setMediaItems(result.media ?? []);
        setDashboardWarnings(result.warnings ?? []);

        const socialResponse = await fetch("/api/admin/social-links", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        const socialResult = await socialResponse.json();
        if (!socialResponse.ok) throw new Error(socialResult.error ?? "Unable to load social links.");
        setSocialLinks({ ...emptySocialLinks, ...(socialResult.links ?? {}) });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dashboard load failed.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [router]);

  async function updateBookingStatus(id: number, status: string) {
    const token = sessionStorage.getItem("dawn-admin-token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    setUpdatingId(id);

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: id, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update booking status.");
      }

      if (result.removed) {
        setBookings((current) => current.filter((booking) => booking.id !== id));
      } else {
        setBookings((current) =>
          current.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  booking_status: status,
                }
              : booking,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingBookings = bookings.filter(
    (booking) => booking.booking_status !== "attended",
  );

  async function handleMediaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("dawn-admin-token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    setMediaSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", mediaForm.title);
      formData.append("category", mediaForm.category);
      formData.append("description", mediaForm.description);
      formData.append("price", String(Number(mediaForm.price)));
      formData.append("duration", mediaForm.duration);
      formData.append("media_type", mediaForm.media_type);

      if (mediaForm.image_url) {
        formData.append("image_url", mediaForm.image_url);
      }

      if (mediaForm.video_url) {
        formData.append("video_url", mediaForm.video_url);
      }

      let uploadedMedia: { bucket: string; path: string } | null = null;
      if (galleryFile) {
        const uploadResponse = await fetch("/api/admin/media/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: galleryFile.name,
            contentType: galleryFile.type,
          }),
        });
        const uploadResult: {
          localFallback?: boolean;
          bucket?: string;
          path?: string;
          token?: string;
          error?: string;
        } = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error ?? "Unable to prepare the media upload.");
        }

        if (uploadResult.localFallback) {
          formData.append("file", galleryFile);
        } else {
          if (!uploadResult.bucket || !uploadResult.path || !uploadResult.token) {
            throw new Error("The media upload service returned an incomplete upload authorization.");
          }

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase public URL and publishable key are required for media uploads.");
          }

          const supabaseBrowser = createClient(supabaseUrl, supabaseKey);
          const { error: uploadError } = await supabaseBrowser.storage
            .from(uploadResult.bucket)
            .uploadToSignedUrl(uploadResult.path, uploadResult.token, galleryFile, {
              contentType: galleryFile.type,
            });
          if (uploadError) throw new Error(`Media upload failed: ${uploadError.message}`);

          uploadedMedia = { bucket: uploadResult.bucket, path: uploadResult.path };
          const publicUrl = supabaseBrowser.storage
            .from(uploadResult.bucket)
            .getPublicUrl(uploadResult.path).data.publicUrl;
          const isVideo = galleryFile.type.startsWith("video/");
          formData.set("media_type", isVideo ? "video" : "image");
          formData.set(isVideo ? "video_url" : "image_url", publicUrl);
          formData.set(isVideo ? "image_url" : "video_url", "");
        }
      }

      const method = editingMedia ? "PATCH" : "POST";
      if (editingMedia) {
        formData.append("id", String(editingMedia.id));
        formData.append("source", editingMedia.source ?? "local");
      }

      const response = await fetch("/api/admin/media", {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (uploadedMedia) {
          await fetch("/api/admin/media/upload", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ path: uploadedMedia.path }),
          });
        }
        throw new Error(result.error ?? "Unable to save the media item.");
      }

      setMediaItems((current) => editingMedia
        ? current.map((item) => String(item.id) === String(editingMedia.id) ? result.item : item)
        : [result.item, ...current]);
      resetMediaForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the media item.");
    } finally {
      setMediaSubmitting(false);
    }
  }

  function resetMediaForm() {
    setEditingMedia(null);
    setMediaForm({
      title: "",
      category: "Fine Line",
      description: "",
      price: "150",
      duration: "1-2 hours",
      image_url: "",
      video_url: "",
      media_type: "image",
    });
    setGalleryFile(null);
    setGalleryFileInputKey((current) => current + 1);
  }

  function startEditingMedia(item: GalleryItemRecord) {
    setEditingMedia(item);
    setMediaForm({
      title: item.title,
      category: item.category,
      description: item.description,
      price: String(item.price),
      duration: item.duration,
      image_url: item.image_url ?? "",
      video_url: item.video_url ?? "",
      media_type: item.media_type,
    });
    setGalleryFile(null);
    setGalleryFileInputKey((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteMedia(item: GalleryItemRecord) {
    if (!window.confirm(`Delete "${item.title}" from the gallery?`)) return;

    const token = sessionStorage.getItem("dawn-admin-token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setDeletingMediaId(item.id);
    setError("");
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: item.id, source: item.source ?? "local" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete media item.");

      setMediaItems((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      if (String(editingMedia?.id) === String(item.id)) resetMediaForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete media item.");
    } finally {
      setDeletingMediaId(null);
    }
  }

  async function sendQuestionReply(event: React.FormEvent<HTMLFormElement>, question: QuestionRecord) {
    event.preventDefault();
    const token = sessionStorage.getItem("dawn-admin-token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setQuestionReplySending(true);
    setQuestionReplyStatus(null);
    try {
      const response = await fetch("/api/admin/questions/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: question.customer_name ?? "",
          email: question.customer_email,
          question: question.question_text,
          response: questionReply,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to email your reply.");

      setQuestionReplyStatus({ id: question.id, message: result.message, isError: false });
      setQuestionReply("");
      setReplyingQuestionId(null);
    } catch (err) {
      setQuestionReplyStatus({
        id: question.id,
        message: err instanceof Error ? err.message : "Unable to email your reply.",
        isError: true,
      });
    } finally {
      setQuestionReplySending(false);
    }
  }

  async function saveDashboardSocialLinks(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("dawn-admin-token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setSocialLinksSaving(true);
    setSocialLinksStatus("");
    setSocialLinksError(false);
    try {
      const response = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ links: socialLinks }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save social links.");

      setSocialLinks({ ...emptySocialLinks, ...result.links });
      setSocialLinksStatus("Social media links saved.");
    } catch (err) {
      setSocialLinksError(true);
      setSocialLinksStatus(err instanceof Error ? err.message : "Unable to save social links.");
    } finally {
      setSocialLinksSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46a]">Studio admin</p>
            <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Booking dashboard</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("dawn-admin-token");
              router.push("/admin/login");
            }}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 transition hover:border-[#c9a46a] hover:text-[#c9a46a]"
          >
            Log out
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {dashboardWarnings.length > 0 && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"
          >
            <p className="font-semibold">Dashboard data may be incomplete.</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {dashboardWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-8 text-gray-300">
            Loading bookings and visitor questions...
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <section className="rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[#c9a46a]">Social media links</h2>
                  <p className="mt-2 text-sm text-gray-400">Saved links appear as clickable icons in the public footer.</p>
                </div>
                <form onSubmit={(event) => void saveDashboardSocialLinks(event)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {socialPlatforms.map((platform) => (
                      <label key={platform} className="block text-sm text-gray-300">
                        {platform}
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="url"
                            inputMode="url"
                            value={socialLinks[platform]}
                            onChange={(event) => setSocialLinks((current) => ({ ...current, [platform]: event.target.value }))}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 text-white outline-none focus:border-[#c9a46a]"
                          />
                          {socialLinks[platform] && (
                            <button
                              type="button"
                              aria-label={`Remove ${platform} link`}
                              title={`Remove ${platform} link`}
                              onClick={() => setSocialLinks((current) => ({ ...current, [platform]: "" }))}
                              className="h-10 w-10 shrink-0 rounded-full border border-white/15 text-lg text-gray-300 transition hover:border-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="submit"
                      disabled={socialLinksSaving}
                      className="rounded-full bg-[#c9a46a] px-5 py-3 font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {socialLinksSaving ? "Saving links..." : "Save social links"}
                    </button>
                    {socialLinksStatus && (
                      <p role="status" className={`text-sm ${socialLinksError ? "text-red-300" : "text-green-300"}`}>
                        {socialLinksStatus}
                      </p>
                    )}
                  </div>
                </form>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-[#c9a46a]">{editingMedia ? "Edit studio media" : "Add studio media"}</h2>
                </div>

                <form onSubmit={handleMediaSubmit} className="space-y-4 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      Title
                      <input
                        required
                        value={mediaForm.title}
                        onChange={(event) => setMediaForm((current) => ({ ...current, title: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                      />
                    </label>

                    <label className="block">
                      Category
                      <input
                        value={mediaForm.category}
                        onChange={(event) => setMediaForm((current) => ({ ...current, category: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                      />
                    </label>

                    <label className="block">
                      Price (USD)
                      <input
                        required
                        type="number"
                        min="0"
                        value={mediaForm.price}
                        onChange={(event) => setMediaForm((current) => ({ ...current, price: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                      />
                    </label>

                    <label className="block">
                      Duration
                      <input
                        value={mediaForm.duration}
                        onChange={(event) => setMediaForm((current) => ({ ...current, duration: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      Description
                      <textarea
                        required
                        rows={3}
                        value={mediaForm.description}
                        onChange={(event) => setMediaForm((current) => ({ ...current, description: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                      />
                    </label>

                    <label className="block">
                      Media type
                      <select
                        value={mediaForm.media_type}
                        onChange={(event) => setMediaForm((current) => ({ ...current, media_type: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </label>

                    <label className="block">
                      Upload media file
                      <input
                        key={galleryFileInputKey}
                        type="file"
                        accept="image/*,video/*"
                        onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)}
                        className="mt-2 block w-full rounded-xl border border-dashed border-white/10 bg-[#0b0b0b] px-3 py-3 text-sm text-gray-300 file:mr-3 file:rounded-full file:border-0 file:bg-[#c9a46a] file:px-3 file:py-2 file:font-bold file:text-black"
                      />
                    </label>

                    <label className="block">
                      Image URL (optional fallback)
                      <input
                        type="url"
                        value={mediaForm.image_url}
                        onChange={(event) => setMediaForm((current) => ({ ...current, image_url: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                        placeholder="https://..."
                      />
                    </label>

                    <label className="block md:col-span-2">
                      Video URL (optional fallback)
                      <input
                        type="url"
                        value={mediaForm.video_url}
                        onChange={(event) => setMediaForm((current) => ({ ...current, video_url: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-3 outline-none focus:border-[#c9a46a]"
                        placeholder="https://..."
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={mediaSubmitting}
                    className="rounded-full bg-[#c9a46a] px-5 py-3 font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#d6b57a]"
                  >
                    {mediaSubmitting ? "Saving media..." : editingMedia ? "Save changes" : "Save media item"}
                  </button>
                  {editingMedia && (
                    <button
                      type="button"
                      onClick={resetMediaForm}
                      disabled={mediaSubmitting}
                      className="ml-3 rounded-full border border-white/15 px-5 py-3 font-semibold text-gray-200 transition hover:border-white/40 disabled:opacity-50"
                    >
                      Cancel edit
                    </button>
                  )}
                </form>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-[#c9a46a]">Saved gallery items</h2>
                </div>

                {mediaItems.length === 0 ? (
                  <p className="text-sm text-gray-400">No gallery items saved yet.</p>
                ) : (
                  <div className="space-y-4">
                    {mediaItems.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
                        <div className="flex items-center gap-3">
                          {item.video_url ? (
                            <video src={item.video_url} className="h-16 w-16 rounded-lg object-cover" />
                          ) : item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                          ) : null}
                          <div>
                            <h3 className="font-bold">{item.title}</h3>
                            <p className="text-xs text-gray-400">{item.category}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-300">{item.description}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                          <span>Price: ${item.price}</span>
                          <span>Duration: {item.duration}</span>
                          <span>Type: {item.media_type}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingMedia(item)}
                            disabled={deletingMediaId !== null || mediaSubmitting}
                            className="rounded-full border border-[#c9a46a]/40 px-4 py-2 text-xs font-semibold text-[#e2c18d] transition hover:bg-[#c9a46a]/10 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteMedia(item)}
                            disabled={deletingMediaId !== null || mediaSubmitting}
                            className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingMediaId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-[#c9a46a]">Pending & active tickets</h2>
                  <span className="rounded-full border border-[#c9a46a]/30 bg-[#c9a46a]/10 px-3 py-1 text-xs text-[#f2d39a]">
                    {pendingBookings.length} pending
                  </span>
                </div>

              {bookings.length === 0 ? (
                <p className="text-sm text-gray-400">No bookings have been recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{booking.customer_name}</h3>
                          <p className="text-sm text-gray-400">{booking.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-[#c9a46a]">{booking.ticket_number}</p>
                          <p className="text-sm text-gray-300">{booking.booking_status}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                        <p><span className="text-gray-500">Service:</span> {booking.service_name}</p>
                        <p><span className="text-gray-500">Phone:</span> {booking.customer_phone}</p>
                        <p><span className="text-gray-500">Date:</span> {booking.appointment_date}</p>
                        <p><span className="text-gray-500">Time:</span> {booking.appointment_time}</p>
                        <p><span className="text-gray-500">Payment:</span> {booking.payment_status}</p>
                        <p><span className="text-gray-500">Status:</span> {booking.booking_status}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => updateBookingStatus(booking.id, "pending")}
                          disabled={updatingId === booking.id}
                          className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold hover:border-[#c9a46a] hover:text-[#c9a46a] disabled:cursor-not-allowed"
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          disabled={updatingId === booking.id}
                          className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold hover:border-[#c9a46a] hover:text-[#c9a46a] disabled:cursor-not-allowed"
                        >
                          Confirmed
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBookingStatus(booking.id, "attended")}
                          disabled={updatingId === booking.id}
                          className="rounded-full bg-[#c9a46a] px-3 py-2 text-xs font-bold text-black hover:bg-white disabled:cursor-not-allowed"
                        >
                          {updatingId === booking.id ? "Updating..." : "Mark attended"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </section>
            </div>

            <section className="rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[#c9a46a]">Visitor questions</h2>

              {questions.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">No visitor questions received yet.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
                      <p className="text-sm font-semibold text-white">
                        {question.customer_name ?? "Guest visitor"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">{question.customer_email}</p>
                      <p className="mt-3 text-sm leading-6 text-gray-300">{question.question_text}</p>
                      {replyingQuestionId === question.id ? (
                        <form onSubmit={(event) => void sendQuestionReply(event, question)} className="mt-4 space-y-3">
                          <label className="block text-sm text-gray-300">
                            Email reply to {question.customer_email}
                            <textarea
                              required
                              maxLength={5000}
                              rows={4}
                              value={questionReply}
                              onChange={(event) => setQuestionReply(event.target.value)}
                              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-white outline-none focus:border-[#c9a46a]"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              disabled={questionReplySending || !questionReply.trim()}
                              className="rounded-full bg-[#c9a46a] px-4 py-2 text-xs font-bold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {questionReplySending ? "Sending email..." : "Send email reply"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingQuestionId(null);
                                setQuestionReply("");
                              }}
                              disabled={questionReplySending}
                              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 hover:border-white/40"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingQuestionId(question.id);
                            setQuestionReply("");
                            setQuestionReplyStatus(null);
                          }}
                          className="mt-4 rounded-full border border-[#c9a46a]/40 px-4 py-2 text-xs font-semibold text-[#e2c18d] transition hover:bg-[#c9a46a]/10"
                        >
                          Reply by email
                        </button>
                      )}
                      {questionReplyStatus?.id === question.id && (
                        <p className={`mt-3 text-xs ${questionReplyStatus.isError ? "text-red-300" : "text-green-300"}`}>
                          {questionReplyStatus.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
