import {
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
  doublePrecision,
  real,
  boolean,
  jsonb,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const sessionModeEnum = pgEnum('session_mode', ['drive', 'walk', 'hang']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'ended']);
export const memberRoleEnum = pgEnum('member_role', ['host', 'mod', 'member']);
export const memberStatusEnum = pgEnum('member_status', ['on_my_way', 'here', 'running_late']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  hostId: text('host_id')
    .references(() => users.id)
    .notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  mode: sessionModeEnum('mode').notNull().default('hang'),
  status: sessionStatusEnum('status').notNull().default('active'),
  inviteCode: varchar('invite_code', { length: 12 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessionMembers = pgTable(
  'session_members',
  {
    sessionId: text('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    role: memberRoleEnum('role').notNull().default('member'),
    status: memberStatusEnum('status'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.userId] })],
);

export const destinations = pgTable('destinations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 300 }).notNull(),
  address: text('address'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  placeId: text('place_id'),
  setBy: text('set_by')
    .references(() => users.id)
    .notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const locationUpdates = pgTable(
  'location_updates',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    heading: real('heading'),
    speed: real('speed'),
    accuracy: real('accuracy').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_location_session_time').on(table.sessionId, table.recordedAt),
    index('idx_location_user_session').on(table.userId, table.sessionId),
    index('idx_location_created').on(table.createdAt),
  ],
);

export const sessionEvents = pgTable(
  'session_events',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id').references(() => users.id),
    type: varchar('type', { length: 50 }).notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_events_session_time').on(table.sessionId, table.createdAt)],
);

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    token: text('token').notNull(),
    platform: varchar('platform', { length: 10 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_push_tokens_user').on(table.userId)],
);
