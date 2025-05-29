import type { TimeCalculation } from "@/types";

export function calculateWorkTime(
  value: number,
  monthlySalary: number,
  weeklyHours: number
): TimeCalculation {
  if (!monthlySalary || !weeklyHours || monthlySalary <= 0 || weeklyHours <= 0) {
    return { hours: 0, minutes: 0, totalMinutes: 0 };
  }

  // Calculate hourly rate
  // Assuming 4.33 weeks per month (52 weeks / 12 months)
  const monthlyHours = weeklyHours * 4.33;
  const hourlyRate = monthlySalary / monthlyHours;

  // Calculate time needed to earn the value
  const totalHours = value / hourlyRate;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  const totalMinutes = Math.round(totalHours * 60);

  return { hours, minutes, totalMinutes };
}

export function formatWorkTime(calculation: TimeCalculation): string {
  if (calculation.hours === 0 && calculation.minutes === 0) {
    return "0m";
  }
  
  if (calculation.hours === 0) {
    return `${calculation.minutes}m`;
  }
  
  if (calculation.minutes === 0) {
    return `${calculation.hours}h`;
  }
  
  return `${calculation.hours}h ${calculation.minutes}m`;
}

export function getHourlyRate(monthlySalary: number, weeklyHours: number): number {
  if (!monthlySalary || !weeklyHours || monthlySalary <= 0 || weeklyHours <= 0) {
    return 0;
  }
  
  const monthlyHours = weeklyHours * 4.33;
  return monthlySalary / monthlyHours;
}

export function getDailyRate(monthlySalary: number, weeklyHours: number): number {
  const hourlyRate = getHourlyRate(monthlySalary, weeklyHours);
  const dailyHours = weeklyHours / 7;
  return hourlyRate * dailyHours;
}
