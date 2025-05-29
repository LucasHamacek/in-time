import { users, purchases, type User, type InsertUser, type Purchase, type InsertPurchase } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(uid: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  getPurchasesByUserId(userId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  deletePurchase(id: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private purchases: Map<number, Purchase>;
  private currentUserId: number;
  private currentPurchaseId: number;

  constructor() {
    this.users = new Map();
    this.purchases = new Map();
    this.currentUserId = 1;
    this.currentPurchaseId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.uid === uid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(uid: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUserByUid(uid);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async getPurchasesByUserId(userId: number): Promise<Purchase[]> {
    return Array.from(this.purchases.values())
      .filter(purchase => purchase.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentPurchaseId++;
    const purchase: Purchase = {
      ...insertPurchase,
      id,
      createdAt: new Date()
    };
    this.purchases.set(id, purchase);
    return purchase;
  }

  async deletePurchase(id: number, userId: number): Promise<boolean> {
    const purchase = this.purchases.get(id);
    if (!purchase || purchase.userId !== userId) return false;
    
    return this.purchases.delete(id);
  }
}

export const storage = new MemStorage();
