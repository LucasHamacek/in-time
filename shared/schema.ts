import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase UID
  email: text("email").notNull().unique(),
  monthlySalary: real("monthly_salary"),
  weeklyHours: real("weekly_hours"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  value: real("value").notNull(),
  timeHours: real("time_hours").notNull(),
  timeMinutes: real("time_minutes").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  type: text("type").notNull(), // 'ocr' or 'manual'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  uid: true,
  email: true,
  monthlySalary: true,
  weeklyHours: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).pick({
  userId: true,
  value: true,
  timeHours: true,
  timeMinutes: true,
  imageUrl: true,
  description: true,
  type: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;
