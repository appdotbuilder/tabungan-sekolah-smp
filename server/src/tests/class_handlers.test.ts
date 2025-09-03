import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, teachersTable } from '../db/schema';
import { type CreateClassInput, type UpdateClassInput } from '../schema';
import { 
  createClass, 
  getClasses, 
  getClass, 
  updateClass, 
  deleteClass, 
  getClassesByTeacher 
} from '../handlers/class_handlers';
import { eq } from 'drizzle-orm';

// Test data
const testTeacher = {
  name: 'John Smith',
  email: 'john.smith@school.edu',
  role: 'homeroom_teacher' as const
};

const testClass: CreateClassInput = {
  name: 'Class 10A',
  homeroom_teacher_id: null
};

describe('Class Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createClass', () => {
    it('should create a class without homeroom teacher', async () => {
      const result = await createClass(testClass);

      expect(result.name).toEqual('Class 10A');
      expect(result.homeroom_teacher_id).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a class with homeroom teacher', async () => {
      // Create teacher first
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      
      const teacher = teacherResult[0];

      const classWithTeacher: CreateClassInput = {
        name: 'Class 10B',
        homeroom_teacher_id: teacher.id
      };

      const result = await createClass(classWithTeacher);

      expect(result.name).toEqual('Class 10B');
      expect(result.homeroom_teacher_id).toEqual(teacher.id);
      expect(result.id).toBeDefined();
    });

    it('should save class to database', async () => {
      const result = await createClass(testClass);

      const classes = await db.select()
        .from(classesTable)
        .where(eq(classesTable.id, result.id))
        .execute();

      expect(classes).toHaveLength(1);
      expect(classes[0].name).toEqual('Class 10A');
      expect(classes[0].homeroom_teacher_id).toBeNull();
    });

    it('should throw error when homeroom teacher does not exist', async () => {
      const invalidClass: CreateClassInput = {
        name: 'Class 10C',
        homeroom_teacher_id: 999
      };

      await expect(createClass(invalidClass)).rejects.toThrow(/Teacher with id 999 not found/i);
    });
  });

  describe('getClasses', () => {
    it('should return empty array when no classes exist', async () => {
      const result = await getClasses();
      expect(result).toEqual([]);
    });

    it('should return all classes', async () => {
      // Create multiple classes
      await createClass({ name: 'Class 10A', homeroom_teacher_id: null });
      await createClass({ name: 'Class 10B', homeroom_teacher_id: null });
      await createClass({ name: 'Class 11A', homeroom_teacher_id: null });

      const result = await getClasses();

      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).toContain('Class 10A');
      expect(result.map(c => c.name)).toContain('Class 10B');
      expect(result.map(c => c.name)).toContain('Class 11A');
    });
  });

  describe('getClass', () => {
    it('should return null when class does not exist', async () => {
      const result = await getClass(999);
      expect(result).toBeNull();
    });

    it('should return class by id', async () => {
      const created = await createClass(testClass);
      const result = await getClass(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(created.id);
      expect(result?.name).toEqual('Class 10A');
      expect(result?.homeroom_teacher_id).toBeNull();
    });
  });

  describe('updateClass', () => {
    it('should update class name', async () => {
      const created = await createClass(testClass);
      
      const updateInput: UpdateClassInput = {
        id: created.id,
        name: 'Updated Class Name'
      };

      const result = await updateClass(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Class Name');
      expect(result.homeroom_teacher_id).toBeNull();
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update homeroom teacher', async () => {
      // Create teacher and class
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      
      const teacher = teacherResult[0];
      const created = await createClass(testClass);
      
      const updateInput: UpdateClassInput = {
        id: created.id,
        homeroom_teacher_id: teacher.id
      };

      const result = await updateClass(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.homeroom_teacher_id).toEqual(teacher.id);
      expect(result.name).toEqual(created.name); // Should remain unchanged
    });

    it('should update multiple fields', async () => {
      const created = await createClass(testClass);
      
      const updateInput: UpdateClassInput = {
        id: created.id,
        name: 'Updated Class',
        homeroom_teacher_id: null
      };

      const result = await updateClass(updateInput);

      expect(result.name).toEqual('Updated Class');
      expect(result.homeroom_teacher_id).toBeNull();
    });

    it('should throw error when class does not exist', async () => {
      const updateInput: UpdateClassInput = {
        id: 999,
        name: 'Non-existent Class'
      };

      await expect(updateClass(updateInput)).rejects.toThrow(/Class with id 999 not found/i);
    });

    it('should throw error when homeroom teacher does not exist', async () => {
      const created = await createClass(testClass);
      
      const updateInput: UpdateClassInput = {
        id: created.id,
        homeroom_teacher_id: 999
      };

      await expect(updateClass(updateInput)).rejects.toThrow(/Teacher with id 999 not found/i);
    });

    it('should persist changes to database', async () => {
      const created = await createClass(testClass);
      
      const updateInput: UpdateClassInput = {
        id: created.id,
        name: 'Database Update Test'
      };

      await updateClass(updateInput);

      const fromDb = await db.select()
        .from(classesTable)
        .where(eq(classesTable.id, created.id))
        .execute();

      expect(fromDb[0].name).toEqual('Database Update Test');
    });
  });

  describe('deleteClass', () => {
    it('should delete existing class', async () => {
      const created = await createClass(testClass);
      
      await deleteClass(created.id);

      const fromDb = await db.select()
        .from(classesTable)
        .where(eq(classesTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(0);
    });

    it('should throw error when class does not exist', async () => {
      await expect(deleteClass(999)).rejects.toThrow(/Class with id 999 not found/i);
    });
  });

  describe('getClassesByTeacher', () => {
    it('should return empty array when teacher has no classes', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      
      const teacher = teacherResult[0];

      const result = await getClassesByTeacher(teacher.id);
      expect(result).toEqual([]);
    });

    it('should return classes assigned to teacher', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      
      const teacher = teacherResult[0];

      // Create classes - some with this teacher, some without
      await createClass({ name: 'Class 10A', homeroom_teacher_id: teacher.id });
      await createClass({ name: 'Class 10B', homeroom_teacher_id: teacher.id });
      await createClass({ name: 'Class 11A', homeroom_teacher_id: null }); // Different teacher

      const result = await getClassesByTeacher(teacher.id);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toContain('Class 10A');
      expect(result.map(c => c.name)).toContain('Class 10B');
      expect(result.map(c => c.name)).not.toContain('Class 11A');
      
      result.forEach(classItem => {
        expect(classItem.homeroom_teacher_id).toEqual(teacher.id);
      });
    });

    it('should throw error when teacher does not exist', async () => {
      await expect(getClassesByTeacher(999)).rejects.toThrow(/Teacher with id 999 not found/i);
    });
  });
});