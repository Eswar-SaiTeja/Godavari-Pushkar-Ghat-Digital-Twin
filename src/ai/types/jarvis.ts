/**
 * AI Digital Twin Copilot – JARVIS
 * Type definitions for Conversational Command Assistant
 * Godavari Pushkar Ghat 3D Digital Twin – Rajamahendravaram
 */

import { DataClassification, DataReference, HumanApprovalRequirement } from './ai';

export type JarvisLanguage = 'en' | 'te' | 'hi';

export type JarvisMapActionType = 
  | 'FLY_TO_GHAT'
  | 'HIGHLIGHT_ZONE'
  | 'FOCUS_INCIDENT'
  | 'SHOW_RESOURCES'
  | 'TOGGLE_LAYER'
  | 'HIGHLIGHT_EVAC_ROUTE'
  | 'RESET_VIEW';

export interface JarvisMapAction {
  type: JarvisMapActionType;
  label: string;
  explanation: string;
  payload: {
    ghatId?: string;
    zoneId?: string;
    incidentId?: string;
    resourceCategory?: string;
    layerKey?: string;
    enabled?: boolean;
    routeId?: string;
    coordinates?: { longitude: number; latitude: number; height?: number };
  };
}

export type JarvisDashboardLinkType = 
  | 'DISPATCH'
  | 'ANALYTICS'
  | 'GIS_AUDIT'
  | 'CROWD_CONTROLS'
  | 'OPERATIONS'
  | 'SCENARIO_COMPARE'
  | 'EVACUATION';

export interface JarvisDashboardLink {
  type: JarvisDashboardLinkType;
  label: string;
  tab?: string;
  description?: string;
}

export interface JarvisMetricItem {
  label: string;
  value: string | number;
  change?: string;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
}

export interface JarvisMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  timestamp: string;
  text: string;
  language: JarvisLanguage;
  directAnswer?: string;
  supportingMetrics?: JarvisMetricItem[];
  relevantEntity?: {
    type: 'ZONE' | 'GHAT' | 'INCIDENT' | 'RESOURCE' | 'BRIDGE' | 'SYSTEM';
    id: string;
    name: string;
  };
  dataClassification?: DataClassification;
  dataReferences?: DataReference[];
  mapAction?: JarvisMapAction;
  dashboardLinks?: JarvisDashboardLink[];
  suggestedNextActions?: string[];
  humanApproval?: HumanApprovalRequirement;
  missingDataNotice?: string;
  isError?: boolean;
  provider?: string;
  model?: string;
}

export interface JarvisConversationState {
  conversationId: string;
  language: JarvisLanguage;
  messages: JarvisMessage[];
  isProcessing: boolean;
  activeMapAction?: JarvisMapAction | null;
}
