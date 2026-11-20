import { AIProvider, ChatMessage, ClinicalContext, AIResponse } from "../types";
import { buildClinicalSystemPrompt, evaluateClinicalSafety } from "../guardrails";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model: string = "gpt-4o", baseUrl?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
    this.model = model;
    this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
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

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "No response received.";

      return {
        content: rawText,
        citations: [],
        safety,
        provider: this.name,
        model: this.model,
      };
    } catch (err: any) {
      throw new Error(`OpenAI Provider execution failure: ${err?.message || err}`);
    }
  }
}
