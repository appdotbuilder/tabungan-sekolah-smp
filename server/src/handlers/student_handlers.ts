import { db } from '../db';
import { studentsTable, classesTable, teachersTable } from '../db/schema';
import { type CreateStudentInput, type UpdateStudentInput, type Student } from '../schema';
import { eq, and } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  try {
    const result = await db.insert(studentsTable)
      .values({
        name: input.name,
        gender: input.gender,
        nisn: input.nisn,
        nis: input.nis,
        class_id: input.class_id,
        phone: input.phone,
        email: input.email,
        bank_name: input.bank_name,
        account_number: input.account_number,
        status: input.status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
}

export async function getStudents(): Promise<Student[]> {
  try {
    const result = await db.select()
      .from(studentsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get students:', error);
    throw error;
  }
}

export async function getStudent(id: number): Promise<Student | null> {
  try {
    const result = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to get student:', error);
    throw error;
  }
}

export async function updateStudent(input: UpdateStudentInput): Promise<Student> {
  try {
    // Build the update object dynamically
    const updateData: Record<string, any> = {};
    
    if (input.name !== undefined) updateData['name'] = input.name;
    if (input.gender !== undefined) updateData['gender'] = input.gender;
    if (input.nisn !== undefined) updateData['nisn'] = input.nisn;
    if (input.nis !== undefined) updateData['nis'] = input.nis;
    if (input.class_id !== undefined) updateData['class_id'] = input.class_id;
    if (input.phone !== undefined) updateData['phone'] = input.phone;
    if (input.email !== undefined) updateData['email'] = input.email;
    if (input.bank_name !== undefined) updateData['bank_name'] = input.bank_name;
    if (input.account_number !== undefined) updateData['account_number'] = input.account_number;
    if (input.status !== undefined) updateData['status'] = input.status;

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
}

export async function deleteStudent(id: number): Promise<void> {
  try {
    const result = await db.delete(studentsTable)
      .where(eq(studentsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student with id ${id} not found`);
    }
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
}

export async function getStudentsByClass(classId: number): Promise<Student[]> {
  try {
    const result = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.class_id, classId))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get students by class:', error);
    throw error;
  }
}

export async function getStudentsByTeacher(teacherId: number): Promise<Student[]> {
  try {
    const result = await db.select()
      .from(studentsTable)
      .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
      .where(eq(classesTable.homeroom_teacher_id, teacherId))
      .execute();

    // Extract student data from joined results
    return result.map(row => row.students);
  } catch (error) {
    console.error('Failed to get students by teacher:', error);
    throw error;
  }
}