/**
 * Report Generation AI Service
 * Automatically compiles executive Situation Reports (SITREPs) with data citations.
 */

import { providerManager } from '../providers/providerManager';
import { digitalTwinContextBridge } from '../core/digitalTwinContextBridge';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';
import { 
  ReportGenerationRequest, 
  ReportGenerationPayload, 
  AIStructuredResponse 
} from '../types/ai';

export class ReportGenerationService {
  public async generateReport(
    request?: ReportGenerationRequest,
    userContext?: { userId: string; role: string }
  ): Promise<AIStructuredResponse<ReportGenerationPayload>> {
    const provider = providerManager.getProvider();
    const contextSummary = digitalTwinContextBridge.getContextSummaryForPrompt();
    const prompt = `Compile complete Operational Situation Report (SITREP) in format: ${request?.format || 'MARKDOWN'} covering all simulated crowd, hydrology, traffic, and emergency response performance.`;

    return provider.generateStructured<ReportGenerationPayload>(
      'ReportGeneration',
      prompt,
      SYSTEM_PROMPTS.REPORT_GENERATION,
      contextSummary,
      { userContext }
    );
  }
}

export const reportGenerationService = new ReportGenerationService();
