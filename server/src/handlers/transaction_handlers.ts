import { db } from '../db';
import { 
  transactionsTable, 
  studentsTable, 
  classesTable,
  teachersTable 
} from '../db/schema';
import { 
  type CreateTransactionInput, 
  type UpdateTransactionInput, 
  type Transaction, 
  type TransactionFilter,
  type TransactionReport 
} from '../schema';
import { eq, and, gte, lte, sum, SQL } from 'drizzle-orm';

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();
    
    if (student.length === 0) {
      throw new Error(`Student with id ${input.student_id} not found`);
    }

    const result = await db.insert(transactionsTable)
      .values({
        date: input.date,
        type: input.type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        notes: input.notes,
        student_id: input.student_id
      })
      .returning()
      .execute();

    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
}

export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  try {
    // Build query based on whether we need to join with students table
    let baseQuery;
    const conditions: SQL<unknown>[] = [];

    if (filter?.class_id) {
      // Need to join with students table to filter by class
      baseQuery = db.select()
        .from(transactionsTable)
        .innerJoin(studentsTable, eq(transactionsTable.student_id, studentsTable.id));
      conditions.push(eq(studentsTable.class_id, filter.class_id));
    } else {
      // Simple query without join
      baseQuery = db.select().from(transactionsTable);
    }

    if (filter?.student_id) {
      conditions.push(eq(transactionsTable.student_id, filter.student_id));
    }

    if (filter?.start_date) {
      conditions.push(gte(transactionsTable.date, filter.start_date));
    }

    if (filter?.end_date) {
      conditions.push(lte(transactionsTable.date, filter.end_date));
    }

    if (filter?.type) {
      conditions.push(eq(transactionsTable.type, filter.type));
    }

    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Handle different result structures based on join
    return results.map(result => {
      const transactionData = filter?.class_id 
        ? (result as any).transactions 
        : result;

      return {
        ...transactionData,
        amount: parseFloat(transactionData.amount)
      };
    });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const transaction = results[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount)
    };
  } catch (error) {
    console.error('Failed to get transaction:', error);
    throw error;
  }
}

export async function updateTransaction(input: UpdateTransactionInput): Promise<Transaction> {
  try {
    // Verify transaction exists
    const existingTransaction = await getTransaction(input.id);
    if (!existingTransaction) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    // Verify student exists if student_id is being updated
    if (input.student_id && input.student_id !== existingTransaction.student_id) {
      const student = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, input.student_id))
        .execute();
      
      if (student.length === 0) {
        throw new Error(`Student with id ${input.student_id} not found`);
      }
    }

    const updateData: any = {};
    if (input.date !== undefined) updateData.date = input.date;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.amount !== undefined) updateData.amount = input.amount.toString();
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.student_id !== undefined) updateData.student_id = input.student_id;

    const results = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    const transaction = results[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount)
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
}

export async function deleteTransaction(id: number): Promise<void> {
  try {
    // Verify transaction exists
    const existingTransaction = await getTransaction(id);
    if (!existingTransaction) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
}

export async function getTransactionsByStudent(studentId: number): Promise<Transaction[]> {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.student_id, studentId))
      .execute();

    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Failed to get transactions by student:', error);
    throw error;
  }
}

export async function getTransactionsByClass(classId: number): Promise<Transaction[]> {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .innerJoin(studentsTable, eq(transactionsTable.student_id, studentsTable.id))
      .where(eq(studentsTable.class_id, classId))
      .execute();

    return results.map(result => ({
      ...result.transactions,
      amount: parseFloat(result.transactions.amount)
    }));
  } catch (error) {
    console.error('Failed to get transactions by class:', error);
    throw error;
  }
}

export async function getTransactionsByTeacher(teacherId: number): Promise<Transaction[]> {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .innerJoin(studentsTable, eq(transactionsTable.student_id, studentsTable.id))
      .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
      .where(eq(classesTable.homeroom_teacher_id, teacherId))
      .execute();

    return results.map(result => ({
      ...result.transactions,
      amount: parseFloat(result.transactions.amount)
    }));
  } catch (error) {
    console.error('Failed to get transactions by teacher:', error);
    throw error;
  }
}

export async function getTransactionReport(filter?: TransactionFilter): Promise<TransactionReport[]> {
  try {
    let query = db.select({
      transaction_id: transactionsTable.id,
      date: transactionsTable.date,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      notes: transactionsTable.notes,
      student_name: studentsTable.name,
      class_name: classesTable.name
    })
    .from(transactionsTable)
    .innerJoin(studentsTable, eq(transactionsTable.student_id, studentsTable.id))
    .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id));

    const conditions: SQL<unknown>[] = [];

    if (filter?.student_id) {
      conditions.push(eq(transactionsTable.student_id, filter.student_id));
    }

    if (filter?.class_id) {
      conditions.push(eq(studentsTable.class_id, filter.class_id));
    }

    if (filter?.start_date) {
      conditions.push(gte(transactionsTable.date, filter.start_date));
    }

    if (filter?.end_date) {
      conditions.push(lte(transactionsTable.date, filter.end_date));
    }

    if (filter?.type) {
      conditions.push(eq(transactionsTable.type, filter.type));
    }

    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    const results = await finalQuery.execute();

    return results.map(result => ({
      ...result,
      amount: parseFloat(result.amount)
    }));
  } catch (error) {
    console.error('Failed to generate transaction report:', error);
    throw error;
  }
}

export async function getStudentBalance(studentId: number): Promise<number> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();
    
    if (student.length === 0) {
      throw new Error(`Student with id ${studentId} not found`);
    }

    // Get sum of deposits
    const depositsResult = await db.select({
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.student_id, studentId),
        eq(transactionsTable.type, 'deposit')
      )
    )
    .execute();

    // Get sum of withdrawals
    const withdrawalsResult = await db.select({
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.student_id, studentId),
        eq(transactionsTable.type, 'withdrawal')
      )
    )
    .execute();

    const totalDeposits = depositsResult[0]?.total ? parseFloat(depositsResult[0].total) : 0;
    const totalWithdrawals = withdrawalsResult[0]?.total ? parseFloat(withdrawalsResult[0].total) : 0;

    return totalDeposits - totalWithdrawals;
  } catch (error) {
    console.error('Failed to calculate student balance:', error);
    throw error;
  }
}