import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type CreateTeacherInput, type UpdateTeacherInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTeacher(input: CreateTeacherInput): Promise<Teacher> {
  try {
    // Insert teacher record
    const result = await db.insert(teachersTable)
      .values({
        name: input.name,
        email: input.email,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Teacher creation failed:', error);
    throw error;
  }
}

export async function getTeachers(): Promise<Teacher[]> {
  try {
    const results = await db.select()
      .from(teachersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    throw error;
  }
}

export async function getTeacher(id: number): Promise<Teacher | null> {
  try {
    const results = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch teacher:', error);
    throw error;
  }
}

export async function updateTeacher(input: UpdateTeacherInput): Promise<Teacher> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof input> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.role !== undefined) updateData.role = input.role;

    const result = await db.update(teachersTable)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(teachersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Teacher with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Teacher update failed:', error);
    throw error;
  }
}

export async function deleteTeacher(id: number): Promise<void> {
  try {
    const result = await db.delete(teachersTable)
      .where(eq(teachersTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Teacher with id ${id} not found`);
    }
  } catch (error) {
    console.error('Teacher deletion failed:', error);
    throw error;
  }
}