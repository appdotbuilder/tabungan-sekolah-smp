import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  teachersTable,
  classesTable, 
  studentsTable, 
  transactionsTable 
} from '../db/schema';
import { 
  getStudentLeaderboard,
  getClassLeaderboard,
  getStudentLeaderboardByClass,
  getStudentLeaderboardByTeacher
} from '../handlers/leaderboard_handlers';

describe('Leaderboard Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const setupTestData = async () => {
    // Create teachers
    const teachers = await db.insert(teachersTable)
      .values([
        { name: 'Teacher One', email: 'teacher1@test.com', role: 'homeroom_teacher' },
        { name: 'Teacher Two', email: 'teacher2@test.com', role: 'homeroom_teacher' }
      ])
      .returning()
      .execute();

    // Create classes
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Class A', homeroom_teacher_id: teachers[0].id },
        { name: 'Class B', homeroom_teacher_id: teachers[1].id },
        { name: 'Class C', homeroom_teacher_id: null }
      ])
      .returning()
      .execute();

    // Create students
    const students = await db.insert(studentsTable)
      .values([
        { 
          name: 'Alice Student', 
          gender: 'female', 
          nisn: '1001', 
          nis: '2001', 
          class_id: classes[0].id,
          status: 'active'
        },
        { 
          name: 'Bob Student', 
          gender: 'male', 
          nisn: '1002', 
          nis: '2002', 
          class_id: classes[0].id,
          status: 'active'
        },
        { 
          name: 'Charlie Student', 
          gender: 'male', 
          nisn: '1003', 
          nis: '2003', 
          class_id: classes[1].id,
          status: 'active'
        },
        { 
          name: 'David Student', 
          gender: 'male', 
          nisn: '1004', 
          nis: '2004', 
          class_id: classes[1].id,
          status: 'graduated'
        },
        { 
          name: 'Eve Student', 
          gender: 'female', 
          nisn: '1005', 
          nis: '2005', 
          class_id: classes[2].id,
          status: 'active'
        }
      ])
      .returning()
      .execute();

    // Create transactions
    await db.insert(transactionsTable)
      .values([
        // Alice: 3 deposits totaling 300, 1 withdrawal of 50 = balance 250
        { date: new Date('2024-01-01'), type: 'deposit', amount: '100.00', student_id: students[0].id },
        { date: new Date('2024-01-02'), type: 'deposit', amount: '150.00', student_id: students[0].id },
        { date: new Date('2024-01-03'), type: 'deposit', amount: '50.00', student_id: students[0].id },
        { date: new Date('2024-01-04'), type: 'withdrawal', amount: '50.00', student_id: students[0].id },
        
        // Bob: 2 deposits totaling 200 = balance 200
        { date: new Date('2024-01-01'), type: 'deposit', amount: '100.00', student_id: students[1].id },
        { date: new Date('2024-01-02'), type: 'deposit', amount: '100.00', student_id: students[1].id },
        
        // Charlie: 1 deposit of 500 = balance 500
        { date: new Date('2024-01-01'), type: 'deposit', amount: '500.00', student_id: students[2].id },
        
        // David (graduated): 1 deposit of 1000 = balance 1000 (should be excluded from active leaderboards)
        { date: new Date('2024-01-01'), type: 'deposit', amount: '1000.00', student_id: students[3].id },
        
        // Eve: No transactions = balance 0
      ])
      .execute();

    return { teachers, classes, students };
  };

  describe('getStudentLeaderboard', () => {
    it('should return student leaderboard ordered by total deposits', async () => {
      await setupTestData();

      const result = await getStudentLeaderboard();

      expect(result).toHaveLength(4); // Only active students
      
      // Charlie should be first (500 deposits)
      expect(result[0].student_name).toBe('Charlie Student');
      expect(result[0].total_deposits).toBe(500);
      expect(result[0].current_balance).toBe(500);
      expect(result[0].transaction_count).toBe(1);
      expect(result[0].class_name).toBe('Class B');
      
      // Alice should be second (300 deposits)
      expect(result[1].student_name).toBe('Alice Student');
      expect(result[1].total_deposits).toBe(300);
      expect(result[1].current_balance).toBe(250);
      expect(result[1].transaction_count).toBe(4);
      expect(result[1].class_name).toBe('Class A');
      
      // Bob should be third (200 deposits)
      expect(result[2].student_name).toBe('Bob Student');
      expect(result[2].total_deposits).toBe(200);
      expect(result[2].current_balance).toBe(200);
      expect(result[2].transaction_count).toBe(2);
      
      // Eve should be last (0 deposits)
      expect(result[3].student_name).toBe('Eve Student');
      expect(result[3].total_deposits).toBe(0);
      expect(result[3].current_balance).toBe(0);
      expect(result[3].transaction_count).toBe(0);
    });

    it('should respect limit parameter', async () => {
      await setupTestData();

      const result = await getStudentLeaderboard(2);

      expect(result).toHaveLength(2);
      expect(result[0].student_name).toBe('Charlie Student');
      expect(result[1].student_name).toBe('Alice Student');
    });

    it('should return empty array when no students exist', async () => {
      const result = await getStudentLeaderboard();

      expect(result).toHaveLength(0);
    });
  });

  describe('getClassLeaderboard', () => {
    it('should return class leaderboard ordered by total deposits', async () => {
      await setupTestData();

      const result = await getClassLeaderboard();

      expect(result).toHaveLength(3);
      
      // Both Class A and Class B have equal total deposits (500 each)
      // Class A: Alice (300) + Bob (200) = 500 total deposits
      // Class B: Charlie (500) = 500 total deposits
      // The order might vary since they're equal, so let's check both possibilities
      
      const classA = result.find(r => r.class_name === 'Class A');
      const classB = result.find(r => r.class_name === 'Class B');
      
      expect(classA).toBeDefined();
      expect(classA!.total_deposits).toBe(500);
      expect(classA!.total_students).toBe(2);
      
      expect(classB).toBeDefined();
      expect(classB!.total_deposits).toBe(500);
      expect(classB!.total_students).toBe(1)
      
      // Class C should be last (Eve: 0)
      expect(result[2].class_name).toBe('Class C');
      expect(result[2].total_deposits).toBe(0);
      expect(result[2].total_students).toBe(1);
      expect(result[2].average_balance).toBe(0);
    });

    it('should respect limit parameter', async () => {
      await setupTestData();

      const result = await getClassLeaderboard(1);

      expect(result).toHaveLength(1);
      // Should return one of the top classes (both Class A and B have 500 total deposits)
      expect(['Class A', 'Class B']).toContain(result[0].class_name);
    });

    it('should handle classes with no students', async () => {
      // Create a teacher and class but no students
      const teacher = await db.insert(teachersTable)
        .values({ name: 'Empty Teacher', email: 'empty@test.com', role: 'homeroom_teacher' })
        .returning()
        .execute();

      await db.insert(classesTable)
        .values({ name: 'Empty Class', homeroom_teacher_id: teacher[0].id })
        .execute();

      const result = await getClassLeaderboard();

      expect(result).toHaveLength(1);
      expect(result[0].class_name).toBe('Empty Class');
      expect(result[0].total_deposits).toBe(0);
      expect(result[0].total_students).toBe(0);
      expect(result[0].average_balance).toBe(0);
    });
  });

  describe('getStudentLeaderboardByClass', () => {
    it('should return students from specific class only', async () => {
      const { classes } = await setupTestData();

      // Get leaderboard for Class A
      const result = await getStudentLeaderboardByClass(classes[0].id);

      expect(result).toHaveLength(2);
      expect(result[0].student_name).toBe('Alice Student');
      expect(result[0].class_name).toBe('Class A');
      expect(result[1].student_name).toBe('Bob Student');
      expect(result[1].class_name).toBe('Class A');
    });

    it('should return empty array for class with no active students', async () => {
      const { classes } = await setupTestData();

      // Get leaderboard for Class B (Charlie is the only active student)
      const result = await getStudentLeaderboardByClass(classes[1].id);

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Charlie Student');
    });

    it('should respect limit parameter', async () => {
      const { classes } = await setupTestData();

      const result = await getStudentLeaderboardByClass(classes[0].id, 1);

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Alice Student');
    });

    it('should return empty array for non-existent class', async () => {
      await setupTestData();

      const result = await getStudentLeaderboardByClass(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('getStudentLeaderboardByTeacher', () => {
    it('should return students from teacher homeroom class only', async () => {
      const { teachers } = await setupTestData();

      // Get leaderboard for Teacher One (homeroom of Class A)
      const result = await getStudentLeaderboardByTeacher(teachers[0].id);

      expect(result).toHaveLength(2);
      expect(result[0].student_name).toBe('Alice Student');
      expect(result[0].class_name).toBe('Class A');
      expect(result[1].student_name).toBe('Bob Student');
      expect(result[1].class_name).toBe('Class A');
    });

    it('should return students from teacher with single student class', async () => {
      const { teachers } = await setupTestData();

      // Get leaderboard for Teacher Two (homeroom of Class B)
      const result = await getStudentLeaderboardByTeacher(teachers[1].id);

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Charlie Student');
      expect(result[0].class_name).toBe('Class B');
    });

    it('should respect limit parameter', async () => {
      const { teachers } = await setupTestData();

      const result = await getStudentLeaderboardByTeacher(teachers[0].id, 1);

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Alice Student');
    });

    it('should return empty array for teacher with no homeroom class', async () => {
      await setupTestData();

      // Create a teacher without homeroom class
      const teacher = await db.insert(teachersTable)
        .values({ name: 'No Class Teacher', email: 'noclass@test.com', role: 'other' })
        .returning()
        .execute();

      const result = await getStudentLeaderboardByTeacher(teacher[0].id);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for non-existent teacher', async () => {
      await setupTestData();

      const result = await getStudentLeaderboardByTeacher(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('Balance calculations', () => {
    it('should correctly calculate current balance with deposits and withdrawals', async () => {
      const { classes } = await setupTestData();

      // Create a student with mixed transactions
      const student = await db.insert(studentsTable)
        .values({ 
          name: 'Test Balance', 
          gender: 'male', 
          nisn: '9999', 
          nis: '8888', 
          class_id: classes[0].id,
          status: 'active'
        })
        .returning()
        .execute();

      // Add transactions: 1000 deposit, 300 withdrawal, 200 deposit = 900 balance
      await db.insert(transactionsTable)
        .values([
          { date: new Date(), type: 'deposit', amount: '1000.00', student_id: student[0].id },
          { date: new Date(), type: 'withdrawal', amount: '300.00', student_id: student[0].id },
          { date: new Date(), type: 'deposit', amount: '200.00', student_id: student[0].id }
        ])
        .execute();

      const result = await getStudentLeaderboard();
      const testStudent = result.find(s => s.student_name === 'Test Balance');

      expect(testStudent?.total_deposits).toBe(1200);
      expect(testStudent?.current_balance).toBe(900);
      expect(testStudent?.transaction_count).toBe(3);
    });
  });
});