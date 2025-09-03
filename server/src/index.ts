import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createSchoolInputSchema,
  updateSchoolInputSchema,
  createTeacherInputSchema,
  updateTeacherInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  createStudentInputSchema,
  updateStudentInputSchema,
  createTransactionInputSchema,
  updateTransactionInputSchema,
  createStudentAspirationInputSchema,
  updateStudentAspirationInputSchema,
  transactionFilterSchema
} from './schema';

// Import handlers
import { createSchool, getSchool, updateSchool } from './handlers/school_handlers';
import { 
  createTeacher, 
  getTeachers, 
  getTeacher, 
  updateTeacher, 
  deleteTeacher 
} from './handlers/teacher_handlers';
import { 
  createClass, 
  getClasses, 
  getClass, 
  updateClass, 
  deleteClass, 
  getClassesByTeacher 
} from './handlers/class_handlers';
import { 
  createStudent, 
  getStudents, 
  getStudent, 
  updateStudent, 
  deleteStudent, 
  getStudentsByClass, 
  getStudentsByTeacher 
} from './handlers/student_handlers';
import { 
  createTransaction, 
  getTransactions, 
  getTransaction, 
  updateTransaction, 
  deleteTransaction, 
  getTransactionsByStudent, 
  getTransactionsByClass, 
  getTransactionsByTeacher, 
  getTransactionReport, 
  getStudentBalance 
} from './handlers/transaction_handlers';
import { 
  createStudentAspiration, 
  getStudentAspirations, 
  getStudentAspiration, 
  updateStudentAspiration, 
  deleteStudentAspiration, 
  getAspirationsByStudent, 
  getAspirationsByClass, 
  getAspirationsByTeacher 
} from './handlers/aspiration_handlers';
import { 
  getStudentLeaderboard, 
  getClassLeaderboard, 
  getStudentLeaderboardByClass, 
  getStudentLeaderboardByTeacher 
} from './handlers/leaderboard_handlers';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // School routes
  school: router({
    create: publicProcedure
      .input(createSchoolInputSchema)
      .mutation(({ input }) => createSchool(input)),
    get: publicProcedure
      .query(() => getSchool()),
    update: publicProcedure
      .input(updateSchoolInputSchema)
      .mutation(({ input }) => updateSchool(input)),
  }),

  // Teacher routes
  teachers: router({
    create: publicProcedure
      .input(createTeacherInputSchema)
      .mutation(({ input }) => createTeacher(input)),
    getAll: publicProcedure
      .query(() => getTeachers()),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getTeacher(input.id)),
    update: publicProcedure
      .input(updateTeacherInputSchema)
      .mutation(({ input }) => updateTeacher(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteTeacher(input.id)),
  }),

  // Class routes
  classes: router({
    create: publicProcedure
      .input(createClassInputSchema)
      .mutation(({ input }) => createClass(input)),
    getAll: publicProcedure
      .query(() => getClasses()),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getClass(input.id)),
    update: publicProcedure
      .input(updateClassInputSchema)
      .mutation(({ input }) => updateClass(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteClass(input.id)),
    getByTeacher: publicProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(({ input }) => getClassesByTeacher(input.teacherId)),
  }),

  // Student routes
  students: router({
    create: publicProcedure
      .input(createStudentInputSchema)
      .mutation(({ input }) => createStudent(input)),
    getAll: publicProcedure
      .query(() => getStudents()),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getStudent(input.id)),
    update: publicProcedure
      .input(updateStudentInputSchema)
      .mutation(({ input }) => updateStudent(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteStudent(input.id)),
    getByClass: publicProcedure
      .input(z.object({ classId: z.number() }))
      .query(({ input }) => getStudentsByClass(input.classId)),
    getByTeacher: publicProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(({ input }) => getStudentsByTeacher(input.teacherId)),
    getBalance: publicProcedure
      .input(z.object({ studentId: z.number() }))
      .query(({ input }) => getStudentBalance(input.studentId)),
  }),

  // Transaction routes
  transactions: router({
    create: publicProcedure
      .input(createTransactionInputSchema)
      .mutation(({ input }) => createTransaction(input)),
    getAll: publicProcedure
      .input(transactionFilterSchema.optional())
      .query(({ input }) => getTransactions(input)),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getTransaction(input.id)),
    update: publicProcedure
      .input(updateTransactionInputSchema)
      .mutation(({ input }) => updateTransaction(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteTransaction(input.id)),
    getByStudent: publicProcedure
      .input(z.object({ studentId: z.number() }))
      .query(({ input }) => getTransactionsByStudent(input.studentId)),
    getByClass: publicProcedure
      .input(z.object({ classId: z.number() }))
      .query(({ input }) => getTransactionsByClass(input.classId)),
    getByTeacher: publicProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(({ input }) => getTransactionsByTeacher(input.teacherId)),
    getReport: publicProcedure
      .input(transactionFilterSchema.optional())
      .query(({ input }) => getTransactionReport(input)),
  }),

  // Student aspiration routes
  aspirations: router({
    create: publicProcedure
      .input(createStudentAspirationInputSchema)
      .mutation(({ input }) => createStudentAspiration(input)),
    getAll: publicProcedure
      .query(() => getStudentAspirations()),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getStudentAspiration(input.id)),
    update: publicProcedure
      .input(updateStudentAspirationInputSchema)
      .mutation(({ input }) => updateStudentAspiration(input)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteStudentAspiration(input.id)),
    getByStudent: publicProcedure
      .input(z.object({ studentId: z.number() }))
      .query(({ input }) => getAspirationsByStudent(input.studentId)),
    getByClass: publicProcedure
      .input(z.object({ classId: z.number() }))
      .query(({ input }) => getAspirationsByClass(input.classId)),
    getByTeacher: publicProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(({ input }) => getAspirationsByTeacher(input.teacherId)),
  }),

  // Leaderboard routes
  leaderboards: router({
    students: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => getStudentLeaderboard(input.limit)),
    classes: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => getClassLeaderboard(input.limit)),
    studentsByClass: publicProcedure
      .input(z.object({ classId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getStudentLeaderboardByClass(input.classId, input.limit)),
    studentsByTeacher: publicProcedure
      .input(z.object({ teacherId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getStudentLeaderboardByTeacher(input.teacherId, input.limit)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();