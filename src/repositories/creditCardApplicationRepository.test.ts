// src/tests/repositories/creditCardApplicationRepository.test.ts

import { CreditCardApplication } from "../models/interfaces/creditcardapplication.interface";
import { CreditCardApplicationRepository } from "./creditcardapplicationRepository";


describe('CreditCardApplicationRepository', () => {
  let repository: CreditCardApplicationRepository;
  
  // Sample application data for testing
  const sampleApplication: Omit<CreditCardApplication, 'id' | 'createdAt' | 'updatedAt'> = {
    applicantName: 'Test User',
    email: 'test@example.com',
    phoneNumber: '555-1234',
    address: '123 Test St',
    income: 75000,
    employmentStatus: 'FULL_TIME',
    creditCardType: 'BASIC',
    status: 'PENDING'
  };
  
  beforeEach(() => {
    // Reset the repository and in-memory storage before each test
    jest.resetModules();

    
    // Access the private in-memory storage and reset it
    // This is a bit hacky but necessary for testing an in-memory repository
    const module = jest.requireActual('./creditcardapplicationRepository');
    repository = new module.CreditCardApplicationRepository();
  
    // Reset shared state directly
    module.creditCardApplications = [];
    module.nextId = 1;
  });
  
  describe('findAll', () => {
    it('should return empty array when no applications exist', async () => {
      const results = await repository.findAll();
      expect(results).toEqual([]);
    });
    
    it('should return all applications', async () => {
      // Create a few applications first
      const app1 = await repository.create({...sampleApplication, applicantName: 'User 1'});
      const app2 = await repository.create({...sampleApplication, applicantName: 'User 2'});
      
      const results = await repository.findAll();
      
      expect(results.length).toBe(2);
      expect(results).toContainEqual(app1);
      expect(results).toContainEqual(app2);
    });
    
    // TODO: Test filtering when implemented
  });
  
  describe('findById', () => {
    it('should return undefined for non-existent id', async () => {
      const result = await repository.findById('999');
      expect(result).toBeUndefined();
    });
    
    it('should return application when found', async () => {
      // Create an application first
      const created = await repository.create(sampleApplication);
      
      const result = await repository.findById(created.id);
      
      expect(result).toEqual(created);
    });
  });
  
  describe('create', () => {
    it('should create and return a new application with auto-generated fields', async () => {
      const now = new Date();
      // Mock date for consistent testing
      jest.spyOn(global, 'Date').mockImplementation(() => now as unknown as Date);

      
      const result = await repository.create(sampleApplication);
      
      // Check that ID and timestamps were added
      expect(result.id).toBe('1');
      expect(result.createdAt).toBe(now.toISOString());
      expect(result.updatedAt).toBe(now.toISOString());
      
      // Check that application data was included
      expect(result.applicantName).toBe(sampleApplication.applicantName);
      expect(result.email).toBe(sampleApplication.email);
      
      // Check that ID increments for subsequent applications
      const result2 = await repository.create({...sampleApplication, email: 'test2@example.com'});
      expect(result2.id).toBe('2');
      
      // Restore Date
      jest.restoreAllMocks();
    });
    
    it('should add application to storage', async () => {
      await repository.create(sampleApplication);
      
      const allApplications = await repository.findAll();
      expect(allApplications.length).toBe(1);
    });
  });
  
  describe('update', () => {
    it('should return undefined for non-existent application', async () => {
      const result = await repository.update('999', { applicantName: 'Updated Name' });
      expect(result).toBeUndefined();
    });
    
    it('should update and return application when found', async () => {
      // Create an application first
      const created = await repository.create(sampleApplication);
      
      // Mock date for consistent testing
      const updateDate = new Date(2025, 3, 20);
      jest.spyOn(global, 'Date').mockImplementation(() => updateDate as unknown as Date);
      
      const updateData = {
        applicantName: 'Updated Name',
        income: 85000
      };
      
      const result = await repository.update(created.id, updateData);
      
      // Check that fields were updated
      expect(result?.applicantName).toBe(updateData.applicantName);
      expect(result?.income).toBe(updateData.income);
      
      // Check that other fields remain unchanged
      expect(result?.email).toBe(created.email);
      
      // Check that updatedAt was changed
      expect(result?.updatedAt).toBe(updateDate.toISOString());
      
      // Check that createdAt was not changed
      expect(result?.createdAt).toBe(created.createdAt);
      
      // Restore Date
      jest.restoreAllMocks();
    });
  });
  
  describe('updateStatus', () => {
    it('should return undefined for non-existent application', async () => {
      const result = await repository.updateStatus('999', 'APPROVED');
      expect(result).toBeUndefined();
    });
    
    it('should update status and return application when found', async () => {
      // Create an application first
      const created = await repository.create(sampleApplication);
      
      // Mock date for consistent testing
      const updateDate = new Date(2025, 3, 20);
      jest.spyOn(global, 'Date').mockImplementation(() => updateDate as unknown as Date);
      
      const result = await repository.updateStatus(created.id, 'APPROVED');
      
      // Check that status was updated
      expect(result?.status).toBe('APPROVED');
      
      // Check that other fields remain unchanged
      expect(result?.applicantName).toBe(created.applicantName);
      
      // Check that updatedAt was changed
      expect(result?.updatedAt).toBe(updateDate.toISOString());
      
      // Restore Date
      jest.restoreAllMocks();
    });
  });
  
  describe('delete', () => {
    it('should return false for non-existent application', async () => {
      const result = await repository.delete('999');
      expect(result).toBe(false);
    });
    
    it('should delete application and return true when found', async () => {
      // Create an application first
      const created = await repository.create(sampleApplication);
      
      // Delete the application
      const result = await repository.delete(created.id);
      
      // Check that delete was successful
      expect(result).toBe(true);
      
      // Verify application is no longer in storage
      const findResult = await repository.findById(created.id);
      expect(findResult).toBeUndefined();
    });
    
    it('should not affect other applications when deleting', async () => {
      // Create two applications
      const app1 = await repository.create({...sampleApplication, applicantName: 'User 1'});
      const app2 = await repository.create({...sampleApplication, applicantName: 'User 2'});
      
      // Delete the first application
      await repository.delete(app1.id);
      
      // Check that only the first application was deleted
      const allApplications = await repository.findAll();
      expect(allApplications.length).toBe(1);
      expect(allApplications[0].id).toBe(app2.id);
    });
  });
});