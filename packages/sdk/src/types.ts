export interface Email {
  id: string;
  accountId: string;
  userId: string;
  gmailId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body?: string | null;
  snippet?: string | null;
  category?: string | null;
  priority?: number | null;
  summary?: string | null;
  entities?: {
    people?: string[];
    companies?: string[];
    dates?: string[];
    amounts?: string[];
  } | null;
  read: boolean;
  archived: boolean;
  receivedAt: string;
  processedAt?: string | null;
  createdAt: string;
}

export interface Draft {
  id: string;
  emailId: string;
  userId: string;
  content: string;
  approved: boolean;
  sent: boolean;
  sentAt?: string | null;
  createdAt: string;
}

export interface Rule {
  id: string;
  userId: string;
  name: string;
  conditions: RuleConditions;
  actions: RuleActions;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConditions {
  from?: string;
  to?: string;
  subject_contains?: string;
  category?: string;
  priority_gte?: number;
  priority_lte?: number;
}

export interface RuleActions {
  classify?: string;
  auto_reply?: boolean;
  reply_template?: string;
  forward_to_agent?: string;
  archive?: boolean;
  mark_read?: boolean;
}

export interface FilteringRule {
  id: string;
  userId: string;
  name: string;
  conditions: FilteringConditions;
  actions: FilteringActions;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilteringConditions {
  from?: string;
  fromDomain?: string;
  fromRegex?: string;
  to?: string;
  subject_contains?: string;
  subjectRegex?: string;
  category?: string;
  priority_gte?: number;
  priority_lte?: number;
}

export interface FilteringActions {
  classify?: string;
  archive?: boolean;
  mark_read?: boolean;
  auto_reply?: boolean;
  webhook?: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  type: 'user' | 'velocity';
  permissions: ApiKeyPermissions;
  monthlyQuota?: number | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface ApiKeyPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  apiKeyId?: string | null;
  action: string;
  resource: string;
  method: string;
  path: string;
  statusCode: number;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface GmailAccount {
  id: string;
  userId: string;
  email: string;
  active: boolean;
  watchExpiry?: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  tier: string;
  status: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}
