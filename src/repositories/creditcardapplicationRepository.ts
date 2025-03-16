// src/repositories/creditcardapplicationRepository.ts
import { CreditCardApplication } from '../models/interfaces/creditcardapplication.interface';

// In-memory storage (will replace with database later)
let creditCardApplications: CreditCardApplication[] = [];
let nextId = 1;

export class CreditCardApplicationRepository {
  // Find all credit card applications
  async findAll(params?: any): Promise<CreditCardApplication[]> {
    // TODO: Add filtering based on params
    return creditCardApplications;
  }
  
  // Find credit card application by ID
  async findById(id: string): Promise<CreditCardApplication | undefined> {
    return creditCardApplications.find(item => item.id === id);
  }
  
  // Create new credit card application
  async create(data: any): Promise<CreditCardApplication> {
    const newCreditCardApplication: CreditCardApplication = {
      id: String(nextId++),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    creditCardApplications.push(newCreditCardApplication);
    return newCreditCardApplication;
  }
  
  // Update credit card application
  async update(id: string, data: any): Promise<CreditCardApplication | undefined> {
    const index = creditCardApplications.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    creditCardApplications[index] = {
      ...creditCardApplications[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return creditCardApplications[index];
  }
  
  // Update credit card application status
  async updateStatus(id: string, status: string): Promise<CreditCardApplication | undefined> {
    const index = creditCardApplications.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    creditCardApplications[index] = {
      ...creditCardApplications[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    return creditCardApplications[index];
  }
  
  // Delete credit card application
  async delete(id: string): Promise<boolean> {
    const index = creditCardApplications.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }
    
    creditCardApplications.splice(index, 1);
    return true;
  }
}
