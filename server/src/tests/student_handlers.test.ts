import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, classesTable, teachersTable } from '../db/schema';
import { type CreateStudentInput, type UpdateStudentInput } from '../schema';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  getStudentsByTeacher
} from '../handlers/student_handlers';
import { eq } from 'drizzle-orm';

// Test data
const testTeacher = {
  name: 'John Teacher',
  email: 'teacher@school.com',
  role: 'homeroom_teacher' as const
};

const testClass = {
  name: 'Class 10A'
};

const testStudentInput: CreateStudentInput = {
  name: 'Jane Student',
  gender: 'female' as const,
  nisn: '1234567890',
  nis: '12345',
  class_id: 1,
  phone: '081234567890',
  email: 'jane@student.com',
  bank_name: 'BCA',
  account_number: '1234567890',
  status: 'active' as const
};

describe('Student Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createStudent', () => {
    it('should create a student successfully', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const result = await createStudent(testStudentInput);

      expect(result.name).toEqual('Jane Student');
      expect(result.gender).toEqual('female');
      expect(result.nisn).toEqual('1234567890');
      expect(result.nis).toEqual('12345');
      expect(result.class_id).toEqual(1);
      expect(result.phone).toEqual('081234567890');
      expect(result.email).toEqual('jane@student.com');
      expect(result.bank_name).toEqual('BCA');
      expect(result.account_number).toEqual('1234567890');
      expect(result.status).toEqual('active');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save student to database', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const result = await createStudent(testStudentInput);

      const savedStudent = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, result.id))
        .execute();

      expect(savedStudent).toHaveLength(1);
      expect(savedStudent[0].name).toEqual('Jane Student');
      expect(savedStudent[0].nisn).toEqual('1234567890');
      expect(savedStudent[0].nis).toEqual('12345');
    });

    it('should create student with minimal data', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const minimalInput: CreateStudentInput = {
        name: 'John Student',
        gender: 'male',
        nisn: '0987654321',
        nis: '54321',
        class_id: 1,
        phone: null,
        email: null,
        bank_name: null,
        account_number: null,
        status: 'active'
      };

      const result = await createStudent(minimalInput);

      expect(result.name).toEqual('John Student');
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.bank_name).toBeNull();
      expect(result.account_number).toBeNull();
    });

    it('should throw error for invalid class_id', async () => {
      const invalidInput = {
        ...testStudentInput,
        class_id: 999
      };

      await expect(createStudent(invalidInput)).rejects.toThrow();
    });

    it('should throw error for duplicate nisn', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      await createStudent(testStudentInput);

      const duplicateInput = {
        ...testStudentInput,
        name: 'Different Student',
        nis: '99999'
      };

      await expect(createStudent(duplicateInput)).rejects.toThrow();
    });
  });

  describe('getStudents', () => {
    it('should return empty array when no students exist', async () => {
      const result = await getStudents();
      expect(result).toEqual([]);
    });

    it('should return all students', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const classResult = await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student1Input = { ...testStudentInput, name: 'Student 1' };
      const student2Input = { ...testStudentInput, name: 'Student 2', nisn: '9876543210', nis: '67890' };

      await createStudent(student1Input);
      await createStudent(student2Input);

      const result = await getStudents();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Student 1');
      expect(result[1].name).toEqual('Student 2');
    });
  });

  describe('getStudent', () => {
    it('should return null for non-existent student', async () => {
      const result = await getStudent(999);
      expect(result).toBeNull();
    });

    it('should return student by id', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student = await createStudent(testStudentInput);
      const result = await getStudent(student.id);

      expect(result).not.toBeNull();
      expect(result!.name).toEqual('Jane Student');
      expect(result!.id).toEqual(student.id);
    });
  });

  describe('updateStudent', () => {
    it('should update student fields', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student = await createStudent(testStudentInput);

      const updateInput: UpdateStudentInput = {
        id: student.id,
        name: 'Updated Name',
        phone: '087654321012',
        status: 'graduated'
      };

      const result = await updateStudent(updateInput);

      expect(result.name).toEqual('Updated Name');
      expect(result.phone).toEqual('087654321012');
      expect(result.status).toEqual('graduated');
      expect(result.gender).toEqual(student.gender); // Unchanged
      expect(result.nisn).toEqual(student.nisn); // Unchanged
    });

    it('should update student in database', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student = await createStudent(testStudentInput);

      const updateInput: UpdateStudentInput = {
        id: student.id,
        name: 'Updated Name'
      };

      await updateStudent(updateInput);

      const savedStudent = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, student.id))
        .execute();

      expect(savedStudent[0].name).toEqual('Updated Name');
    });

    it('should throw error for non-existent student', async () => {
      const updateInput: UpdateStudentInput = {
        id: 999,
        name: 'Updated Name'
      };

      await expect(updateStudent(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should update only provided fields', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student = await createStudent(testStudentInput);
      const originalName = student.name;

      const updateInput: UpdateStudentInput = {
        id: student.id,
        phone: '087777777777'
      };

      const result = await updateStudent(updateInput);

      expect(result.phone).toEqual('087777777777');
      expect(result.name).toEqual(originalName); // Should remain unchanged
    });
  });

  describe('deleteStudent', () => {
    it('should delete student successfully', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student = await createStudent(testStudentInput);

      await deleteStudent(student.id);

      const result = await getStudent(student.id);
      expect(result).toBeNull();
    });

    it('should throw error for non-existent student', async () => {
      await expect(deleteStudent(999)).rejects.toThrow(/not found/i);
    });

    it('should remove student from database', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(classesTable).values({
        ...testClass,
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student = await createStudent(testStudentInput);

      await deleteStudent(student.id);

      const savedStudents = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, student.id))
        .execute();

      expect(savedStudents).toHaveLength(0);
    });
  });

  describe('getStudentsByClass', () => {
    it('should return empty array for class with no students', async () => {
      const result = await getStudentsByClass(999);
      expect(result).toEqual([]);
    });

    it('should return students in specific class', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const class1 = await db.insert(classesTable).values({
        name: 'Class 10A',
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();
      
      const class2 = await db.insert(classesTable).values({
        name: 'Class 10B',
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student1Input = { ...testStudentInput, name: 'Student 1', class_id: class1[0].id };
      const student2Input = { ...testStudentInput, name: 'Student 2', nisn: '9876543210', nis: '67890', class_id: class1[0].id };
      const student3Input = { ...testStudentInput, name: 'Student 3', nisn: '1111111111', nis: '11111', class_id: class2[0].id };

      await createStudent(student1Input);
      await createStudent(student2Input);
      await createStudent(student3Input);

      const result = await getStudentsByClass(class1[0].id);

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Student 1');
      expect(result[1].name).toEqual('Student 2');
      expect(result[0].class_id).toEqual(class1[0].id);
      expect(result[1].class_id).toEqual(class1[0].id);
    });
  });

  describe('getStudentsByTeacher', () => {
    it('should return empty array for teacher with no classes', async () => {
      const result = await getStudentsByTeacher(999);
      expect(result).toEqual([]);
    });

    it('should return students in teacher\'s homeroom class', async () => {
      // Create prerequisites
      const teacher1 = await db.insert(teachersTable).values({
        name: 'Teacher 1',
        email: 'teacher1@school.com',
        role: 'homeroom_teacher'
      }).returning().execute();

      const teacher2 = await db.insert(teachersTable).values({
        name: 'Teacher 2',
        email: 'teacher2@school.com',
        role: 'homeroom_teacher'
      }).returning().execute();

      const class1 = await db.insert(classesTable).values({
        name: 'Class 10A',
        homeroom_teacher_id: teacher1[0].id
      }).returning().execute();

      const class2 = await db.insert(classesTable).values({
        name: 'Class 10B',
        homeroom_teacher_id: teacher2[0].id
      }).returning().execute();

      const student1Input = { ...testStudentInput, name: 'Student 1', class_id: class1[0].id };
      const student2Input = { ...testStudentInput, name: 'Student 2', nisn: '9876543210', nis: '67890', class_id: class1[0].id };
      const student3Input = { ...testStudentInput, name: 'Student 3', nisn: '1111111111', nis: '11111', class_id: class2[0].id };

      await createStudent(student1Input);
      await createStudent(student2Input);
      await createStudent(student3Input);

      const result = await getStudentsByTeacher(teacher1[0].id);

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Student 1');
      expect(result[1].name).toEqual('Student 2');
      expect(result[0].class_id).toEqual(class1[0].id);
      expect(result[1].class_id).toEqual(class1[0].id);
    });

    it('should return students from multiple classes if teacher has multiple homeroom classes', async () => {
      // Create prerequisites
      const teacher = await db.insert(teachersTable).values(testTeacher).returning().execute();

      const class1 = await db.insert(classesTable).values({
        name: 'Class 10A',
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const class2 = await db.insert(classesTable).values({
        name: 'Class 10B',
        homeroom_teacher_id: teacher[0].id
      }).returning().execute();

      const student1Input = { ...testStudentInput, name: 'Student 1', class_id: class1[0].id };
      const student2Input = { ...testStudentInput, name: 'Student 2', nisn: '9876543210', nis: '67890', class_id: class2[0].id };

      await createStudent(student1Input);
      await createStudent(student2Input);

      const result = await getStudentsByTeacher(teacher[0].id);

      expect(result).toHaveLength(2);
      // Results might be in any order, so just check we have both students
      const studentNames = result.map(s => s.name).sort();
      expect(studentNames).toEqual(['Student 1', 'Student 2']);
    });
  });
});