import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

type MediaItem = {
  id: number | string;
  title?: string | null;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  price?: number | string | null;
  duration?: string | null;
  media_type?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  image?: string | null;
};

function readLocalGalleryItems() {
  try {
    const dataPath = path.join(process.cwd(), "data", "gallery-items.json");
    const raw = readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  let databaseItems: MediaItem[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id, title, category, description, price, duration, media_type, image_url, video_url")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gallery fetch failed:", error);
    } else {
      databaseItems = data ?? [];
    }
  }

  const localItems = readLocalGalleryItems();
  const seenMediaUrls = new Set<string>();
  const merged = [...databaseItems, ...localItems].filter((item) => {
    if (!item || !(item.image_url || item.video_url || item.image)) return false;
    const urls = [item.image_url, item.video_url, item.image].filter(
      (url): url is string => typeof url === "string" && Boolean(url),
    );
    if (urls.some((url) => seenMediaUrls.has(url))) return false;
    urls.forEach((url) => seenMediaUrls.add(url));
    return true;
  });

  return NextResponse.json({
    items: merged.map((item) => ({
      id: item.id,
      name: item.title ?? item.name,
      title: item.title ?? item.name,
      category: item.category ?? "Custom",
      description: item.description ?? "Art made around your story.",
      price: Number(item.price ?? 0),
      duration: item.duration ?? "Custom session",
      media_type: item.media_type ?? (item.video_url ? "video" : "image"),
      image_url: item.image_url ?? item.image ?? "",
      video_url: item.video_url ?? "",
      image: item.image_url ?? item.image ?? "",
    })),
  });
}
