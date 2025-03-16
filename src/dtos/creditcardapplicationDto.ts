// src/dtos/creditcardapplicationDto.ts
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, MinLength, IsIn, IsArray } from 'class-validator';
import { ApiProperty } from '../decorators/api-property.decorator';

export class CreateCreditCardApplicationDto {
  /**
   * Full name of the applicant
   */
  @ApiProperty({
    description: "Full name of the applicant",
    required: true,
    type: 'string'
  })
  @IsString()
  @MinLength(1)
  applicantName: string;

  /**
   * Email address of the applicant
   */
  @ApiProperty({
    description: "Email address of the applicant",
    required: true,
    type: 'string'
  })
  @IsString()
  @MinLength(1)
  email: string;

  /**
   * Contact phone number
   */
  @ApiProperty({
    description: "Contact phone number",
    required: true,
    type: 'string'
  })
  @IsString()
  @MinLength(1)
  phoneNumber: string;

  /**
   * Physical address
   */
  @ApiProperty({
    description: "Physical address",
    required: true,
    type: 'string'
  })
  @IsString()
  @MinLength(1)
  address: string;

  /**
   * Annual income in USD
   */
  @ApiProperty({
    description: "Annual income in USD",
    required: true,
    type: 'number'
  })
  @IsNumber()
  income: number;

  /**
   * Current employment status
   */
  @ApiProperty({
    description: "Current employment status",
    required: true,
    enum: ['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED'],
    type: 'string'
  })
  @IsString()
  @IsIn(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED'])
  employmentStatus: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

  /**
   * Type of credit card being applied for
   */
  @ApiProperty({
    description: "Type of credit card being applied for",
    required: true,
    enum: ['BASIC', 'PREMIUM', 'PLATINUM'],
    type: 'string'
  })
  @IsString()
  @IsIn(['BASIC', 'PREMIUM', 'PLATINUM'])
  creditCardType: 'BASIC' | 'PREMIUM' | 'PLATINUM';

  /**
   * Current status of the application
   */
  @ApiProperty({
    description: "Current status of the application",
    required: true,
    enum: ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'],
    type: 'string'
  })
  @IsString()
  @IsIn(['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'])
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

  /**
   * Applicant's credit score (optional, retrieved during processing)
   */
  @ApiProperty({
    description: "Applicant's credit score (optional, retrieved during processing)",
    required: false,
    type: 'number'
  })
  @IsNumber()
  @IsOptional()
  creditScore?: number;

  /**
   * References to uploaded documents
   */
  @ApiProperty({
    description: "References to uploaded documents",
    required: false,
    type: 'array',
    items: {
      type: 'string'
    }
  })
  @IsArray()
  @IsOptional()
  documents?: string[];

  /**
   * Additional notes for the application
   */
  @ApiProperty({
    description: "Additional notes for the application",
    required: false,
    type: 'string'
  })
  @IsString()
  @IsOptional()
  notes?: string;

}

export class UpdateCreditCardApplicationDto {
  /**
   * Full name of the applicant
   */
  @ApiProperty({
    description: "Full name of the applicant",
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  applicantName?: string;

  /**
   * Email address of the applicant
   */
  @ApiProperty({
    description: "Email address of the applicant",
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  email?: string;

  /**
   * Contact phone number
   */
  @ApiProperty({
    description: "Contact phone number",
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /**
   * Physical address
   */
  @ApiProperty({
    description: "Physical address",
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Annual income in USD
   */
  @ApiProperty({
    description: "Annual income in USD",
    required: false,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  income?: number;

  /**
   * Current employment status
   */
  @ApiProperty({
    description: "Current employment status",
    required: false,
    enum: ['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED'],
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @IsIn(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED'])
  employmentStatus?: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

  /**
   * Type of credit card being applied for
   */
  @ApiProperty({
    description: "Type of credit card being applied for",
    required: false,
    enum: ['BASIC', 'PREMIUM', 'PLATINUM'],
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @IsIn(['BASIC', 'PREMIUM', 'PLATINUM'])
  creditCardType?: 'BASIC' | 'PREMIUM' | 'PLATINUM';

  /**
   * Current status of the application
   */
  @ApiProperty({
    description: "Current status of the application",
    required: false,
    enum: ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'],
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

  /**
   * Applicant's credit score (optional, retrieved during processing)
   */
  @ApiProperty({
    description: "Applicant's credit score (optional, retrieved during processing)",
    required: false,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  creditScore?: number;

  /**
   * References to uploaded documents
   */
  @ApiProperty({
    description: "References to uploaded documents",
    required: false,
    type: 'array',
    items: {
      type: 'string'
    }
  })
  @IsOptional()
  @IsArray()
  documents?: string[];

  /**
   * Additional notes for the application
   */
  @ApiProperty({
    description: "Additional notes for the application",
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  notes?: string;

}
