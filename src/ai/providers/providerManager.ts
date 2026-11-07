/**
 * AI Provider Manager
 * Singleton managing provider selection, connection health, and active switching.
 */

import { AIProvider } from './aiProviderInterface';
import { mockAIProvider } from './mockAIProvider';
import { serverClientAIProvider } from './serverClientAIProvider';
import { AIProviderHealth, AIProviderType } from '../types/ai';

class ProviderManager {
  private activeProvider: AIProvider = serverClientAIProvider;
  private currentHealth: AIProviderHealth | null = null;
  private listeners: Array<(health: AIProviderHealth) => void> = [];

  constructor() {
    // Initial health check in background
    this.refreshHealth().catch(() => {});
  }

  public getProvider(): AIProvider {
    return this.activeProvider;
  }

  public setProvider(type: AIProviderType): void {
    if (type === 'mock') {
      this.activeProvider = mockAIProvider;
    } else {
      this.activeProvider = serverClientAIProvider;
    }
    this.refreshHealth().catch(() => {});
  }

  public async refreshHealth(): Promise<AIProviderHealth> {
    const health = await this.activeProvider.testConnection();
    this.currentHealth = health;
    this.listeners.forEach(fn => fn(health));
    return health;
  }

  /**
   * Manual Retry Connection: forces bypass of circuit breaker cooldown
   */
  public async retryConnection(): Promise<AIProviderHealth> {
    if ('retryConnection' in this.activeProvider) {
      const health = await (this.activeProvider as any).retryConnection();
      this.currentHealth = health;
      this.listeners.forEach(fn => fn(health));
      return health;
    }
    return this.refreshHealth();
  }

  public getCachedHealth(): AIProviderHealth | null {
    return this.currentHealth;
  }

  public subscribe(fn: (health: AIProviderHealth) => void): () => void {
    this.listeners.push(fn);
    if (this.currentHealth) fn(this.currentHealth);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}

export const providerManager = new ProviderManager();
