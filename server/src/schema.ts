import { z } from 'zod';

// Enums
export const studentStatusEnum = z.enum(['active', 'graduated', 'transferred']);
export const transactionTypeEnum = z.enum(['deposit', 'withdrawal']);
export const teacherRoleEnum = z.enum(['homeroom_teacher', 'other']);
export const genderEnum = z.enum(['male', 'female']);

// School schema
export const schoolSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type School = z.infer<typeof schoolSchema>;

export const createSchoolInputSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().nullable(),
  email: z.string().email().nullable()
});

export type CreateSchoolInput = z.infer<typeof createSchoolInputSchema>;

export const updateSchoolInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional()
});

export type UpdateSchoolInput = z.infer<typeof updateSchoolInputSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: teacherRoleEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Teacher = z.infer<typeof teacherSchema>;

export const createTeacherInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: teacherRoleEnum
});

export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>;

export const updateTeacherInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: teacherRoleEnum.optional()
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherInputSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  homeroom_teacher_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

export const createClassInputSchema = z.object({
  name: z.string().min(1),
  homeroom_teacher_id: z.number().nullable()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  homeroom_teacher_id: z.number().nullable().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  gender: genderEnum,
  nisn: z.string(),
  nis: z.string(),
  class_id: z.number(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  bank_name: z.string().nullable(),
  account_number: z.string().nullable(),
  status: studentStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

export const createStudentInputSchema = z.object({
  name: z.string().min(1),
  gender: genderEnum,
  nisn: z.string().min(1),
  nis: z.string().min(1),
  class_id: z.number(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  bank_name: z.string().nullable(),
  account_number: z.string().nullable(),
  status: studentStatusEnum.default('active')
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const updateStudentInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  gender: genderEnum.optional(),
  nisn: z.string().min(1).optional(),
  nis: z.string().min(1).optional(),
  class_id: z.number().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  status: studentStatusEnum.optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  type: transactionTypeEnum,
  amount: z.number(),
  notes: z.string().nullable(),
  student_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  date: z.coerce.date(),
  type: transactionTypeEnum,
  amount: z.number().positive(),
  notes: z.string().nullable(),
  student_id: z.number()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  type: transactionTypeEnum.optional(),
  amount: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
  student_id: z.number().optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Student aspiration schema
export const studentAspirationSchema = z.object({
  id: z.number(),
  description: z.string(),
  target_amount: z.number(),
  student_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StudentAspiration = z.infer<typeof studentAspirationSchema>;

export const createStudentAspirationInputSchema = z.object({
  description: z.string().min(1),
  target_amount: z.number().positive(),
  student_id: z.number()
});

export type CreateStudentAspirationInput = z.infer<typeof createStudentAspirationInputSchema>;

export const updateStudentAspirationInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1).optional(),
  target_amount: z.number().positive().optional(),
  student_id: z.number().optional()
});

export type UpdateStudentAspirationInput = z.infer<typeof updateStudentAspirationInputSchema>;

// Query filters
export const transactionFilterSchema = z.object({
  student_id: z.number().optional(),
  class_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  type: transactionTypeEnum.optional()
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// Leaderboard schemas
export const studentLeaderboardSchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  class_name: z.string(),
  total_deposits: z.number(),
  transaction_count: z.number(),
  current_balance: z.number()
});

export type StudentLeaderboard = z.infer<typeof studentLeaderboardSchema>;

export const classLeaderboardSchema = z.object({
  class_id: z.number(),
  class_name: z.string(),
  total_deposits: z.number(),
  total_students: z.number(),
  average_balance: z.number()
});

export type ClassLeaderboard = z.infer<typeof classLeaderboardSchema>;

// Report schemas
export const transactionReportSchema = z.object({
  transaction_id: z.number(),
  date: z.coerce.date(),
  type: transactionTypeEnum,
  amount: z.number(),
  notes: z.string().nullable(),
  student_name: z.string(),
  class_name: z.string()
});

export type TransactionReport = z.infer<typeof transactionReportSchema>;