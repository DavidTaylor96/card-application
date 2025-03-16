
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
  import { CreditCardApplicationService } from '../services/creditcardapplicationService';
  
  // Import entity and DTOs
  import { CreditCardApplication } from '../models/interfaces/creditcardapplication.interface';
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
    @Log()
    @Get('/')
    async getAllApplications(@QueryParams() params: any): Promise<CreditCardApplication[]> {
      return await this.creditCardApplicationService.getAll(params);
    }
    /**
     * Retrieve a specific credit card application by ID
     */
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
    @Post('/')
    @HttpCode(201)
    async createApplication(@Body() data: CreateCreditCardApplicationDto): Promise<CreditCardApplication> {
      return await this.creditCardApplicationService.create(data);
    }
    /**
     * Update an existing credit card application
     */
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
    @Patch('/:id/status')
    async updateApplicationStatus(@Param('id') id: string, @Body() data: { status: string }): Promise<CreditCardApplication> {
      const result = await this.creditCardApplicationService.updateStatus(id, data.status);
      
      if (!result) {
        throw new NotFoundError('Resource not found');
      }
      
      return result;
    }
    /**
     * Delete a credit card application
     */
    @Delete('/:id')
    async deleteApplication(@Param('id') id: string): Promise<{ success: boolean }> {
      const result = await this.creditCardApplicationService.delete(id);
      
      if (!result) {
        throw new NotFoundError('Resource not found');
      }
      
      return { success: true };
    }
  }
  