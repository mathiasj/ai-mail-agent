import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  tier: text('tier').notNull().default('free'), // free, pro, team, enterprise
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  gmailAccounts: many(gmailAccounts),
  emails: many(emails),
  drafts: many(drafts),
  rules: many(rules),
  subscriptions: many(subscriptions),
}));

// ─── Gmail Accounts ──────────────────────────────────────────────────

export const gmailAccounts = pgTable('gmail_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  refreshToken: text('refresh_token').notNull(), // Should be encrypted at rest
  watchExpiry: timestamp('watch_expiry'),
  historyId: text('history_id'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('gmail_accounts_email_idx').on(table.email),
  index('gmail_accounts_user_id_idx').on(table.userId),
]);

export const gmailAccountsRelations = relations(gmailAccounts, ({ one, many }) => ({
  user: one(users, { fields: [gmailAccounts.userId], references: [users.id] }),
  emails: many(emails),
}));

// ─── Emails ──────────────────────────────────────────────────────────

export const emails = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => gmailAccounts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gmailId: text('gmail_id').notNull().unique(),
  threadId: text('thread_id').notNull(),
  from: text('from_address').notNull(),
  to: text('to_address').notNull(),
  subject: text('subject').notNull(),
  body: text('body'),
  snippet: text('snippet'),
  category: text('category'), // action-required, fyi, meeting, newsletter, spam, automated
  priority: integer('priority'), // 1-10
  summary: text('summary'),
  entities: jsonb('entities').$type<{
    people?: string[];
    companies?: string[];
    dates?: string[];
    amounts?: string[];
  }>(),
  read: boolean('read').default(false).notNull(),
  archived: boolean('archived').default(false).notNull(),
  receivedAt: timestamp('received_at').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('emails_user_id_idx').on(table.userId),
  index('emails_account_id_idx').on(table.accountId),
  index('emails_thread_id_idx').on(table.threadId),
  index('emails_category_idx').on(table.category),
  index('emails_received_at_idx').on(table.receivedAt),
]);

export const emailsRelations = relations(emails, ({ one, many }) => ({
  account: one(gmailAccounts, { fields: [emails.accountId], references: [gmailAccounts.id] }),
  user: one(users, { fields: [emails.userId], references: [users.id] }),
  drafts: many(drafts),
}));

// ─── Drafts ──────────────────────────────────────────────────────────

export const drafts = pgTable('drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailId: uuid('email_id').references(() => emails.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  approved: boolean('approved').default(false).notNull(),
  sent: boolean('sent').default(false).notNull(),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('drafts_email_id_idx').on(table.emailId),
  index('drafts_user_id_idx').on(table.userId),
]);

export const draftsRelations = relations(drafts, ({ one }) => ({
  email: one(emails, { fields: [drafts.emailId], references: [emails.id] }),
  user: one(users, { fields: [drafts.userId], references: [users.id] }),
}));

// ─── Rules ───────────────────────────────────────────────────────────

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

export const rules = pgTable('rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  conditions: jsonb('conditions').$type<RuleConditions>().notNull(),
  actions: jsonb('actions').$type<RuleActions>().notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  priority: integer('priority').default(0).notNull(), // Higher = earlier
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('rules_user_id_idx').on(table.userId),
]);

export const rulesRelations = relations(rules, ({ one }) => ({
  user: one(users, { fields: [rules.userId], references: [users.id] }),
}));

// ─── Subscriptions ───────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  tier: text('tier').notNull(), // pro, team, enterprise
  status: text('status').notNull(), // active, canceled, past_due, trialing
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));
