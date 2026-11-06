/**
 * AI Command Assistant Service
 * Natural language conversational copilot for operations commanders.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  CommandAssistantQuery, 
  CommandAssistantPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class AICommandAssistantService {
  public async query(
    request: CommandAssistantQuery,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<CommandAssistantPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();

    return provider.generateStructured<CommandAssistantPayload>(
      'CommandAssistant',
      request.prompt,
      SYSTEM_PROMPTS.COMMAND_ASSISTANT,
      contextSummary,
      { userContext }
    );
  }
}

export const aiCommandAssistantService = new AICommandAssistantService();
