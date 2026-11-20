import { AIProvider, ChatMessage, ClinicalContext, AIResponse } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { MockAIProvider } from "./providers/mock";

/**
 * Factory and orchestrator for the ChronicAI Medical Engine.
 * Dynamically picks provider based on AI_PROVIDER and API key configuration,
 * with seamless graceful fallback to MockAIProvider if an external API fails or is unconfigured.
 */
export class AIEngine {
  private primaryProvider: AIProvider;
  private fallbackProvider: AIProvider;

  constructor() {
    const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "";
    const model = process.env.AI_MODEL || "gemini-1.5-pro";

    this.fallbackProvider = new MockAIProvider();

    if (providerName === "gemini" && apiKey && !apiKey.includes("placeholder")) {
      this.primaryProvider = new GeminiProvider(apiKey, model);
    } else if (providerName === "openai" && apiKey && !apiKey.includes("placeholder")) {
      this.primaryProvider = new OpenAIProvider(apiKey, model);
    } else {
      this.primaryProvider = this.fallbackProvider;
    }
  }

  async ask(
    messages: ChatMessage[],
    context?: ClinicalContext
  ): Promise<AIResponse> {
    try {
      return await this.primaryProvider.generateResponse(messages, context);
    } catch (primaryError) {
      console.warn(
        `[AIEngine] Primary provider (${this.primaryProvider.name}) failed. Falling back to Mock Clinical Provider:`,
        primaryError
      );
      return await this.fallbackProvider.generateResponse(messages, context);
    }
  }
}

export const aiEngine = new AIEngine();
