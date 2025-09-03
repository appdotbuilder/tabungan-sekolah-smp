import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const studentStatusEnum = pgEnum('student_status', ['active', 'graduated', 'transferred']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal']);
export const teacherRoleEnum = pgEnum('teacher_role', ['homeroom_teacher', 'other']);
export const genderEnum = pgEnum('gender', ['male', 'female']);

// School table
export const schoolsTable = pgTable('schools', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  email: text('email'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Teachers table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: teacherRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  homeroom_teacher_id: integer('homeroom_teacher_id').references(() => teachersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  gender: genderEnum('gender').notNull(),
  nisn: text('nisn').notNull().unique(),
  nis: text('nis').notNull().unique(),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  phone: text('phone'),
  email: text('email'),
  bank_name: text('bank_name'),
  account_number: text('account_number'),
  status: studentStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Student aspirations table
export const studentAspirationsTable = pgTable('student_aspirations', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  target_amount: numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const teachersRelations = relations(teachersTable, ({ many }) => ({
  classes: many(classesTable),
}));

export const classesRelations = relations(classesTable, ({ one, many }) => ({
  homeroomTeacher: one(teachersTable, {
    fields: [classesTable.homeroom_teacher_id],
    references: [teachersTable.id],
  }),
  students: many(studentsTable),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  class: one(classesTable, {
    fields: [studentsTable.class_id],
    references: [classesTable.id],
  }),
  transactions: many(transactionsTable),
  aspirations: many(studentAspirationsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [transactionsTable.student_id],
    references: [studentsTable.id],
  }),
}));

export const studentAspirationsRelations = relations(studentAspirationsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [studentAspirationsTable.student_id],
    references: [studentsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type School = typeof schoolsTable.$inferSelect;
export type NewSchool = typeof schoolsTable.$inferInsert;

export type Teacher = typeof teachersTable.$inferSelect;
export type NewTeacher = typeof teachersTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

export type StudentAspiration = typeof studentAspirationsTable.$inferSelect;
export type NewStudentAspiration = typeof studentAspirationsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  schools: schoolsTable,
  teachers: teachersTable,
  classes: classesTable,
  students: studentsTable,
  transactions: transactionsTable,
  studentAspirations: studentAspirationsTable,
};