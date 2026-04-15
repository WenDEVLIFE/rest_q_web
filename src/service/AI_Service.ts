/**
 * AI Service for Res-Q Platform
 * Integrates with innovatechservicesph.com AI Chat Microservice
 * Enhanced with real-time map context (ML-powered)
 */

export type AIWeatherCondition = 'clear' | 'rainy' | 'typhoon';

export interface AIContextPayload {
  activeTrafficSegments: number;
  reportedIncidents: number;
  proneAreas: number;
  weatherCondition: AIWeatherCondition;
  avgResponseTime: number;
}

export interface AIRequestEnvelope {
  question: string;
  context?: AIContextPayload;
}

export interface AIResponse {
  answer: string;
  credits_used: number;
}

export function formatAIContextPrefix(context: AIContextPayload): string {
  return [
    `[LIVE: ${context.activeTrafficSegments} traffic segments congested]`,
    `[ACTIVE: ${context.reportedIncidents} incidents reported]`,
    `[PRONE: ${context.proneAreas} high-risk zones]`,
    `[WEATHER: ${context.weatherCondition}]`,
    `[RESPONSE: ${context.avgResponseTime}min avg]`,
  ].join(' ');
}

export class AIService {
  private static API_URL = "/api/ai-chat";
  
  /**
   * Sends a query to the AI Chat service with optional real-time map context
   * @param question The user's query
   * @param apiKey The license key from settings
   * @param mapContext Optional real-time map data for enhanced responses
   */
  static async askAI(question: string, apiKey?: string, mapContext?: AIContextPayload): Promise<AIResponse> {
    try {
      const resolvedApiKey = apiKey || process.env.NEXT_PUBLIC_AI_MICROSERVICE_API_KEY;
      if (!resolvedApiKey) {
        throw new Error("AI Service Error: Missing API key. Set NEXT_PUBLIC_AI_MICROSERVICE_API_KEY or pass apiKey to askAI().");
      }

      const payload: AIRequestEnvelope = {
        question,
        context: mapContext,
      };

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: resolvedApiKey,
          ...payload,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI Service Error: ${response.status} ${response.statusText}${text ? ` | ${text}` : ''}`);
      }

      const data = await response.json();
      return data as AIResponse;
    } catch (error) {
      console.error("AI Assistant Failure:", error);
      throw error;
    }
  }
}
