/**
 * Multilingual Public Announcement Generator - Type Definitions
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 */

export type AnnouncementLanguage = 'te' | 'en' | 'hi' | 'all';

export type AnnouncementCategory = 
  | 'GENERAL_EVENT_INFO'
  | 'GHAT_NAVIGATION'
  | 'QUEUE_MANAGEMENT'
  | 'FACILITY_DIRECTIONS'
  | 'MEDICAL_ASSISTANCE'
  | 'EMERGENCY_DEMONSTRATION'
  | 'ROUTE_CLOSURE';

export type AnnouncementPriority = 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE';

export type AnnouncementApprovalStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'BROADCASTING' | 'ARCHIVED';

export interface LanguageScript {
  scriptText: string;
  phoneticText?: string;
  languageName: string;
}

export interface AudioSimulationConfig {
  durationSeconds: number;
  voiceGender: 'MALE' | 'FEMALE';
  tone: 'CALM' | 'AUTHORITATIVE' | 'URGENT';
  simulatedSpeakerLocations: string[];
}

export interface MultilingualAnnouncementScript {
  id: string;
  category: AnnouncementCategory;
  categoryLabel: string;
  targetZoneId: string;
  targetZoneName: string;
  priority: AnnouncementPriority;
  isSimulatedDemonstration: boolean;
  disclaimerText: string;
  createdAt: string;
  updatedAt: string;
  status: AnnouncementApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  reviewNotes?: string;
  scripts: {
    te: LanguageScript;
    en: LanguageScript;
    hi: LanguageScript;
  };
  audioSimulation: AudioSimulationConfig;
}

export interface AnnouncementGenerationParams {
  category: AnnouncementCategory;
  language: AnnouncementLanguage;
  zoneId: string;
  priority?: AnnouncementPriority;
  customDetails?: string;
  operatorId?: string;
}
