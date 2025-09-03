import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type CreateTeacherInput, type UpdateTeacherInput } from '../schema';
import { 
  createTeacher, 
  getTeachers, 
  getTeacher, 
  updateTeacher, 
  deleteTeacher 
} from '../handlers/teacher_handlers';
import { eq } from 'drizzle-orm';

// Test inputs
const testTeacherInput: CreateTeacherInput = {
  name: 'John Doe',
  email: 'john.doe@school.com',
  role: 'homeroom_teacher'
};

const testTeacherInput2: CreateTeacherInput = {
  name: 'Jane Smith',
  email: 'jane.smith@school.com',
  role: 'other'
};

describe('Teacher Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createTeacher', () => {
    it('should create a teacher with homeroom_teacher role', async () => {
      const result = await createTeacher(testTeacherInput);

      expect(result.name).toEqual('John Doe');
      expect(result.email).toEqual('john.doe@school.com');
      expect(result.role).toEqual('homeroom_teacher');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a teacher with other role', async () => {
      const result = await createTeacher(testTeacherInput2);

      expect(result.name).toEqual('Jane Smith');
      expect(result.email).toEqual('jane.smith@school.com');
      expect(result.role).toEqual('other');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save teacher to database', async () => {
      const result = await createTeacher(testTeacherInput);

      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, result.id))
        .execute();

      expect(teachers).toHaveLength(1);
      expect(teachers[0].name).toEqual('John Doe');
      expect(teachers[0].email).toEqual('john.doe@school.com');
      expect(teachers[0].role).toEqual('homeroom_teacher');
      expect(teachers[0].created_at).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate email', async () => {
      await createTeacher(testTeacherInput);
      
      const duplicateInput = {
        ...testTeacherInput,
        name: 'Different Name'
      };

      await expect(createTeacher(duplicateInput)).rejects.toThrow(/duplicate/i);
    });
  });

  describe('getTeachers', () => {
    it('should return empty array when no teachers exist', async () => {
      const result = await getTeachers();
      expect(result).toEqual([]);
    });

    it('should return all teachers', async () => {
      await createTeacher(testTeacherInput);
      await createTeacher(testTeacherInput2);

      const result = await getTeachers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('John Doe');
      expect(result[1].name).toEqual('Jane Smith');
    });

    it('should return teachers with all required fields', async () => {
      await createTeacher(testTeacherInput);

      const result = await getTeachers();

      expect(result).toHaveLength(1);
      const teacher = result[0];
      expect(teacher.id).toBeDefined();
      expect(teacher.name).toBeDefined();
      expect(teacher.email).toBeDefined();
      expect(teacher.role).toBeDefined();
      expect(teacher.created_at).toBeInstanceOf(Date);
      expect(teacher.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getTeacher', () => {
    it('should return null for non-existent teacher', async () => {
      const result = await getTeacher(999);
      expect(result).toBeNull();
    });

    it('should return specific teacher by id', async () => {
      const created = await createTeacher(testTeacherInput);

      const result = await getTeacher(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(created.id);
      expect(result?.name).toEqual('John Doe');
      expect(result?.email).toEqual('john.doe@school.com');
      expect(result?.role).toEqual('homeroom_teacher');
    });

    it('should return correct teacher when multiple exist', async () => {
      const teacher1 = await createTeacher(testTeacherInput);
      const teacher2 = await createTeacher(testTeacherInput2);

      const result = await getTeacher(teacher2.id);

      expect(result?.id).toEqual(teacher2.id);
      expect(result?.name).toEqual('Jane Smith');
      expect(result?.email).toEqual('jane.smith@school.com');
    });
  });

  describe('updateTeacher', () => {
    it('should update teacher name only', async () => {
      const created = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: created.id,
        name: 'John Updated'
      };

      const result = await updateTeacher(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('John Updated');
      expect(result.email).toEqual('john.doe@school.com'); // unchanged
      expect(result.role).toEqual('homeroom_teacher'); // unchanged
      expect(result.updated_at).not.toEqual(created.updated_at);
    });

    it('should update teacher email only', async () => {
      const created = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: created.id,
        email: 'john.updated@school.com'
      };

      const result = await updateTeacher(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('John Doe'); // unchanged
      expect(result.email).toEqual('john.updated@school.com');
      expect(result.role).toEqual('homeroom_teacher'); // unchanged
    });

    it('should update teacher role only', async () => {
      const created = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: created.id,
        role: 'other'
      };

      const result = await updateTeacher(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('John Doe'); // unchanged
      expect(result.email).toEqual('john.doe@school.com'); // unchanged
      expect(result.role).toEqual('other');
    });

    it('should update multiple fields', async () => {
      const created = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: created.id,
        name: 'John Complete Update',
        email: 'john.complete@school.com',
        role: 'other'
      };

      const result = await updateTeacher(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('John Complete Update');
      expect(result.email).toEqual('john.complete@school.com');
      expect(result.role).toEqual('other');
      expect(result.updated_at).not.toEqual(created.updated_at);
    });

    it('should persist updates to database', async () => {
      const created = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: created.id,
        name: 'Database Check'
      };

      await updateTeacher(updateInput);

      const fromDb = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(1);
      expect(fromDb[0].name).toEqual('Database Check');
    });

    it('should throw error for non-existent teacher', async () => {
      const updateInput: UpdateTeacherInput = {
        id: 999,
        name: 'Should Fail'
      };

      await expect(updateTeacher(updateInput)).rejects.toThrow(/not found/i);
    });

    it('should throw error for duplicate email', async () => {
      const teacher1 = await createTeacher(testTeacherInput);
      await createTeacher(testTeacherInput2);

      const updateInput: UpdateTeacherInput = {
        id: teacher1.id,
        email: 'jane.smith@school.com' // Already exists
      };

      await expect(updateTeacher(updateInput)).rejects.toThrow(/duplicate/i);
    });
  });

  describe('deleteTeacher', () => {
    it('should delete existing teacher', async () => {
      const created = await createTeacher(testTeacherInput);

      await deleteTeacher(created.id);

      const fromDb = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, created.id))
        .execute();

      expect(fromDb).toHaveLength(0);
    });

    it('should throw error for non-existent teacher', async () => {
      await expect(deleteTeacher(999)).rejects.toThrow(/not found/i);
    });

    it('should not affect other teachers', async () => {
      const teacher1 = await createTeacher(testTeacherInput);
      const teacher2 = await createTeacher(testTeacherInput2);

      await deleteTeacher(teacher1.id);

      const remaining = await getTeachers();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toEqual(teacher2.id);
      expect(remaining[0].name).toEqual('Jane Smith');
    });
  });
});