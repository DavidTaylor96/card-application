// src/tests/controllers/creditCardApplicationController.test.ts

import { NotFoundError } from "routing-controllers";
import { CreateCreditCardApplicationDto, UpdateCreditCardApplicationDto } from "../dtos/creditcardapplicationDto";
import { CreditCardApplication, CreditCardApplicationStatus } from "../models/interfaces/creditcardapplication.interface";
import { CreditCardApplicationService } from "../services/creditcardapplicationService";
import { CreditCardApplicationController } from "./creditcardapplicationController";

// Mock the service
jest.mock('../services/creditcardapplicationService');

describe('CreditCardApplicationController', () => {
  let controller: CreditCardApplicationController;
  let mockService: jest.Mocked<CreditCardApplicationService>;
  
  const mockApplication: CreditCardApplication = {
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
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock service
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<CreditCardApplicationService>;
    
    // Create controller instance and inject mock service
    controller = new CreditCardApplicationController();
    (controller as any).creditCardApplicationService = mockService;
  });

  describe('getAllApplications', () => {
    it('should return all applications', async () => {
      // Arrange
      const mockApplications = [mockApplication];
      mockService.getAll.mockResolvedValue(mockApplications);
      
      // Act
      const result = await controller.getAllApplications({});
      
      // Assert
      expect(result).toEqual(mockApplications);
      expect(mockService.getAll).toHaveBeenCalledWith({});
    });
    
    it('should handle empty result', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([]);
      
      // Act
      const result = await controller.getAllApplications({});
      
      // Assert
      expect(result).toEqual([]);
      expect(mockService.getAll).toHaveBeenCalledWith({});
    });
    
    it('should pass query parameters to service', async () => {
      // Arrange
      const params = { status: 'PENDING' };
      mockService.getAll.mockResolvedValue([]);
      
      // Act
      await controller.getAllApplications(params);
      
      // Assert
      expect(mockService.getAll).toHaveBeenCalledWith(params);
    });
  });

  describe('getApplicationById', () => {
    it('should return application when found', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(mockApplication);
      
      // Act
      const result = await controller.getApplicationById('1');
      
      // Assert
      expect(result).toEqual(mockApplication);
      expect(mockService.getById).toHaveBeenCalledWith('1');
    });
    
    it('should throw NotFoundError when application not found', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(undefined);
      
      // Act & Assert
      await expect(controller.getApplicationById('999')).rejects.toThrow(NotFoundError);
      expect(mockService.getById).toHaveBeenCalledWith('999');
    });
  });

  describe('createApplication', () => {
    it('should create and return a new application', async () => {
      // Arrange
      const createDto: CreateCreditCardApplicationDto = {
        applicantName: 'New User',
        email: 'new@example.com',
        phoneNumber: '555-5678',
        address: '456 New St',
        income: 80000,
        employmentStatus: 'FULL_TIME',
        creditCardType: 'PREMIUM',
        status: 'PENDING'
      };
      const createdApplication = { ...createDto, id: '2', createdAt: mockApplication.createdAt, updatedAt: mockApplication.updatedAt };
      mockService.create.mockResolvedValue(createdApplication as CreditCardApplication);
      
      // Act
      const result = await controller.createApplication(createDto);
      
      // Assert
      expect(result).toEqual(createdApplication);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateApplication', () => {
    it('should update and return application when found', async () => {
      // Arrange
      const updateDto: Partial<UpdateCreditCardApplicationDto> = {
        applicantName: 'Updated User',
        income: 90000
      };
      const updatedApplication = { ...mockApplication, ...updateDto };
      mockService.update.mockResolvedValue(updatedApplication as CreditCardApplication);
      
      // Act
      const result = await controller.updateApplication('1', updateDto as UpdateCreditCardApplicationDto);
      
      // Assert
      expect(result).toEqual(updatedApplication);
      expect(mockService.update).toHaveBeenCalledWith('1', updateDto);
    });
    
    it('should throw NotFoundError when application to update not found', async () => {
      // Arrange
      mockService.update.mockResolvedValue(undefined);
      const updateDto: Partial<UpdateCreditCardApplicationDto> = { 
        applicantName: 'Updated User' 
      };
      
      // Act & Assert
      await expect(controller.updateApplication('999', updateDto as UpdateCreditCardApplicationDto))
        .rejects.toThrow(NotFoundError);
      expect(mockService.update).toHaveBeenCalledWith('999', updateDto);
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update status and return application when found', async () => {
      // Arrange
      const newStatus: CreditCardApplicationStatus = 'APPROVED';
      const updatedApplication = { ...mockApplication, status: newStatus };
      mockService.updateStatus.mockResolvedValue(updatedApplication as CreditCardApplication);
      
      // Act
      const result = await controller.updateApplicationStatus('1', { status: newStatus });
      
      // Assert
      expect(result).toEqual(updatedApplication);
      expect(mockService.updateStatus).toHaveBeenCalledWith('1', newStatus);
    });
    
    it('should throw NotFoundError when application to update status not found', async () => {
      // Arrange
      mockService.updateStatus.mockResolvedValue(undefined);
      
      // Act & Assert
      await expect(controller.updateApplicationStatus('999', { status: 'REJECTED' }))
        .rejects.toThrow(NotFoundError);
      expect(mockService.updateStatus).toHaveBeenCalledWith('999', 'REJECTED');
    });
  });

  describe('deleteApplication', () => {
    it('should delete and return success when application found', async () => {
      // Arrange
      mockService.delete.mockResolvedValue(true);
      
      // Act
      const result = await controller.deleteApplication('1');
      
      // Assert
      expect(result).toEqual({ success: true });
      expect(mockService.delete).toHaveBeenCalledWith('1');
    });
    
    it('should throw NotFoundError when application to delete not found', async () => {
      // Arrange
      mockService.delete.mockResolvedValue(false);
      
      // Act & Assert
      await expect(controller.deleteApplication('999'))
        .rejects.toThrow(NotFoundError);
      expect(mockService.delete).toHaveBeenCalledWith('999');
    });
    
    it('should propagate errors from service', async () => {
      // Arrange
      const error = new Error('Database connection error');
      mockService.delete.mockRejectedValue(error);
      
      // Act & Assert
      await expect(controller.deleteApplication('1'))
        .rejects.toThrow(error);
      expect(mockService.delete).toHaveBeenCalledWith('1');
    });
  });
});