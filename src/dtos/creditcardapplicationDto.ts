// src/dtos/creditcardapplicationDto.ts
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, MinLength, IsIn } from 'class-validator';

export class CreateCreditCardApplicationDto {
  /**
   * Full name of the applicant
   */
  @IsString()
  @MinLength(1)
  applicantName: string;

  /**
   * Email address of the applicant
   */
  @IsString()
  @MinLength(1)
  email: string;

  /**
   * Contact phone number
   */
  @IsString()
  @MinLength(1)
  phoneNumber: string;

  /**
   * Physical address
   */
  @IsString()
  @MinLength(1)
  address: string;

  /**
   * Annual income in USD
   */
  @IsNumber()
  income: number;

  /**
   * Current employment status
   */
  @IsString()
  @IsIn(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED'])
  employmentStatus: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

  /**
   * Type of credit card being applied for
   */
  @IsString()
  @IsIn(['BASIC', 'PREMIUM', 'PLATINUM'])
  creditCardType: 'BASIC' | 'PREMIUM' | 'PLATINUM';

  /**
   * Current status of the application
   */
  @IsString()
  @IsIn(['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'])
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

  /**
   * Applicant's credit score (optional, retrieved during processing)
   */
  @IsNumber()
  @IsOptional()
  creditScore?: number;

  /**
   * References to uploaded documents
   */
  @IsOptional()
  documents?: string[];

  /**
   * Additional notes for the application
   */
  @IsString()
  @IsOptional()
  notes?: string;

}

export class UpdateCreditCardApplicationDto {
  /**
   * Full name of the applicant
   */
  @IsOptional()
  @IsString()
  applicantName?: string;

  /**
   * Email address of the applicant
   */
  @IsOptional()
  @IsString()
  email?: string;

  /**
   * Contact phone number
   */
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /**
   * Physical address
   */
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Annual income in USD
   */
  @IsOptional()
  @IsNumber()
  income?: number;

  /**
   * Current employment status
   */
  @IsOptional()
  @IsString()
  @IsIn(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED'])
  employmentStatus?: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

  /**
   * Type of credit card being applied for
   */
  @IsOptional()
  @IsString()
  @IsIn(['BASIC', 'PREMIUM', 'PLATINUM'])
  creditCardType?: 'BASIC' | 'PREMIUM' | 'PLATINUM';

  /**
   * Current status of the application
   */
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

  /**
   * Applicant's credit score (optional, retrieved during processing)
   */
  @IsOptional()
  @IsNumber()
  creditScore?: number;

  /**
   * References to uploaded documents
   */
  @IsOptional()
  documents?: string[];

  /**
   * Additional notes for the application
   */
  @IsOptional()
  @IsString()
  notes?: string;

}
