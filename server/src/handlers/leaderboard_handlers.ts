import { db } from '../db';
import { 
  studentsTable, 
  classesTable, 
  transactionsTable,
  teachersTable
} from '../db/schema';
import { 
  type StudentLeaderboard, 
  type ClassLeaderboard 
} from '../schema';
import { sql, eq, desc, and, sum, count, avg } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getStudentLeaderboard(limit?: number): Promise<StudentLeaderboard[]> {
  try {
    const baseQuery = db.select({
      student_id: studentsTable.id,
      student_name: studentsTable.name,
      class_name: classesTable.name,
      total_deposits: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`),
      transaction_count: count(transactionsTable.id),
      current_balance: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else -${transactionsTable.amount} end`)
    })
    .from(studentsTable)
    .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
    .leftJoin(transactionsTable, eq(studentsTable.id, transactionsTable.student_id))
    .where(eq(studentsTable.status, 'active'))
    .groupBy(studentsTable.id, studentsTable.name, classesTable.name)
    .orderBy(desc(sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`)));

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const results = await query.execute();

    return results.map(result => ({
      student_id: result.student_id,
      student_name: result.student_name,
      class_name: result.class_name,
      total_deposits: parseFloat(result.total_deposits || '0'),
      transaction_count: result.transaction_count || 0,
      current_balance: parseFloat(result.current_balance || '0')
    }));
  } catch (error) {
    console.error('Student leaderboard retrieval failed:', error);
    throw error;
  }
}

export async function getClassLeaderboard(limit?: number): Promise<ClassLeaderboard[]> {
  try {
    const baseQuery = db.select({
      class_id: classesTable.id,
      class_name: classesTable.name,
      total_deposits: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`),
      total_students: count(sql`distinct case when ${studentsTable.status} = 'active' then ${studentsTable.id} end`),
      average_balance: avg(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else -${transactionsTable.amount} end`)
    })
    .from(classesTable)
    .leftJoin(studentsTable, eq(classesTable.id, studentsTable.class_id))
    .leftJoin(transactionsTable, and(
      eq(studentsTable.id, transactionsTable.student_id),
      eq(studentsTable.status, 'active')
    ))
    .groupBy(classesTable.id, classesTable.name)
    .orderBy(desc(sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`)));

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const results = await query.execute();

    return results.map(result => ({
      class_id: result.class_id,
      class_name: result.class_name,
      total_deposits: parseFloat(result.total_deposits || '0'),
      total_students: result.total_students || 0,
      average_balance: parseFloat(result.average_balance || '0')
    }));
  } catch (error) {
    console.error('Class leaderboard retrieval failed:', error);
    throw error;
  }
}

export async function getStudentLeaderboardByClass(classId: number, limit?: number): Promise<StudentLeaderboard[]> {
  try {
    const baseQuery = db.select({
      student_id: studentsTable.id,
      student_name: studentsTable.name,
      class_name: classesTable.name,
      total_deposits: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`),
      transaction_count: count(transactionsTable.id),
      current_balance: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else -${transactionsTable.amount} end`)
    })
    .from(studentsTable)
    .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
    .leftJoin(transactionsTable, eq(studentsTable.id, transactionsTable.student_id))
    .where(and(
      eq(studentsTable.class_id, classId),
      eq(studentsTable.status, 'active')
    ))
    .groupBy(studentsTable.id, studentsTable.name, classesTable.name)
    .orderBy(desc(sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`)));

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const results = await query.execute();

    return results.map(result => ({
      student_id: result.student_id,
      student_name: result.student_name,
      class_name: result.class_name,
      total_deposits: parseFloat(result.total_deposits || '0'),
      transaction_count: result.transaction_count || 0,
      current_balance: parseFloat(result.current_balance || '0')
    }));
  } catch (error) {
    console.error('Student leaderboard by class retrieval failed:', error);
    throw error;
  }
}

export async function getStudentLeaderboardByTeacher(teacherId: number, limit?: number): Promise<StudentLeaderboard[]> {
  try {
    const baseQuery = db.select({
      student_id: studentsTable.id,
      student_name: studentsTable.name,
      class_name: classesTable.name,
      total_deposits: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`),
      transaction_count: count(transactionsTable.id),
      current_balance: sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else -${transactionsTable.amount} end`)
    })
    .from(studentsTable)
    .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
    .leftJoin(transactionsTable, eq(studentsTable.id, transactionsTable.student_id))
    .where(and(
      eq(classesTable.homeroom_teacher_id, teacherId),
      eq(studentsTable.status, 'active')
    ))
    .groupBy(studentsTable.id, studentsTable.name, classesTable.name)
    .orderBy(desc(sum(sql`case when ${transactionsTable.type} = 'deposit' then ${transactionsTable.amount} else 0 end`)));

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const results = await query.execute();

    return results.map(result => ({
      student_id: result.student_id,
      student_name: result.student_name,
      class_name: result.class_name,
      total_deposits: parseFloat(result.total_deposits || '0'),
      transaction_count: result.transaction_count || 0,
      current_balance: parseFloat(result.current_balance || '0')
    }));
  } catch (error) {
    console.error('Student leaderboard by teacher retrieval failed:', error);
    throw error;
  }
}