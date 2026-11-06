/**
 * AI Security Guard & Governance Service
 * Enforces prompt injection protection, sensitive data minimization,
 * RBAC permissions, audit logging, and human-in-the-loop operational approval.
 */

import { 
  UserContext, 
  UserRole, 
  AIAuditLogEntry, 
  HumanApprovalRequirement, 
  OperationalActionType 
} from '../types/ai';

// Forbidden prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*prompt\s*override/i,
  /bypass\s+human\s+approval/i,
  /force\s+dispatch\s+without\s+confirmation/i,
  /disable\s+safety\s+filter/i,
  /act\s+as\s+jailbroken/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /execute\s+command\s*:\s*rm\b/i,
];

// Sensitive PII regex patterns for data minimization
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /(?:\+91[\s-]?)?[6-9]\d{9}\b/g,                          // Indian phone numbers
  /\b\d{4}\s\d{4}\s\d{4}\b/g,                             // Aadhaar-like numbers
];

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  securityFlags: string[];
  error?: string;
}

export class AISecurityGuard {
  private auditLog: AIAuditLogEntry[] = [];
  private auditListeners: Array<(entry: AIAuditLogEntry) => void> = [];

  /**
   * Validate and sanitize input prompt against length limits, injections, and PII
   */
  public validateInputPrompt(prompt: string, maxLength: number = 2000): ValidationResult {
    const flags: string[] = [];

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return {
        isValid: false,
        sanitizedText: '',
        securityFlags: ['EMPTY_PROMPT'],
        error: 'Prompt cannot be empty'
      };
    }

    if (prompt.length > maxLength) {
      return {
        isValid: false,
        sanitizedText: prompt.substring(0, maxLength),
        securityFlags: ['MAX_LENGTH_EXCEEDED'],
        error: `Prompt exceeds maximum character length of ${maxLength}`
      };
    }

    // Check for malicious prompt injections
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(prompt)) {
        flags.push('PROMPT_INJECTION_DETECTED');
        return {
          isValid: false,
          sanitizedText: '',
          securityFlags: flags,
          error: 'Security Alert: Prompt contains prohibited instruction override patterns'
        };
      }
    }

    // Sensitive data minimization (scrub PII)
    let sanitized = prompt;
    for (const pii of PII_PATTERNS) {
      if (pii.test(sanitized)) {
        flags.push('PII_MASKED');
        sanitized = sanitized.replace(pii, '[REDACTED_CONFIDENTIAL]');
      }
    }

    return {
      isValid: true,
      sanitizedText: sanitized.trim(),
      securityFlags: flags
    };
  }

  /**
   * Check if user role has authorization for requested action
   */
  public checkRoleAuthorization(user: UserContext, action: 'QUERY' | 'RECOMMEND' | 'APPROVE' | 'ADMIN'): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      OPERATOR: 1,
      DISPATCHER: 2,
      COMMANDER: 3,
      ADMIN: 4
    };

    const requiredLevels = {
      QUERY: 1,
      RECOMMEND: 1,
      APPROVE: 3,  // Only COMMANDER and ADMIN can approve operational dispatches
      ADMIN: 4
    };

    const userLevel = roleHierarchy[user.role] ?? 1;
    return userLevel >= requiredLevels[action];
  }

  /**
   * Enforce Human Approval policy for operational actions
   */
  public evaluateHumanApprovalRequirement(
    actionType: OperationalActionType,
    details?: string,
    proposedPayload?: any
  ): HumanApprovalRequirement {
    // Operational actions that affect safety, dispatches, evacuations, or official announcements
    // MUST REQUIRE AUTHORIZED HUMAN CONFIRMATION
    if (actionType === 'DISPATCH' || 
        actionType === 'EVACUATION_ROUTE_MOD' || 
        actionType === 'PUBLIC_ALERT' ||
        actionType === 'RESOURCE_REALLOCATION') {
      return {
        requiresApproval: true,
        actionType,
        actionTitle: `Human Authorization Required: ${actionType.replace(/_/g, ' ')}`,
        rationale: 'Mandatory Digital Twin Safety Policy: AI is strictly advisory. Emergency dispatches and public announcements require human commander sign-off.',
        proposedPayload,
        approvalStatus: 'PENDING',
        details
      };
    }

    return {
      requiresApproval: false,
      actionType: 'NONE',
      approvalStatus: 'NOT_REQUIRED'
    };
  }

  /**
   * Record immutable audit log entry
   */
  public logAudit(entry: Omit<AIAuditLogEntry, 'id' | 'timestamp'>): AIAuditLogEntry {
    const fullEntry: AIAuditLogEntry = {
      ...entry,
      id: `ai-audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    this.auditLog.unshift(fullEntry);
    if (this.auditLog.length > 500) {
      this.auditLog.pop(); // Keep recent 500 records
    }

    // Notify listeners
    this.auditListeners.forEach(listener => {
      try {
        listener(fullEntry);
      } catch (err) {
        console.error('[AISecurityGuard] Audit listener failed:', err);
      }
    });

    return fullEntry;
  }

  /**
   * Process human decision on a pending AI operational action
   */
  public processHumanDecision(
    auditId: string, 
    reviewer: UserContext, 
    decision: 'APPROVED' | 'REJECTED', 
    notes?: string
  ): AIAuditLogEntry | null {
    if (!this.checkRoleAuthorization(reviewer, 'APPROVE')) {
      throw new Error(`Unauthorized: User role ${reviewer.role} cannot approve or reject operational actions. Requires COMMANDER or ADMIN role.`);
    }

    const log = this.auditLog.find(l => l.id === auditId);
    if (!log) return null;

    log.approvalStatus = decision;
    
    // Log secondary audit transition
    this.logAudit({
      user: reviewer,
      service: 'HumanApprovalGovernance',
      query: `Review action for audit ID: ${auditId}`,
      responseSummary: `Human ${decision} by ${reviewer.name} (${reviewer.role}). Notes: ${notes || 'No notes'}`,
      requiresHumanApproval: false,
      approvalStatus: decision,
      dataClassifications: ['ADMIN_CONFIGURED'],
      provider: 'human-in-the-loop',
      latencyMs: 0
    });

    return log;
  }

  /**
   * Get all audit logs
   */
  public getAuditHistory(limit: number = 50): AIAuditLogEntry[] {
    return this.auditLog.slice(0, limit);
  }

  /**
   * Subscribe to new audit log entries
   */
  public subscribeToAudits(listener: (entry: AIAuditLogEntry) => void): () => void {
    this.auditListeners.push(listener);
    return () => {
      this.auditListeners = this.auditListeners.filter(l => l !== listener);
    };
  }
}

export const aiSecurityGuard = new AISecurityGuard();
