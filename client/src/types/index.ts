export interface UserProfile {
  uid: string;
  email: string;
  monthlySalary?: number;
  weeklyHours?: number;
}

export interface Purchase {
  id: number;
  userId: number;
  value: number;
  timeHours: number;
  timeMinutes: number;
  imageUrl?: string;
  description?: string;
  type: 'ocr' | 'manual';
  createdAt?: Date;
}

export interface TimeCalculation {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export interface OCRResult {
  extractedText: string;
  totalValue: number;
  success: boolean;
}
