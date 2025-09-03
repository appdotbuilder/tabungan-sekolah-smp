import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { schoolsTable } from '../db/schema';
import { type CreateSchoolInput, type UpdateSchoolInput } from '../schema';
import { createSchool, getSchool, updateSchool } from '../handlers/school_handlers';
import { eq } from 'drizzle-orm';

// Test input data
const testSchoolInput: CreateSchoolInput = {
  name: 'Test Elementary School',
  address: '123 Education Street, Learning City',
  phone: '+62-21-123-4567',
  email: 'admin@testelemschool.edu'
};

const testSchoolInputMinimal: CreateSchoolInput = {
  name: 'Minimal School',
  address: '456 Simple Road',
  phone: null,
  email: null
};

describe('createSchool', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a school with complete data', async () => {
    const result = await createSchool(testSchoolInput);

    // Verify returned data
    expect(result.name).toEqual('Test Elementary School');
    expect(result.address).toEqual('123 Education Street, Learning City');
    expect(result.phone).toEqual('+62-21-123-4567');
    expect(result.email).toEqual('admin@testelemschool.edu');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a school with minimal data (nullable fields)', async () => {
    const result = await createSchool(testSchoolInputMinimal);

    // Verify returned data
    expect(result.name).toEqual('Minimal School');
    expect(result.address).toEqual('456 Simple Road');
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save school to database', async () => {
    const result = await createSchool(testSchoolInput);

    // Query database directly to verify persistence
    const schools = await db.select()
      .from(schoolsTable)
      .where(eq(schoolsTable.id, result.id))
      .execute();

    expect(schools).toHaveLength(1);
    expect(schools[0].name).toEqual('Test Elementary School');
    expect(schools[0].address).toEqual('123 Education Street, Learning City');
    expect(schools[0].phone).toEqual('+62-21-123-4567');
    expect(schools[0].email).toEqual('admin@testelemschool.edu');
    expect(schools[0].created_at).toBeInstanceOf(Date);
    expect(schools[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple school creation', async () => {
    const school1 = await createSchool(testSchoolInput);
    const school2 = await createSchool(testSchoolInputMinimal);

    expect(school1.id).not.toEqual(school2.id);
    expect(school1.name).toEqual('Test Elementary School');
    expect(school2.name).toEqual('Minimal School');

    // Verify both schools exist in database
    const allSchools = await db.select().from(schoolsTable).execute();
    expect(allSchools).toHaveLength(2);
  });
});

describe('getSchool', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no school exists', async () => {
    const result = await getSchool();
    expect(result).toBeNull();
  });

  it('should return the first school when schools exist', async () => {
    // Create multiple schools
    await createSchool(testSchoolInput);
    await createSchool(testSchoolInputMinimal);

    const result = await getSchool();
    
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Test Elementary School');
    expect(result!.address).toEqual('123 Education Street, Learning City');
    expect(result!.phone).toEqual('+62-21-123-4567');
    expect(result!.email).toEqual('admin@testelemschool.edu');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return consistent results on multiple calls', async () => {
    await createSchool(testSchoolInput);

    const result1 = await getSchool();
    const result2 = await getSchool();

    expect(result1).toEqual(result2);
    expect(result1!.id).toEqual(result2!.id);
  });
});

describe('updateSchool', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a school', async () => {
    // Create initial school
    const created = await createSchool(testSchoolInput);

    const updateInput: UpdateSchoolInput = {
      id: created.id,
      name: 'Updated School Name',
      address: 'New Address 789',
      phone: '+62-21-999-8888',
      email: 'updated@school.edu'
    };

    const result = await updateSchool(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated School Name');
    expect(result.address).toEqual('New Address 789');
    expect(result.phone).toEqual('+62-21-999-8888');
    expect(result.email).toEqual('updated@school.edu');
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should update only specified fields', async () => {
    // Create initial school
    const created = await createSchool(testSchoolInput);

    const updateInput: UpdateSchoolInput = {
      id: created.id,
      name: 'Partially Updated School'
    };

    const result = await updateSchool(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Partially Updated School');
    expect(result.address).toEqual(created.address); // Should remain unchanged
    expect(result.phone).toEqual(created.phone); // Should remain unchanged
    expect(result.email).toEqual(created.email); // Should remain unchanged
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should update nullable fields to null', async () => {
    // Create initial school
    const created = await createSchool(testSchoolInput);

    const updateInput: UpdateSchoolInput = {
      id: created.id,
      phone: null,
      email: null
    };

    const result = await updateSchool(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual(created.name); // Should remain unchanged
    expect(result.address).toEqual(created.address); // Should remain unchanged
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should persist updates to database', async () => {
    // Create initial school
    const created = await createSchool(testSchoolInput);

    const updateInput: UpdateSchoolInput = {
      id: created.id,
      name: 'Database Updated School'
    };

    await updateSchool(updateInput);

    // Verify database persistence
    const schools = await db.select()
      .from(schoolsTable)
      .where(eq(schoolsTable.id, created.id))
      .execute();

    expect(schools).toHaveLength(1);
    expect(schools[0].name).toEqual('Database Updated School');
    expect(schools[0].address).toEqual(created.address);
  });

  it('should throw error when school does not exist', async () => {
    const updateInput: UpdateSchoolInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent School'
    };

    await expect(updateSchool(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create initial school
    const created = await createSchool(testSchoolInput);

    const updateInput: UpdateSchoolInput = {
      id: created.id
      // No fields to update
    };

    const result = await updateSchool(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual(created.name);
    expect(result.address).toEqual(created.address);
    expect(result.phone).toEqual(created.phone);
    expect(result.email).toEqual(created.email);
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });
});