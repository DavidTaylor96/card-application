export const APPLICATION_STATUSES = ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];