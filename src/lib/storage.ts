import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const EXPIRY_SECONDS = 60 * 60; // 1 hour
const cache = new Map<string, { url: string; expiresAt: number }>();

/** Accepts either a bare object path or a full public/sign URL and returns the object path. */
export function toObjectPath(bucket: string, value: string): string {
  if (!value) return value;
  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const signMarker = `/storage/v1/object/sign/${bucket}/`;
  for (const marker of [publicMarker, signMarker]) {
    const idx = value.indexOf(marker);
    if (idx !== -1) return value.slice(idx + marker.length).split("?")[0];
  }
  return value.replace(/^\/+/, "");
}

export async function getSignedUrl(bucket: string, value: string): Promise<string | null> {
  if (!value) return null;
  const path = toObjectPath(bucket, value);
  const key = `${bucket}/${path}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, EXPIRY_SECONDS);
  if (error || !data?.signedUrl) return null;

  cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + (EXPIRY_SECONDS - 60) * 1000 });
  return data.signedUrl;
}

export async function getSignedUrls(bucket: string, values: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  await Promise.all(
    values.filter(Boolean).map(async (value) => {
      const url = await getSignedUrl(bucket, value);
      if (url) result[value] = url;
    })
  );
  return result;
}

/** Resolves a list of stored values into signed URLs keyed by the original value. */
export function useSignedUrls(bucket: string, values: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = values.filter(Boolean).join("|");

  useEffect(() => {
    let active = true;
    const list = key ? key.split("|") : [];
    if (list.length === 0) {
      setUrls({});
      return;
    }
    getSignedUrls(bucket, list).then((resolved) => {
      if (active) setUrls(resolved);
    });
    return () => {
      active = false;
    };
  }, [bucket, key]);

  return urls;
}
