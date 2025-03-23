// src/services/creditcardapplicationService.ts
import { CreditCardApplication, CreditCardApplicationStatus } from '../models/interfaces/creditcardapplication.interface';
import { CreditCardApplicationRepository } from '../repositories/creditcardapplicationRepository';

// Valid status values: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'



export class CreditCardApplicationService {
  private creditCardApplicationRepository: CreditCardApplicationRepository;
  
  constructor() {
    this.creditCardApplicationRepository = new CreditCardApplicationRepository();
  }

  // Get all credit card applications
  async getAll(params?: any): Promise<CreditCardApplication[]> {
    return this.creditCardApplicationRepository.findAll(params);
  }
  
  // Get credit card application by ID
  async getById(id: string): Promise<CreditCardApplication | undefined> {
    return this.creditCardApplicationRepository.findById(id);
  }
  
  // Create new credit card application
  async create(data: any): Promise<CreditCardApplication> {
    return this.creditCardApplicationRepository.create(data);
  }
  
  // Update credit card application
  async update(id: string, data: any): Promise<CreditCardApplication | undefined> {
    return this.creditCardApplicationRepository.update(id, data);
  }
  
  // Update credit card application status
  async updateStatus(id: string, status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'): Promise<CreditCardApplication | undefined> {
    return this.creditCardApplicationRepository.updateStatus(id, status);
  }
  
  // Delete credit card application
  async delete(id: string): Promise<boolean> {
    return this.creditCardApplicationRepository.delete(id);
  }
}
