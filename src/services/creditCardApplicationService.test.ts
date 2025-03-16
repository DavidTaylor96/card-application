// services/creditCardApplicationService.test.ts

import { CreditCardApplication } from "../models/interfaces/creditcardapplication.interface";
import { CreditCardApplicationRepository } from "../repositories/creditcardapplicationRepository";
import { CreditCardApplicationService } from "./creditcardapplicationService";

// Mock the repository
jest.mock('../repositories/creditCardApplicationRepository');

describe('CreditCardApplicationService', () => {
  let service: CreditCardApplicationService;
  let mockRepository: jest.Mocked<CreditCardApplicationRepository>;
  
  beforeEach(() => {
    mockRepository = new CreditCardApplicationRepository() as jest.Mocked<CreditCardApplicationRepository>;
    service = new CreditCardApplicationService();
    // Replace the real repository with the mock
    (service as any).creditCardApplicationRepository = mockRepository;
  });
  
  describe('getById', () => {
    it('should return application when found', async () => {
      const mockApp: CreditCardApplication = {
        id: '1',
        applicantName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '555-1234',
        address: '123 Test St',
        income: 75000,
        employmentStatus: 'FULL_TIME',
        creditCardType: 'BASIC',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockRepository.findById.mockResolvedValue(mockApp);
      
      const result = await service.getById('1');
      
      expect(result).toEqual(mockApp);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
    
    it('should return undefined when not found', async () => {
      mockRepository.findById.mockResolvedValue(undefined);
      
      const result = await service.getById('999');
      
      expect(result).toBeUndefined();
    });
  });
  

  // TODO: test the delete method
  describe('delete method', () => {
    it('should return true when application is successfully deleted', async () => {
      // Arrange
      const idToDelete = '1';
      mockRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await service.delete(idToDelete);
      
      // Assert
      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(idToDelete);
    });
    
    it('should return false when application is not found', async () => {
      // Arrange
      const nonExistentId = '999';
      mockRepository.delete.mockResolvedValue(false);
      
      // Act
      const result = await service.delete(nonExistentId);
      
      // Assert
      expect(result).toBe(false);
      expect(mockRepository.delete).toHaveBeenCalledWith(nonExistentId);
    });
    
    it('should handle errors during deletion', async () => {
      // Arrange
      const idToDelete = '1';
      const errorMessage = 'Database connection error';
      mockRepository.delete.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.delete(idToDelete)).rejects.toThrow(Error);
      expect(mockRepository.delete).toHaveBeenCalledWith(idToDelete);
    });
  });

  describe('update method', () => {
    const mockApplication: CreditCardApplication = {
      id: '1',
      applicantName: 'Original Name',
      email: 'original@example.com',
      phoneNumber: '555-1234',
      address: '123 Main St',
      income: 75000,
      employmentStatus: 'FULL_TIME',
      creditCardType: 'BASIC',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updateData = {
      applicantName: 'Updated Name',
      income: 85000,
      address: '456 Oak St'
    };

    it('should return updated application when successful', async () => {
      // Arrange
      const updatedApp = { ...mockApplication, ...updateData };
      mockRepository.update.mockResolvedValue(updatedApp);

      // Act
      const result = await service.update('1', updateData);

      // Assert
      expect(result).toEqual(updatedApp);
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should return undefined when application not found', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await service.update('999', updateData);

      // Assert
      expect(result).toBeUndefined();
      expect(mockRepository.update).toHaveBeenCalledWith('999', updateData);
    });

    it('should handle errors during update', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mockRepository.update.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.update('1', updateData))
        .rejects
        .toThrow(errorMessage);
    });
  });

  describe('updateStatus method', () => {
    const mockApplication: CreditCardApplication = {
      id: '1',
      applicantName: 'Test User',
      email: 'test@example.com',
      phoneNumber: '555-1234',
      address: '123 Main St',
      income: 75000,
      employmentStatus: 'FULL_TIME',
      creditCardType: 'BASIC',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should return updated application when status changes successfully', async () => {
      // Arrange
      const updatedApp: any = { ...mockApplication, status: 'APPROVED' };
      mockRepository.updateStatus.mockResolvedValue(updatedApp);

      // Act
      const result = await service.updateStatus('1', 'APPROVED');

      // Assert
      expect(result).toEqual(updatedApp);
      expect(mockRepository.updateStatus).toHaveBeenCalledWith('1', 'APPROVED');
    });

    it('should return undefined when application not found', async () => {
      // Arrange
      mockRepository.updateStatus.mockResolvedValue(undefined);

      // Act
      const result = await service.updateStatus('999', 'APPROVED');

      // Assert
      expect(result).toBeUndefined();
      expect(mockRepository.updateStatus).toHaveBeenCalledWith('999', 'APPROVED');
    });

    it('should handle errors during status update', async () => {
      // Arrange
      const errorMessage = 'Update failed';
      mockRepository.updateStatus.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.updateStatus('1', 'REJECTED'))
        .rejects
        .toThrow(errorMessage);
    });

    it('should validate status parameter', async () => {
      // Arrange
      const invalidStatus = 'INVALID_STATUS' as any;
      
      // Act & Assert
      await expect(service.updateStatus('1', invalidStatus))
        .rejects
        .toThrow('Invalid status value');
    });
  });

});