import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  studentAspirationsTable, 
  teachersTable, 
  classesTable, 
  studentsTable 
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type CreateStudentAspirationInput,
  type UpdateStudentAspirationInput
} from '../schema';
import { 
  createStudentAspiration,
  getStudentAspirations,
  getStudentAspiration,
  updateStudentAspiration,
  deleteStudentAspiration,
  getAspirationsByStudent,
  getAspirationsByClass,
  getAspirationsByTeacher
} from '../handlers/aspiration_handlers';

// Test data
const testTeacher = {
  name: 'Teacher Test',
  email: 'teacher@test.com',
  role: 'homeroom_teacher' as const
};

const testClass = {
  name: 'Class 10A'
};

const testStudent = {
  name: 'Student Test',
  gender: 'male' as const,
  nisn: '1234567890',
  nis: '123456',
  phone: '+62123456789',
  email: 'student@test.com',
  bank_name: 'Bank Test',
  account_number: '1234567890',
  status: 'active' as const
};

const testAspirationInput: CreateStudentAspirationInput = {
  description: 'Save for new laptop',
  target_amount: 15000000,
  student_id: 0 // Will be set after creating student
};

describe('Student Aspiration Handlers', () => {
  let teacherId: number;
  let classId: number;
  let studentId: number;

  beforeEach(async () => {
    await createDB();

    // Create prerequisite data
    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();
    teacherId = teacherResult[0].id;

    const classResult = await db.insert(classesTable)
      .values({
        ...testClass,
        homeroom_teacher_id: teacherId
      })
      .returning()
      .execute();
    classId = classResult[0].id;

    const studentResult = await db.insert(studentsTable)
      .values({
        ...testStudent,
        class_id: classId
      })
      .returning()
      .execute();
    studentId = studentResult[0].id;

    testAspirationInput.student_id = studentId;
  });

  afterEach(resetDB);

  describe('createStudentAspiration', () => {
    it('should create a student aspiration', async () => {
      const result = await createStudentAspiration(testAspirationInput);

      expect(result.description).toEqual('Save for new laptop');
      expect(result.target_amount).toEqual(15000000);
      expect(typeof result.target_amount).toBe('number');
      expect(result.student_id).toEqual(studentId);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save aspiration to database', async () => {
      const result = await createStudentAspiration(testAspirationInput);

      const aspirations = await db.select()
        .from(studentAspirationsTable)
        .where(eq(studentAspirationsTable.id, result.id))
        .execute();

      expect(aspirations).toHaveLength(1);
      expect(aspirations[0].description).toEqual('Save for new laptop');
      expect(parseFloat(aspirations[0].target_amount)).toEqual(15000000);
      expect(aspirations[0].student_id).toEqual(studentId);
      expect(aspirations[0].created_at).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent student', async () => {
      const invalidInput = {
        ...testAspirationInput,
        student_id: 99999
      };

      await expect(createStudentAspiration(invalidInput))
        .rejects.toThrow(/Student with ID 99999 not found/i);
    });
  });

  describe('getStudentAspirations', () => {
    it('should return all student aspirations', async () => {
      // Create multiple aspirations
      await createStudentAspiration(testAspirationInput);
      await createStudentAspiration({
        ...testAspirationInput,
        description: 'Save for vacation',
        target_amount: 5000000
      });

      const results = await getStudentAspirations();

      expect(results).toHaveLength(2);
      expect(results[0].target_amount).toEqual(15000000);
      expect(typeof results[0].target_amount).toBe('number');
      expect(results[1].target_amount).toEqual(5000000);
      expect(typeof results[1].target_amount).toBe('number');
    });

    it('should return empty array when no aspirations exist', async () => {
      const results = await getStudentAspirations();
      expect(results).toHaveLength(0);
    });
  });

  describe('getStudentAspiration', () => {
    it('should return specific student aspiration', async () => {
      const created = await createStudentAspiration(testAspirationInput);
      const result = await getStudentAspiration(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.description).toEqual('Save for new laptop');
      expect(result!.target_amount).toEqual(15000000);
      expect(typeof result!.target_amount).toBe('number');
      expect(result!.student_id).toEqual(studentId);
    });

    it('should return null for non-existent aspiration', async () => {
      const result = await getStudentAspiration(99999);
      expect(result).toBeNull();
    });
  });

  describe('updateStudentAspiration', () => {
    it('should update student aspiration', async () => {
      const created = await createStudentAspiration(testAspirationInput);
      
      const updateInput: UpdateStudentAspirationInput = {
        id: created.id,
        description: 'Save for gaming setup',
        target_amount: 20000000
      };

      const result = await updateStudentAspiration(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.description).toEqual('Save for gaming setup');
      expect(result.target_amount).toEqual(20000000);
      expect(typeof result.target_amount).toBe('number');
      expect(result.student_id).toEqual(studentId);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should update only specified fields', async () => {
      const created = await createStudentAspiration(testAspirationInput);
      
      const updateInput: UpdateStudentAspirationInput = {
        id: created.id,
        description: 'Updated description'
      };

      const result = await updateStudentAspiration(updateInput);

      expect(result.description).toEqual('Updated description');
      expect(result.target_amount).toEqual(15000000); // Should remain unchanged
      expect(result.student_id).toEqual(studentId); // Should remain unchanged
    });

    it('should throw error for non-existent aspiration', async () => {
      const updateInput: UpdateStudentAspirationInput = {
        id: 99999,
        description: 'Updated description'
      };

      await expect(updateStudentAspiration(updateInput))
        .rejects.toThrow(/Student aspiration with ID 99999 not found/i);
    });

    it('should throw error when updating to non-existent student', async () => {
      const created = await createStudentAspiration(testAspirationInput);
      
      const updateInput: UpdateStudentAspirationInput = {
        id: created.id,
        student_id: 99999
      };

      await expect(updateStudentAspiration(updateInput))
        .rejects.toThrow(/Student with ID 99999 not found/i);
    });
  });

  describe('deleteStudentAspiration', () => {
    it('should delete student aspiration', async () => {
      const created = await createStudentAspiration(testAspirationInput);

      await deleteStudentAspiration(created.id);

      const result = await getStudentAspiration(created.id);
      expect(result).toBeNull();
    });

    it('should throw error for non-existent aspiration', async () => {
      await expect(deleteStudentAspiration(99999))
        .rejects.toThrow(/Student aspiration with ID 99999 not found/i);
    });
  });

  describe('getAspirationsByStudent', () => {
    it('should return aspirations for specific student', async () => {
      // Create multiple aspirations for the same student
      await createStudentAspiration(testAspirationInput);
      await createStudentAspiration({
        ...testAspirationInput,
        description: 'Save for vacation',
        target_amount: 5000000
      });

      const results = await getAspirationsByStudent(studentId);

      expect(results).toHaveLength(2);
      expect(results[0].student_id).toEqual(studentId);
      expect(results[1].student_id).toEqual(studentId);
      expect(results[0].target_amount).toEqual(15000000);
      expect(typeof results[0].target_amount).toBe('number');
      expect(results[1].target_amount).toEqual(5000000);
      expect(typeof results[1].target_amount).toBe('number');
    });

    it('should return empty array for student with no aspirations', async () => {
      const results = await getAspirationsByStudent(studentId);
      expect(results).toHaveLength(0);
    });

    it('should throw error for non-existent student', async () => {
      await expect(getAspirationsByStudent(99999))
        .rejects.toThrow(/Student with ID 99999 not found/i);
    });
  });

  describe('getAspirationsByClass', () => {
    it('should return aspirations for students in specific class', async () => {
      // Create aspiration for student in the class
      await createStudentAspiration(testAspirationInput);

      // Create another student in the same class with aspiration
      const student2Result = await db.insert(studentsTable)
        .values({
          ...testStudent,
          name: 'Student Test 2',
          nisn: '0987654321',
          nis: '654321',
          email: 'student2@test.com',
          class_id: classId
        })
        .returning()
        .execute();
      const student2Id = student2Result[0].id;

      await createStudentAspiration({
        description: 'Save for books',
        target_amount: 2000000,
        student_id: student2Id
      });

      const results = await getAspirationsByClass(classId);

      expect(results).toHaveLength(2);
      expect(results[0].target_amount).toEqual(15000000);
      expect(typeof results[0].target_amount).toBe('number');
      expect(results[1].target_amount).toEqual(2000000);
      expect(typeof results[1].target_amount).toBe('number');
    });

    it('should return empty array for class with no student aspirations', async () => {
      const results = await getAspirationsByClass(classId);
      expect(results).toHaveLength(0);
    });

    it('should throw error for non-existent class', async () => {
      await expect(getAspirationsByClass(99999))
        .rejects.toThrow(/Class with ID 99999 not found/i);
    });
  });

  describe('getAspirationsByTeacher', () => {
    it('should return aspirations for students in teacher\'s homeroom class', async () => {
      // Create aspiration for student in teacher's homeroom class
      await createStudentAspiration(testAspirationInput);

      // Create another class with different teacher
      const teacher2Result = await db.insert(teachersTable)
        .values({
          name: 'Teacher 2',
          email: 'teacher2@test.com',
          role: 'homeroom_teacher'
        })
        .returning()
        .execute();
      const teacher2Id = teacher2Result[0].id;

      const class2Result = await db.insert(classesTable)
        .values({
          name: 'Class 10B',
          homeroom_teacher_id: teacher2Id
        })
        .returning()
        .execute();
      const class2Id = class2Result[0].id;

      const student2Result = await db.insert(studentsTable)
        .values({
          ...testStudent,
          name: 'Student Test 2',
          nisn: '0987654321',
          nis: '654321',
          email: 'student2@test.com',
          class_id: class2Id
        })
        .returning()
        .execute();
      const student2Id = student2Result[0].id;

      await createStudentAspiration({
        description: 'Save for books',
        target_amount: 2000000,
        student_id: student2Id
      });

      // Get aspirations for first teacher - should only return aspirations from their homeroom class
      const results = await getAspirationsByTeacher(teacherId);

      expect(results).toHaveLength(1);
      expect(results[0].description).toEqual('Save for new laptop');
      expect(results[0].target_amount).toEqual(15000000);
      expect(typeof results[0].target_amount).toBe('number');
      expect(results[0].student_id).toEqual(studentId);
    });

    it('should return empty array for teacher with no student aspirations in homeroom class', async () => {
      const results = await getAspirationsByTeacher(teacherId);
      expect(results).toHaveLength(0);
    });

    it('should throw error for non-existent teacher', async () => {
      await expect(getAspirationsByTeacher(99999))
        .rejects.toThrow(/Teacher with ID 99999 not found/i);
    });

    it('should return empty array for teacher with no homeroom class', async () => {
      // Create teacher without homeroom class
      const nonHomeroomTeacherResult = await db.insert(teachersTable)
        .values({
          name: 'Non-Homeroom Teacher',
          email: 'nonhomeroom@test.com',
          role: 'other'
        })
        .returning()
        .execute();
      const nonHomeroomTeacherId = nonHomeroomTeacherResult[0].id;

      const results = await getAspirationsByTeacher(nonHomeroomTeacherId);
      expect(results).toHaveLength(0);
    });
  });
});