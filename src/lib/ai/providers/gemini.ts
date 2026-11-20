import { AIProvider, ChatMessage, ClinicalContext, AIResponse } from "../types";
import { buildClinicalSystemPrompt, evaluateClinicalSafety } from "../guardrails";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "gemini-1.5-pro") {
    this.apiKey = apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "";
    this.model = model;
  }

  async generateResponse(
    messages: ChatMessage[],
    context?: ClinicalContext
  ): Promise<AIResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const safety = evaluateClinicalSafety(lastUserMessage);

    if (safety.is_emergency) {
      return {
        content: `### 🚨 EMERGENCY ALERT: ${safety.emergency_category}\n\n**${safety.disclaimer}**\n\nIf you are experiencing acute severe symptoms such as crushing chest pressure, sudden weakness/speech impairment, or breathing difficulty, please **call emergency services (911) or proceed to the nearest emergency department immediately.**`,
        citations: [],
        safety,
        provider: this.name,
        model: this.model,
      };
    }

    const systemPrompt = buildClinicalSystemPrompt(context);

    // Call Gemini REST API directly
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const formattedContents = [
      {
        role: "user",
        parts: [{ text: `SYSTEM INSTRUCTION:\n${systemPrompt}` }],
      },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    ];

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: formattedContents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

      // Extract citation tags like [doc:DOC-123]
      const citations = this.extractCitations(rawText, context);

      return {
        content: rawText,
        citations,
        safety,
        provider: this.name,
        model: this.model,
      };
    } catch (err: any) {
      throw new Error(`Gemini Provider execution failure: ${err?.message || err}`);
    }
  }

  private extractCitations(text: string, context?: ClinicalContext) {
    const citations: import("@/types/medical").AICitation[] = [];
    const docRegex = /\[doc:([a-zA-Z0-9_-]+)\]/g;
    let match;

    while ((match = docRegex.exec(text)) !== null) {
      const docId = match[1];
      const foundDoc = context?.recent_documents?.find((d) => d.id === docId);
      if (foundDoc && !citations.some((c) => c.document_id === docId)) {
        citations.push({
          document_id: docId,
          document_title: foundDoc.title,
          snippet: `Cited clinical source from ${foundDoc.date}`,
        });
      }
    }

    return citations;
  }
}
