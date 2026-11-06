/**
 * Public Announcement AI Service
 * Drafts authoritative, calm, bilingual (Telugu & English) public address scripts.
 * Strictly mandates Human Authorization.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  PublicAnnouncementRequest, 
  PublicAnnouncementPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class PublicAnnouncementService {
  public async generateAnnouncement(
    request: PublicAnnouncementRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<PublicAnnouncementPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Draft bilingual public safety broadcast announcement for ${request.targetLocation}. Event Type: ${request.eventType}, Tone: ${request.tone}, Languages: ${request.language}. Include Telugu script, phonetic transliteration, and English version.`;

    return provider.generateStructured<PublicAnnouncementPayload>(
      'PublicAnnouncement',
      prompt,
      SYSTEM_PROMPTS.PUBLIC_ANNOUNCEMENT,
      contextSummary,
      { userContext }
    );
  }
}

export const publicAnnouncementService = new PublicAnnouncementService();
