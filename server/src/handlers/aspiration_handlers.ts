import { db } from '../db';
import { 
  studentAspirationsTable, 
  studentsTable, 
  classesTable, 
  teachersTable 
} from '../db/schema';
import { 
  type CreateStudentAspirationInput, 
  type UpdateStudentAspirationInput, 
  type StudentAspiration 
} from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export async function createStudentAspiration(input: CreateStudentAspirationInput): Promise<StudentAspiration> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with ID ${input.student_id} not found`);
    }

    // Insert aspiration record
    const result = await db.insert(studentAspirationsTable)
      .values({
        description: input.description,
        target_amount: input.target_amount.toString(), // Convert number to string for numeric column
        student_id: input.student_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const aspiration = result[0];
    return {
      ...aspiration,
      target_amount: parseFloat(aspiration.target_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Student aspiration creation failed:', error);
    throw error;
  }
}

export async function getStudentAspirations(): Promise<StudentAspiration[]> {
  try {
    const results = await db.select()
      .from(studentAspirationsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(aspiration => ({
      ...aspiration,
      target_amount: parseFloat(aspiration.target_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch student aspirations:', error);
    throw error;
  }
}

export async function getStudentAspiration(id: number): Promise<StudentAspiration | null> {
  try {
    const results = await db.select()
      .from(studentAspirationsTable)
      .where(eq(studentAspirationsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const aspiration = results[0];
    return {
      ...aspiration,
      target_amount: parseFloat(aspiration.target_amount)
    };
  } catch (error) {
    console.error('Failed to fetch student aspiration:', error);
    throw error;
  }
}

export async function updateStudentAspiration(input: UpdateStudentAspirationInput): Promise<StudentAspiration> {
  try {
    // Verify aspiration exists
    const existingAspiration = await db.select()
      .from(studentAspirationsTable)
      .where(eq(studentAspirationsTable.id, input.id))
      .execute();

    if (existingAspiration.length === 0) {
      throw new Error(`Student aspiration with ID ${input.id} not found`);
    }

    // If student_id is being updated, verify the new student exists
    if (input.student_id !== undefined) {
      const student = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, input.student_id))
        .execute();

      if (student.length === 0) {
        throw new Error(`Student with ID ${input.student_id} not found`);
      }
    }

    // Prepare update values - convert numbers to strings for numeric columns
    const updateValues: any = {};
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.target_amount !== undefined) updateValues.target_amount = input.target_amount.toString();
    if (input.student_id !== undefined) updateValues.student_id = input.student_id;

    // Update aspiration record
    const result = await db.update(studentAspirationsTable)
      .set(updateValues)
      .where(eq(studentAspirationsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const aspiration = result[0];
    return {
      ...aspiration,
      target_amount: parseFloat(aspiration.target_amount)
    };
  } catch (error) {
    console.error('Student aspiration update failed:', error);
    throw error;
  }
}

export async function deleteStudentAspiration(id: number): Promise<void> {
  try {
    // Verify aspiration exists
    const existingAspiration = await db.select()
      .from(studentAspirationsTable)
      .where(eq(studentAspirationsTable.id, id))
      .execute();

    if (existingAspiration.length === 0) {
      throw new Error(`Student aspiration with ID ${id} not found`);
    }

    // Delete aspiration record
    await db.delete(studentAspirationsTable)
      .where(eq(studentAspirationsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Student aspiration deletion failed:', error);
    throw error;
  }
}

export async function getAspirationsByStudent(studentId: number): Promise<StudentAspiration[]> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const results = await db.select()
      .from(studentAspirationsTable)
      .where(eq(studentAspirationsTable.student_id, studentId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(aspiration => ({
      ...aspiration,
      target_amount: parseFloat(aspiration.target_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch aspirations by student:', error);
    throw error;
  }
}

export async function getAspirationsByClass(classId: number): Promise<StudentAspiration[]> {
  try {
    // Verify class exists
    const classRecord = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    if (classRecord.length === 0) {
      throw new Error(`Class with ID ${classId} not found`);
    }

    // Join aspirations with students to filter by class
    const results = await db.select()
      .from(studentAspirationsTable)
      .innerJoin(studentsTable, eq(studentAspirationsTable.student_id, studentsTable.id))
      .where(eq(studentsTable.class_id, classId))
      .execute();

    // Convert numeric fields and handle joined data structure
    return results.map(result => ({
      ...result.student_aspirations,
      target_amount: parseFloat(result.student_aspirations.target_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch aspirations by class:', error);
    throw error;
  }
}

export async function getAspirationsByTeacher(teacherId: number): Promise<StudentAspiration[]> {
  try {
    // Verify teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    if (teacher.length === 0) {
      throw new Error(`Teacher with ID ${teacherId} not found`);
    }

    // Join aspirations with students and classes to filter by homeroom teacher
    const results = await db.select()
      .from(studentAspirationsTable)
      .innerJoin(studentsTable, eq(studentAspirationsTable.student_id, studentsTable.id))
      .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
      .where(eq(classesTable.homeroom_teacher_id, teacherId))
      .execute();

    // Convert numeric fields and handle joined data structure
    return results.map(result => ({
      ...result.student_aspirations,
      target_amount: parseFloat(result.student_aspirations.target_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch aspirations by teacher:', error);
    throw error;
  }
}