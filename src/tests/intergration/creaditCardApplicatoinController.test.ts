// tests/integration/creditCardApplicationController.test.ts
import request from 'supertest';
import express from 'express';
import { createExpressServer } from 'routing-controllers';
import { CreditCardApplicationController } from '../../controllers/creditcardapplicationController';

describe('CreditCardApplicationController (Integration)', () => {
  let app: express.Express;
  
  beforeAll(() => {
    app = createExpressServer({
      controllers: [CreditCardApplicationController],
      routePrefix: '/api'
    });
  });
  
  describe('GET /api/card-applications', () => {
    it('should return all applications', async () => {
      const response = await request(app).get('/api/card-applications');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('POST /api/card-applications', () => {
    it('should create a new application', async () => {
      const newApplication = {
        applicantName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '555-1234',
        address: '123 Main St',
        income: 75000,
        employmentStatus: 'FULL_TIME',
        creditCardType: 'PREMIUM',
        status: 'PENDING' // Add the status field
      };
      
      const response = await request(app)
        .post('/api/card-applications')
        .send(newApplication);
      
      expect(response.status).toBe(201);
      expect(response.body.applicantName).toBe(newApplication.applicantName);
      expect(response.body.id).toBeDefined();
    });
    
    it('should return 400 if required fields are missing', async () => {
      const invalidApplication = {
        email: 'john@example.com' // Missing required fields
      };
      
      const response = await request(app)
        .post('/api/card-applications')
        .send(invalidApplication);
      
      expect(response.status).toBe(400);
    });
  });
  
  // Additional tests for other endpoints...
});