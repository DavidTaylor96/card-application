
import { 
  JsonController, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete,
  Param, 
  Body, 
  QueryParams,
  HttpCode, 
  NotFoundError 
} from 'routing-controllers';
import { Log } from '../decorators/log.decorator';
import { OpenAPI } from 'routing-controllers-openapi';
import { CreditCardApplicationService } from '../services/creditcardapplicationService';

// Import entity and DTOs
import { CreditCardApplication, CreditCardApplicationStatus } from '../models/interfaces/creditcardapplication.interface';
import { CreateCreditCardApplicationDto, UpdateCreditCardApplicationDto } from '../dtos/creditcardapplicationDto';

/**
 * CreditCardApplication - API Controller
 * Generated automatically
 */
@JsonController('/card-applications')
export class CreditCardApplicationController {
  private creditCardApplicationService: CreditCardApplicationService;
  
  constructor() {
    this.creditCardApplicationService = new CreditCardApplicationService();
  }

  /**
   * Retrieve all credit card applications
   */
  @OpenAPI({
    summary: 'Retrieve all credit card applications',
    description: 'Retrieve all credit card applications',
    responses: {
      200: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    }
  })
  @Log()
  @Get('/')
  async getAllApplications(@QueryParams() params: any): Promise<CreditCardApplication[]> {
    return await this.creditCardApplicationService.getAll(params);
  }
  /**
   * Retrieve a specific credit card application by ID
   */
  @OpenAPI({
    summary: 'Retrieve a specific credit card application by ID',
    description: 'Retrieve a specific credit card application by ID',
    responses: {
      200: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    }
  })
  @Log()
  @Get('/:id')
  async getApplicationById(@Param('id') id: string): Promise<CreditCardApplication> {
    const result = await this.creditCardApplicationService.getById(id);
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return result;
  }
  /**
   * Submit a new credit card application
   */
  @OpenAPI({
    summary: 'Submit a new credit card application',
    description: 'Submit a new credit card application',
    responses: {
      201: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    }
  })
  @Post('/')
  @HttpCode(201)
  async createApplication(@Body() data: CreateCreditCardApplicationDto): Promise<CreditCardApplication> {
    return await this.creditCardApplicationService.create(data);
  }
  /**
   * Update an existing credit card application
   */
  @OpenAPI({
    summary: 'Update an existing credit card application',
    description: 'Update an existing credit card application',
    responses: {
      200: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    }
  })
  @Patch('/:id')
  async updateApplication(@Param('id') id: string, @Body() data: UpdateCreditCardApplicationDto): Promise<CreditCardApplication> {
    const result = await this.creditCardApplicationService.update(id, data);
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return result;
  }
  /**
   * Update the status of a credit card application
   */
  @OpenAPI({
    summary: 'Update the status of a credit card application',
    description: 'Update the status of a credit card application',
    responses: {
      200: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    },
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED']
              }
            },
            required: ['status']
          }
        }
      }
    }
  })
  @Patch('/:id/status')
  async updateApplicationStatus(@Param('id') id: string, @Body() data: { status: CreditCardApplicationStatus }): Promise<CreditCardApplication> {
    const result = await this.creditCardApplicationService.updateStatus(id, data.status);
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return result;
  }
  /**
   * Delete a credit card application
   */
  @OpenAPI({
    summary: 'Delete a credit card application',
    description: 'Delete a credit card application',
    responses: {
      200: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    }
  })
  @Delete('/:id')
  async deleteApplication(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.creditCardApplicationService.delete(id);
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return { success: true };
  }
}
