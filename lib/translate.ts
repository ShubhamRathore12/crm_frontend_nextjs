// Free, key-less translation helpers (client-side).
// Primary: Google's public "gtx" endpoint (auto language detect, CORS-enabled).
// Fallback: MyMemory free API. Both have generous anonymous quotas — fine for a
// demo / light agent usage.

async function viaGoogle(text: string, target: string): Promise<string | null> {
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=` +
      encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    // Shape: [[["translated","original",...], ...], ...]
    const segments = json?.[0];
    if (!Array.isArray(segments)) return null;
    return segments.map((s: any[]) => s?.[0] ?? "").join("");
  } catch {
    return null;
  }
}

async function viaMyMemory(text: string, target: string): Promise<string | null> {
  try {
    const url =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=` +
      encodeURIComponent(`autodetect|${target}`);
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.responseData?.translatedText ?? null;
  } catch {
    return null;
  }
}

/** Translate a single string. Returns original text if every provider fails. */
export async function translateText(text: string, target = "en"): Promise<string> {
  if (!text.trim()) return text;
  const out = (await viaGoogle(text, target)) ?? (await viaMyMemory(text, target));
  return out ?? text;
}

/** Translate many strings in parallel. */
export async function translateMany(texts: string[], target = "en"): Promise<string[]> {
  return Promise.all(texts.map((t) => translateText(t, target)));
}
