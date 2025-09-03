import { db } from '../db';
import { schoolsTable } from '../db/schema';
import { type CreateSchoolInput, type UpdateSchoolInput, type School } from '../schema';
import { eq } from 'drizzle-orm';

export async function createSchool(input: CreateSchoolInput): Promise<School> {
  try {
    // Insert school record
    const result = await db.insert(schoolsTable)
      .values({
        name: input.name,
        address: input.address,
        phone: input.phone,
        email: input.email
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('School creation failed:', error);
    throw error;
  }
}

export async function getSchool(): Promise<School | null> {
  try {
    // Get the first school record (assuming single school system)
    const result = await db.select()
      .from(schoolsTable)
      .limit(1)
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('School retrieval failed:', error);
    throw error;
  }
}

export async function updateSchool(input: UpdateSchoolInput): Promise<School> {
  try {
    // Build update object with only defined fields
    const updateData: Partial<typeof schoolsTable.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;

    // Update school record
    const result = await db.update(schoolsTable)
      .set({
        ...updateData,
        updated_at: new Date() // Always update timestamp
      })
      .where(eq(schoolsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`School with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('School update failed:', error);
    throw error;
  }
}