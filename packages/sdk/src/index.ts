export { MailgateClient, type MailgateClientOptions } from './client';
export { AuthResource } from './resources/auth';
export { EmailsResource } from './resources/emails';
export { DraftsResource } from './resources/drafts';
export { RulesResource } from './resources/rules';
export { ApiKeysResource } from './resources/api-keys';
export { AccountsResource } from './resources/accounts';
export type {
  Email,
  Draft,
  Rule,
  RuleConditions,
  RuleActions,
  FilteringRule,
  FilteringConditions,
  FilteringActions,
  ApiKey,
  ApiKeyPermissions,
  AuditLog,
  GmailAccount,
  Pagination,
  Subscription,
} from './types';
