import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzxzdwwnivvcfvmzhbia.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      userId,
      chunks = [],
      metadata = {},
      apiKey: clientKey,
    } = body;

    if (!documentId || !userId || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", message: "Missing documentId, userId, or chunks." },
        { status: 400 }
      );
    }

    // Resolve Gemini API Key
    const headerKey = req.headers.get("x-gemini-api-key");
    const apiKey =
      clientKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_API_KEY",
          message: "Gemini API key is required to generate vector embeddings.",
        },
        { status: 400 }
      );
    }

    // Initialize Supabase Client with service role or caller's auth token
    const authHeader = req.headers.get("authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const insertedRows = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      if (!chunkText || typeof chunkText !== "string") continue;

      // Call Gemini Embedding API (768 dimensions)
      const embedUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${apiKey}`;
      const embedRes = await fetch(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: chunkText.slice(0, 2048) }] },
          outputDimensionality: 768,
        }),
      });

      if (!embedRes.ok) {
        const errText = await embedRes.text();
        console.warn(`Gemini embedding failed for chunk ${i}:`, errText);
        continue;
      }

      const embedData = await embedRes.json();
      const embedding = embedData.embedding?.values;

      if (!embedding || embedding.length !== 768) {
        console.warn(`Unexpected embedding dimensions: ${embedding?.length}`);
        continue;
      }

      insertedRows.push({
        document_id: documentId,
        user_id: userId,
        chunk_index: i,
        chunk_content: chunkText,
        embedding: embedding,
        metadata: {
          ...metadata,
          chunk_length: chunkText.length,
          model: "text-embedding-004",
        },
      });
    }

    if (insertedRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Could not generate embeddings for provided chunks." },
        { status: 502 }
      );
    }

    // Upsert into document_embeddings table
    const { error: dbError } = await supabase
      .from("document_embeddings")
      .upsert(insertedRows, { onConflict: "document_id,chunk_index" });

    if (dbError) {
      console.error("Failed to store document embeddings in Supabase:", dbError);
      return NextResponse.json(
        { success: false, error: "DB_ERROR", message: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documentId,
      chunksIndexed: insertedRows.length,
      dimensions: 768,
    });
  } catch (err: any) {
    console.error("Vector embedding route error:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: err?.message || "Internal error." },
      { status: 500 }
    );
  }
}
