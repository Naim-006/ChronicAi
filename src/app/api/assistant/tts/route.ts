import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[*\-+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/>\s+/g, "")
    .replace(/[*_#~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTextIntoChunks(text: string, maxLen = 180): string[] {
  const parts: string[] = [];
  const sentences = text.match(/[^।?!.\n]+[।?!.\n]*/g) || [text];
  let cur = "";

  for (const s of sentences) {
    if ((cur + " " + s).trim().length <= maxLen) {
      cur = (cur + " " + s).trim();
    } else {
      if (cur) parts.push(cur);
      if (s.length > maxLen) {
        const words = s.split(/\s+/);
        let sub = "";
        for (const w of words) {
          if ((sub + " " + w).trim().length <= maxLen) {
            sub = (sub + " " + w).trim();
          } else {
            if (sub) parts.push(sub);
            sub = w;
          }
        }
        cur = sub ? sub.trim() : "";
      } else {
        cur = s.trim();
      }
    }
  }

  if (cur) parts.push(cur);
  return parts;
}

async function fetchGoogleTTSAudioChunk(chunk: string, lang: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
    lang
  )}&q=${encodeURIComponent(chunk)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Google TTS request failed with status: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawText = searchParams.get("text") || "";
    let lang = searchParams.get("lang") || "";

    const cleanText = cleanMarkdownForSpeech(rawText);
    if (!cleanText) {
      return new NextResponse("Text parameter is required", { status: 400 });
    }

    if (!lang) {
      lang = /[\u0980-\u09FF]/.test(cleanText) ? "bn" : "en";
    }

    const chunks = splitTextIntoChunks(cleanText, 180);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (chunk.trim()) {
        const buf = await fetchGoogleTTSAudioChunk(chunk.trim(), lang);
        audioBuffers.push(buf);
      }
    }

    const completeAudio = Buffer.concat(audioBuffers);

    return new NextResponse(completeAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": completeAudio.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    console.error("TTS API error:", err);
    return new NextResponse(err.message || "TTS generation failed", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = body.text || "";
    let lang = body.lang || "";

    const cleanText = cleanMarkdownForSpeech(rawText);
    if (!cleanText) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    if (!lang) {
      lang = /[\u0980-\u09FF]/.test(cleanText) ? "bn" : "en";
    }

    const chunks = splitTextIntoChunks(cleanText, 180);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (chunk.trim()) {
        const buf = await fetchGoogleTTSAudioChunk(chunk.trim(), lang);
        audioBuffers.push(buf);
      }
    }

    const completeAudio = Buffer.concat(audioBuffers);

    return new NextResponse(completeAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": completeAudio.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    console.error("TTS API error:", err);
    return NextResponse.json({ error: err.message || "TTS generation failed" }, { status: 500 });
  }
}
