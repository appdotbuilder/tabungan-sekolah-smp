import { db } from '../db';
import { classesTable, teachersTable } from '../db/schema';
import { type CreateClassInput, type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export async function createClass(input: CreateClassInput): Promise<Class> {
  try {
    // Validate homeroom teacher exists if provided
    if (input.homeroom_teacher_id) {
      const teacher = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, input.homeroom_teacher_id))
        .execute();
      
      if (teacher.length === 0) {
        throw new Error(`Teacher with id ${input.homeroom_teacher_id} not found`);
      }
    }

    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        homeroom_teacher_id: input.homeroom_teacher_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
}

export async function getClasses(): Promise<Class[]> {
  try {
    const classes = await db.select()
      .from(classesTable)
      .execute();

    return classes;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}

export async function getClass(id: number): Promise<Class | null> {
  try {
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, id))
      .execute();

    return classes.length > 0 ? classes[0] : null;
  } catch (error) {
    console.error('Failed to fetch class:', error);
    throw error;
  }
}

export async function updateClass(input: UpdateClassInput): Promise<Class> {
  try {
    // Check if class exists
    const existingClass = await getClass(input.id);
    if (!existingClass) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    // Validate homeroom teacher exists if provided
    if (input.homeroom_teacher_id !== undefined && input.homeroom_teacher_id !== null) {
      const teacher = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, input.homeroom_teacher_id))
        .execute();
      
      if (teacher.length === 0) {
        throw new Error(`Teacher with id ${input.homeroom_teacher_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.homeroom_teacher_id !== undefined) {
      updateData.homeroom_teacher_id = input.homeroom_teacher_id;
    }

    // Update class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
}

export async function deleteClass(id: number): Promise<void> {
  try {
    // Check if class exists
    const existingClass = await getClass(id);
    if (!existingClass) {
      throw new Error(`Class with id ${id} not found`);
    }

    // Delete class record
    await db.delete(classesTable)
      .where(eq(classesTable.id, id))
      .execute();
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
}

export async function getClassesByTeacher(teacherId: number): Promise<Class[]> {
  try {
    // Validate teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();
    
    if (teacher.length === 0) {
      throw new Error(`Teacher with id ${teacherId} not found`);
    }

    // Fetch classes assigned to the teacher
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.homeroom_teacher_id, teacherId))
      .execute();

    return classes;
  } catch (error) {
    console.error('Failed to fetch classes by teacher:', error);
    throw error;
  }
}