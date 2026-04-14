/**
 * AI Service for Res-Q Platform
 * Integrates with innovatechservicesph.com AI Chat Microservice
 */

export interface AIResponse {
  answer: string;
  credits_used: number;
}

export class AIService {
  private static API_URL = "https://innovatechservicesph.com/management/microservices.php?service=ai-chat";
  
  /**
   * Sends a query to the AI Chat service
   * @param question The user's query
   * @param apiKey The license key from settings
   */
  static async askAI(question: string, apiKey: string): Promise<AIResponse> {
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          question: question,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as AIResponse;
    } catch (error) {
      console.error("AI Assistant Failure:", error);
      throw error;
    }
  }
}
