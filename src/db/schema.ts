import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const surveyStatusEnum = pgEnum('survey_status', ['draft', 'open', 'closed']);
export const questionTypeEnum = pgEnum('question_type', ['single', 'multiple', 'scale', 'text']);

// ============================================
// SURVEYS
// ============================================
export const surveys = pgTable('surveys', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: surveyStatusEnum('status').notNull().default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const surveysRelations = relations(surveys, ({ many }) => ({
  surveyQuestions: many(surveyQuestions),
  sessions: many(sessions),
  emailSubscriptions: many(emailSubscriptions),
}));

// ============================================
// CATEGORIES
// ============================================
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  questions: many(questions),
}));

// ============================================
// QUESTIONS
// ============================================
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  prompt: text('prompt').notNull(),
  description: text('description'),
  type: questionTypeEnum('type').notNull(),
  options: jsonb('options').$type<QuestionOption[]>(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  order: integer('order').notNull().default(0),
  skipCondition: jsonb('skip_condition').$type<SkipCondition>(),
  // For scale questions
  scaleMin: integer('scale_min'),
  scaleMax: integer('scale_max'),
  scaleMinLabel: varchar('scale_min_label', { length: 100 }),
  scaleMaxLabel: varchar('scale_max_label', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  category: one(categories, {
    fields: [questions.categoryId],
    references: [categories.id],
  }),
  surveyQuestions: many(surveyQuestions),
  responses: many(responses),
}));

// ============================================
// SURVEY_QUESTIONS (Join Table)
// ============================================
export const surveyQuestions = pgTable('survey_questions', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id).notNull(),
  questionId: integer('question_id').references(() => questions.id).notNull(),
  required: boolean('required').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('survey_question_idx').on(table.surveyId, table.questionId),
]);

export const surveyQuestionsRelations = relations(surveyQuestions, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyQuestions.surveyId],
    references: [surveys.id],
  }),
  question: one(questions, {
    fields: [surveyQuestions.questionId],
    references: [questions.id],
  }),
}));

// ============================================
// SESSIONS (Anonymous respondents)
// ============================================
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  surveyId: integer('survey_id').references(() => surveys.id).notNull(),
  ip: varchar('ip', { length: 45 }), // IPv6 compatible (max 45 chars)
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [sessions.surveyId],
    references: [surveys.id],
  }),
  responses: many(responses),
}));

// ============================================
// RESPONSES
// ============================================
export const responses = pgTable('responses', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  questionId: integer('question_id').references(() => questions.id).notNull(),
  answer: jsonb('answer').notNull().$type<ResponseAnswer>(),
  answeredAt: timestamp('answered_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('session_question_idx').on(table.sessionId, table.questionId),
]);

export const responsesRelations = relations(responses, ({ one }) => ({
  session: one(sessions, {
    fields: [responses.sessionId],
    references: [sessions.id],
  }),
  question: one(questions, {
    fields: [responses.questionId],
    references: [questions.id],
  }),
}));

// ============================================
// EMAIL SUBSCRIPTIONS
// ============================================
export const emailSubscriptions = pgTable('email_subscriptions', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  surveyId: integer('survey_id').references(() => surveys.id).notNull(),
  subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('email_survey_idx').on(table.email, table.surveyId),
]);

export const emailSubscriptionsRelations = relations(emailSubscriptions, ({ one }) => ({
  survey: one(surveys, {
    fields: [emailSubscriptions.surveyId],
    references: [surveys.id],
  }),
}));

// ============================================
// TypeScript Types
// ============================================
export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface SkipCondition {
  questionSlug: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'not_includes';
  value: string | string[];
}

export type ResponseAnswer = string | string[] | number;

// Inferred types
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type EmailSubscription = typeof emailSubscriptions.$inferSelect;


