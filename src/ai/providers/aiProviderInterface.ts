/**
 * AI Provider Interface
 * Provider-agnostic abstraction for LLM backends (Mock, Gemini, OpenAI, Anthropic, etc.)
 */

import { AIStructuredResponse, AIProviderHealth, AIProviderType } from '../types/ai';

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  userContext?: {
    userId: string;
    role: string;
  };
}

export interface AIProvider {
  readonly id: AIProviderType;
  readonly name: string;
  readonly modelName: string;

  /**
   * Check if provider is available and ready for inference
   */
  isAvailable(): Promise<boolean>;

  /**
   * Actively ping and test real connection to backend / provider
   */
  testConnection(): Promise<AIProviderHealth>;

  /**
   * Generate structured, validated JSON response matching specified schema and service context
   */
  generateStructured<T>(
    service: string,
    prompt: string,
    systemPrompt: string,
    contextSummary: string,
    options?: GenerateOptions
  ): Promise<AIStructuredResponse<T>>;
}
