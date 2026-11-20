import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

// Clean and phoneticize text for natural human speech synthesis
function cleanTextForTTS(raw: string, isBengali: boolean): string {
  let cleaned = raw
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/###?\s+/g, "") // remove headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/[📊💡🩺📋⚠️•\-*#|]/g, " ") // icons, pipes, and bullet marks
    .replace(/\r\n|\n|\r/g, " "); // flatten newlines

  if (isBengali) {
    cleaned = cleaned
      // Strip parenthetical English translations in Bengali text so it doesn't stumble
      .replace(/\([A-Za-z\s,/+-]+\)/g, "")
      // Convert reference ranges to natural Bengali words
      .replace(/\((?:Ref|Reference|রেফারেন্স|স্বাভাবিক|নরমাল)[\s:]*([^)]+)\)/gi, ", স্বাভাবিক মাত্রা $1, ")
      // Convert status indicators into natural Bengali expressions
      .replace(/Status:\s*Normal/gi, "যা স্বাভাবিক")
      .replace(/Status:\s*Abnormal/gi, "যা অস্বাভাবিক")
      .replace(/Status:\s*Mildly Low/gi, "যা কিছুটা কম")
      .replace(/Status:\s*Elevated/gi, "যা বেশি")
      // Expand common clinical units into natural Bengali phonetics
      .replace(/mg\/dL/gi, " মিলিগ্রাম পার ডেসিলিটার ")
      .replace(/K\/µL/gi, " হাজার পার মাইক্রোলিটার ")
      .replace(/million\/µ[lL]/gi, " মিলিয়ন পার মাইক্রোলিটার ")
      .replace(/fL/gi, " ফেমটোলিটার ")
      .replace(/g\/dL/gi, " গ্রাম পার ডেসিলিটার ")
      .replace(/mmol\/L/gi, " মিলিমোল পার লিটার ")
      .replace(/HbA1c/gi, "হিমোগ্লোবিন এ ওয়ান সি")
      .replace(/eGFR/gi, "ই জি এফ আর")
      .replace(/CBC/gi, "সি বি সি")
      .replace(/BP/gi, "ব্লাড প্রেসার")
      .replace(/%/g, " শতাংশ ");
  } else {
    cleaned = cleaned
      .replace(/\((?:Ref|Reference)[\s:]*([^)]+)\)/gi, ", reference range $1, ")
      .replace(/mg\/dL/gi, " milligrams per deciliter ")
      .replace(/K\/µL/gi, " thousand per microliter ")
      .replace(/million\/µ[lL]/gi, " million per microliter ")
      .replace(/fL/gi, " femtoliters ")
      .replace(/g\/dL/gi, " grams per deciliter ")
      .replace(/mmol\/L/gi, " millimoles per liter ")
      .replace(/HbA1c/gi, "Hemoglobin A 1 C")
      .replace(/eGFR/gi, "E G F R")
      .replace(/CBC/gi, "C B C")
      .replace(/%/g, " percent ");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

// 1. Google Gemini Native Expressive TTS (warm, emotional, human doctor tone)
async function generateGeminiNativeTTS(
  text: string,
  isBengali: boolean,
  apiKey: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const prompt = isBengali
      ? `Read aloud with a warm, caring, expressive human doctor voice and natural conversational tone in fluent Bengali. Speak naturally and empathetically, pausing gently at commas and full stops:\n\n${text}`
      : `Read aloud in a warm, empathetic, caring human doctor voice with authentic emotional inflection and clear conversational pacing:\n\n${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore", // Empathetic, warm, soothing human clinical voice
              },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(9000),
    });

    if (res.ok) {
      const data = await res.json();
      const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";
      if (base64Data) {
        return { buffer: Buffer.from(base64Data, "base64"), contentType: mimeType };
      }
    }
  } catch (err) {
    console.warn("Gemini native TTS error, falling back to Azure Edge:", err);
  }
  return null;
}

// 2. Microsoft Azure Edge Neural Voice (ultra-fast, studio clarity)
async function generateEdgeNeuralTTS(
  text: string,
  targetLang: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    let voiceName = "en-US-JennyNeural";
    if (targetLang === "bn") {
      voiceName = "bn-BD-NabanitaNeural";
    } else if (targetLang === "es") {
      voiceName = "es-ES-ElviraNeural";
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    const chunks: Buffer[] = [];
    const audioBuffer: Buffer = await new Promise((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => resolve(Buffer.concat(chunks)));
      audioStream.on("error", (err: any) => reject(err));
    });

    return { buffer: audioBuffer, contentType: "audio/mpeg" };
  } catch (edgeErr) {
    console.warn("Edge TTS error:", edgeErr);
    return null;
  }
}

// 3. Fallback to Google Translate TTS
async function fetchGoogleTTSFallback(text: string, lang: string): Promise<Buffer | null> {
  try {
    const chunk = text.slice(0, 190);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }
  } catch (e) {
    console.warn("Google TTS fallback error:", e);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang = "en", apiKey: clientKey } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const hasBengali = /[\u0980-\u09FF]/.test(text) || lang === "bn";
    const targetLang = hasBengali ? "bn" : lang === "es" ? "es" : "en";

    const cleaned = cleanTextForTTS(text, hasBengali);
    if (!cleaned) {
      return NextResponse.json({ error: "Empty text after cleaning" }, { status: 400 });
    }

    // Limit single speech segment to first 850 characters for low latency & best prosody
    const textToSpeak = cleaned.slice(0, 850);

    const apiKey =
      clientKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Step 1: Attempt Gemini Native Expressive TTS (authentic human voice with emotion & tone)
    if (apiKey) {
      const geminiResult = await generateGeminiNativeTTS(textToSpeak, hasBengali, apiKey);
      if (geminiResult && geminiResult.buffer.length > 0) {
        return new NextResponse(new Uint8Array(geminiResult.buffer), {
          headers: {
            "Content-Type": geminiResult.contentType,
            "Content-Length": geminiResult.buffer.length.toString(),
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    }

    // Step 2: Attempt Microsoft Azure Edge Neural Voice
    const edgeResult = await generateEdgeNeuralTTS(textToSpeak, targetLang);
    if (edgeResult && edgeResult.buffer.length > 0) {
      return new NextResponse(new Uint8Array(edgeResult.buffer), {
        headers: {
          "Content-Type": edgeResult.contentType,
          "Content-Length": edgeResult.buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // Step 3: Google TTS Fallback
    const fallbackBuf = await fetchGoogleTTSFallback(textToSpeak, targetLang);
    if (fallbackBuf) {
      return new NextResponse(new Uint8Array(fallbackBuf), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": fallbackBuf.length.toString(),
        },
      });
    }

    throw new Error("All TTS engines failed to synthesize audio.");
  } catch (err: any) {
    console.error("TTS generation error:", err);
    return NextResponse.json(
      { error: "TTS_FAILED", message: err?.message || "Failed to generate speech audio." },
      { status: 500 }
    );
  }
}

// Support GET for direct audio URL requests
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "en";

  return POST(
    new NextRequest(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    })
  );
}
