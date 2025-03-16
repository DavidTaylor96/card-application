// src/models/interfaces/creditcardapplication.interface.ts
export interface CreditCardApplication {
  /**
   * Full name of the applicant
   */
  applicantName: string;
  /**
   * Email address of the applicant
   */
  email: string;
  /**
   * Contact phone number
   */
  phoneNumber: string;
  /**
   * Physical address
   */
  address: string;
  /**
   * Annual income in USD
   */
  income: number;
  /**
   * Current employment status
   */
  employmentStatus: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
  /**
   * Type of credit card being applied for
   */
  creditCardType: 'BASIC' | 'PREMIUM' | 'PLATINUM';
  /**
   * Current status of the application
   */
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  /**
   * Applicant's credit score (optional, retrieved during processing)
   */
  creditScore?: number;
  /**
   * References to uploaded documents
   */
  documents?: string[];
  /**
   * Additional notes for the application
   */
  notes?: string;

  // Standard properties
  id: string;
  createdAt: string;
  updatedAt: string;
}
