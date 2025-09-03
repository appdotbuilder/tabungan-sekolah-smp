import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { 
  transactionsTable, 
  studentsTable, 
  classesTable, 
  teachersTable 
} from '../db/schema';
import { 
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionFilter
} from '../schema';
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
} from '../handlers/transaction_handlers';

describe('Transaction Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let teacherId: number;
  let classId: number;
  let studentId1: number;
  let studentId2: number;

  beforeEach(async () => {
    // Create prerequisite data
    // Create teacher
    const teacher = await db.insert(teachersTable)
      .values({
        name: 'Test Teacher',
        email: 'teacher@test.com',
        role: 'homeroom_teacher'
      })
      .returning()
      .execute();
    teacherId = teacher[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        homeroom_teacher_id: teacherId
      })
      .returning()
      .execute();
    classId = classResult[0].id;

    // Create students
    const student1 = await db.insert(studentsTable)
      .values({
        name: 'Student One',
        gender: 'male',
        nisn: '1234567890',
        nis: '12345',
        class_id: classId,
        phone: '081234567890',
        email: 'student1@test.com',
        status: 'active'
      })
      .returning()
      .execute();
    studentId1 = student1[0].id;

    const student2 = await db.insert(studentsTable)
      .values({
        name: 'Student Two',
        gender: 'female',
        nisn: '0987654321',
        nis: '54321',
        class_id: classId,
        phone: '089876543210',
        email: 'student2@test.com',
        status: 'active'
      })
      .returning()
      .execute();
    studentId2 = student2[0].id;
  });

  describe('createTransaction', () => {
    const testInput: CreateTransactionInput = {
      date: new Date('2023-12-01'),
      type: 'deposit',
      amount: 50000,
      notes: 'Initial deposit',
      student_id: 0 // Will be set in test
    };

    it('should create a transaction successfully', async () => {
      const input = { ...testInput, student_id: studentId1 };
      const result = await createTransaction(input);

      expect(result.id).toBeDefined();
      expect(result.date).toEqual(input.date);
      expect(result.type).toEqual(input.type);
      expect(result.amount).toEqual(50000);
      expect(typeof result.amount).toBe('number');
      expect(result.notes).toEqual(input.notes);
      expect(result.student_id).toEqual(studentId1);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save transaction to database', async () => {
      const input = { ...testInput, student_id: studentId1 };
      const result = await createTransaction(input);

      const dbTransaction = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, result.id))
        .execute();

      expect(dbTransaction).toHaveLength(1);
      expect(dbTransaction[0].type).toEqual('deposit');
      expect(parseFloat(dbTransaction[0].amount)).toEqual(50000);
      expect(dbTransaction[0].student_id).toEqual(studentId1);
    });

    it('should throw error for non-existent student', async () => {
      const input = { ...testInput, student_id: 99999 };
      
      await expect(createTransaction(input)).rejects.toThrow(/Student with id 99999 not found/i);
    });

    it('should handle withdrawal transaction', async () => {
      const input: CreateTransactionInput = {
        date: new Date('2023-12-01'),
        type: 'withdrawal',
        amount: 25000,
        notes: 'School fee payment',
        student_id: studentId1
      };

      const result = await createTransaction(input);

      expect(result.type).toEqual('withdrawal');
      expect(result.amount).toEqual(25000);
      expect(result.notes).toEqual('School fee payment');
    });
  });

  describe('getTransactions', () => {
    beforeEach(async () => {
      // Create test transactions
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Deposit 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-02'),
        type: 'withdrawal',
        amount: 25000,
        notes: 'Withdrawal 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-03'),
        type: 'deposit',
        amount: 30000,
        notes: 'Deposit 2',
        student_id: studentId2
      });
    });

    it('should get all transactions without filter', async () => {
      const results = await getTransactions();

      expect(results).toHaveLength(3);
      results.forEach(transaction => {
        expect(typeof transaction.amount).toBe('number');
        expect(transaction.created_at).toBeInstanceOf(Date);
      });
    });

    it('should filter by student_id', async () => {
      const filter: TransactionFilter = { student_id: studentId1 };
      const results = await getTransactions(filter);

      expect(results).toHaveLength(2);
      results.forEach(transaction => {
        expect(transaction.student_id).toEqual(studentId1);
        expect(typeof transaction.amount).toBe('number');
      });
    });

    it('should filter by class_id', async () => {
      const filter: TransactionFilter = { class_id: classId };
      const results = await getTransactions(filter);

      expect(results).toHaveLength(3); // All transactions belong to students in the same class
      results.forEach(transaction => {
        expect(typeof transaction.amount).toBe('number');
      });
    });

    it('should filter by date range', async () => {
      const filter: TransactionFilter = {
        start_date: new Date('2023-12-01'),
        end_date: new Date('2023-12-02')
      };
      const results = await getTransactions(filter);

      expect(results).toHaveLength(2); // First two transactions
      results.forEach(transaction => {
        expect(transaction.date >= filter.start_date!).toBe(true);
        expect(transaction.date <= filter.end_date!).toBe(true);
      });
    });

    it('should filter by transaction type', async () => {
      const filter: TransactionFilter = { type: 'deposit' };
      const results = await getTransactions(filter);

      expect(results).toHaveLength(2); // Two deposit transactions
      results.forEach(transaction => {
        expect(transaction.type).toEqual('deposit');
      });
    });

    it('should handle multiple filters', async () => {
      const filter: TransactionFilter = {
        student_id: studentId1,
        type: 'deposit',
        start_date: new Date('2023-12-01'),
        end_date: new Date('2023-12-01')
      };
      const results = await getTransactions(filter);

      expect(results).toHaveLength(1);
      expect(results[0].student_id).toEqual(studentId1);
      expect(results[0].type).toEqual('deposit');
    });
  });

  describe('getTransaction', () => {
    let transactionId: number;

    beforeEach(async () => {
      const transaction = await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Test transaction',
        student_id: studentId1
      });
      transactionId = transaction.id;
    });

    it('should get transaction by id', async () => {
      const result = await getTransaction(transactionId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(transactionId);
      expect(result!.type).toEqual('deposit');
      expect(result!.amount).toEqual(50000);
      expect(typeof result!.amount).toBe('number');
      expect(result!.student_id).toEqual(studentId1);
    });

    it('should return null for non-existent transaction', async () => {
      const result = await getTransaction(99999);
      expect(result).toBeNull();
    });
  });

  describe('updateTransaction', () => {
    let transactionId: number;

    beforeEach(async () => {
      const transaction = await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Original transaction',
        student_id: studentId1
      });
      transactionId = transaction.id;
    });

    it('should update transaction successfully', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        amount: 75000,
        notes: 'Updated transaction',
        type: 'withdrawal'
      };

      const result = await updateTransaction(updateInput);

      expect(result.id).toEqual(transactionId);
      expect(result.amount).toEqual(75000);
      expect(typeof result.amount).toBe('number');
      expect(result.notes).toEqual('Updated transaction');
      expect(result.type).toEqual('withdrawal');
    });

    it('should update only specified fields', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        notes: 'Only notes updated'
      };

      const result = await updateTransaction(updateInput);

      expect(result.id).toEqual(transactionId);
      expect(result.notes).toEqual('Only notes updated');
      expect(result.amount).toEqual(50000); // Unchanged
      expect(result.type).toEqual('deposit'); // Unchanged
    });

    it('should throw error for non-existent transaction', async () => {
      const updateInput: UpdateTransactionInput = {
        id: 99999,
        amount: 75000
      };

      await expect(updateTransaction(updateInput)).rejects.toThrow(/Transaction with id 99999 not found/i);
    });

    it('should throw error for non-existent student when updating student_id', async () => {
      const updateInput: UpdateTransactionInput = {
        id: transactionId,
        student_id: 99999
      };

      await expect(updateTransaction(updateInput)).rejects.toThrow(/Student with id 99999 not found/i);
    });
  });

  describe('deleteTransaction', () => {
    let transactionId: number;

    beforeEach(async () => {
      const transaction = await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'To be deleted',
        student_id: studentId1
      });
      transactionId = transaction.id;
    });

    it('should delete transaction successfully', async () => {
      await deleteTransaction(transactionId);

      const result = await getTransaction(transactionId);
      expect(result).toBeNull();
    });

    it('should throw error for non-existent transaction', async () => {
      await expect(deleteTransaction(99999)).rejects.toThrow(/Transaction with id 99999 not found/i);
    });
  });

  describe('getTransactionsByStudent', () => {
    beforeEach(async () => {
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Student 1 Deposit',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-02'),
        type: 'withdrawal',
        amount: 25000,
        notes: 'Student 1 Withdrawal',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-03'),
        type: 'deposit',
        amount: 30000,
        notes: 'Student 2 Deposit',
        student_id: studentId2
      });
    });

    it('should get transactions for specific student', async () => {
      const results = await getTransactionsByStudent(studentId1);

      expect(results).toHaveLength(2);
      results.forEach(transaction => {
        expect(transaction.student_id).toEqual(studentId1);
        expect(typeof transaction.amount).toBe('number');
      });
    });

    it('should return empty array for student with no transactions', async () => {
      // Create another student with no transactions
      const newStudent = await db.insert(studentsTable)
        .values({
          name: 'Student Three',
          gender: 'male',
          nisn: '1111111111',
          nis: '11111',
          class_id: classId,
          status: 'active'
        })
        .returning()
        .execute();

      const results = await getTransactionsByStudent(newStudent[0].id);
      expect(results).toHaveLength(0);
    });
  });

  describe('getTransactionsByClass', () => {
    beforeEach(async () => {
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Class transaction 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-02'),
        type: 'deposit',
        amount: 30000,
        notes: 'Class transaction 2',
        student_id: studentId2
      });
    });

    it('should get all transactions for students in a class', async () => {
      const results = await getTransactionsByClass(classId);

      expect(results).toHaveLength(2);
      results.forEach(transaction => {
        expect(typeof transaction.amount).toBe('number');
      });
    });
  });

  describe('getTransactionsByTeacher', () => {
    beforeEach(async () => {
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Teacher class transaction 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-02'),
        type: 'deposit',
        amount: 30000,
        notes: 'Teacher class transaction 2',
        student_id: studentId2
      });
    });

    it('should get all transactions for teacher homeroom class', async () => {
      const results = await getTransactionsByTeacher(teacherId);

      expect(results).toHaveLength(2);
      results.forEach(transaction => {
        expect(typeof transaction.amount).toBe('number');
      });
    });

    it('should return empty array for teacher with no homeroom class', async () => {
      // Create teacher without homeroom class
      const newTeacher = await db.insert(teachersTable)
        .values({
          name: 'Non-Homeroom Teacher',
          email: 'nonhomeroom@test.com',
          role: 'other'
        })
        .returning()
        .execute();

      const results = await getTransactionsByTeacher(newTeacher[0].id);
      expect(results).toHaveLength(0);
    });
  });

  describe('getTransactionReport', () => {
    beforeEach(async () => {
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 50000,
        notes: 'Report transaction 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-02'),
        type: 'withdrawal',
        amount: 25000,
        notes: 'Report transaction 2',
        student_id: studentId2
      });
    });

    it('should generate transaction report with student and class info', async () => {
      const results = await getTransactionReport();

      expect(results).toHaveLength(2);
      results.forEach(report => {
        expect(report.transaction_id).toBeDefined();
        expect(report.student_name).toBeDefined();
        expect(report.class_name).toBeDefined();
        expect(typeof report.amount).toBe('number');
        expect(report.date).toBeInstanceOf(Date);
      });

      // Check specific values
      const firstReport = results.find(r => r.type === 'deposit');
      expect(firstReport).toBeDefined();
      expect(firstReport!.student_name).toEqual('Student One');
      expect(firstReport!.class_name).toEqual('Test Class');
      expect(firstReport!.amount).toEqual(50000);
    });

    it('should filter report by student_id', async () => {
      const filter: TransactionFilter = { student_id: studentId1 };
      const results = await getTransactionReport(filter);

      expect(results).toHaveLength(1);
      expect(results[0].student_name).toEqual('Student One');
    });

    it('should filter report by type', async () => {
      const filter: TransactionFilter = { type: 'deposit' };
      const results = await getTransactionReport(filter);

      expect(results).toHaveLength(1);
      expect(results[0].type).toEqual('deposit');
      expect(results[0].amount).toEqual(50000);
    });
  });

  describe('getStudentBalance', () => {
    beforeEach(async () => {
      // Create transactions for balance calculation
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 100000,
        notes: 'Deposit 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-02'),
        type: 'deposit',
        amount: 50000,
        notes: 'Deposit 2',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-03'),
        type: 'withdrawal',
        amount: 30000,
        notes: 'Withdrawal 1',
        student_id: studentId1
      });

      await createTransaction({
        date: new Date('2023-12-04'),
        type: 'withdrawal',
        amount: 20000,
        notes: 'Withdrawal 2',
        student_id: studentId1
      });
    });

    it('should calculate student balance correctly', async () => {
      const balance = await getStudentBalance(studentId1);

      // Expected: (100000 + 50000) - (30000 + 20000) = 100000
      expect(balance).toEqual(100000);
      expect(typeof balance).toBe('number');
    });

    it('should return 0 for student with no transactions', async () => {
      const balance = await getStudentBalance(studentId2);
      expect(balance).toEqual(0);
    });

    it('should handle negative balance', async () => {
      await createTransaction({
        date: new Date('2023-12-05'),
        type: 'withdrawal',
        amount: 150000,
        notes: 'Large withdrawal',
        student_id: studentId1
      });

      const balance = await getStudentBalance(studentId1);

      // Expected: 150000 - 200000 = -50000
      expect(balance).toEqual(-50000);
    });

    it('should throw error for non-existent student', async () => {
      await expect(getStudentBalance(99999)).rejects.toThrow(/Student with id 99999 not found/i);
    });

    it('should handle only deposits', async () => {
      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'deposit',
        amount: 75000,
        notes: 'Only deposit',
        student_id: studentId2
      });

      const balance = await getStudentBalance(studentId2);
      expect(balance).toEqual(75000);
    });

    it('should handle only withdrawals', async () => {
      // Create new student for this test
      const newStudent = await db.insert(studentsTable)
        .values({
          name: 'Student Three',
          gender: 'male',
          nisn: '2222222222',
          nis: '22222',
          class_id: classId,
          status: 'active'
        })
        .returning()
        .execute();

      await createTransaction({
        date: new Date('2023-12-01'),
        type: 'withdrawal',
        amount: 25000,
        notes: 'Only withdrawal',
        student_id: newStudent[0].id
      });

      const balance = await getStudentBalance(newStudent[0].id);
      expect(balance).toEqual(-25000);
    });
  });
});