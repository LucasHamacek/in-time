import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPurchaseSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User profile endpoints
  app.get("/api/user/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await storage.getUserByUid(uid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUid(userData.uid);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/user/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const updates = insertUserSchema.partial().parse(req.body);
      
      const user = await storage.updateUser(uid, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase/history endpoints
  app.get("/api/purchases/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const purchases = await storage.getPurchasesByUserId(userId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const purchaseData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/purchases/:id/:userId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(id) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      
      const success = await storage.deletePurchase(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      res.json({ message: "Purchase deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // OCR processing endpoint
  app.post("/api/ocr", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Convert buffer to base64 for OCR API
      const base64Image = req.file.buffer.toString('base64');
      
      // Use OCR.space API (free tier available)
      const ocrApiKey = process.env.OCR_API_KEY || process.env.VITE_OCR_API_KEY || "K87899142388957";
      
      const formData = new FormData();
      formData.append('base64Image', `data:${req.file.mimetype};base64,${base64Image}`);
      formData.append('language', 'por'); // Portuguese
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'false');
      formData.append('isTable', 'true');
      
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': ocrApiKey,
        },
        body: formData,
      });

      const ocrResult = await ocrResponse.json();
      
      if (!ocrResult.IsErroredOnProcessing && ocrResult.ParsedResults?.length > 0) {
        const text = ocrResult.ParsedResults[0].ParsedText;
        
        // Extract total value from receipt text
        const totalValue = extractTotalFromText(text);
        
        res.json({
          extractedText: text,
          totalValue: totalValue,
          success: totalValue > 0
        });
      } else {
        res.status(400).json({ 
          message: "Failed to process image", 
          error: ocrResult.ErrorMessage || "OCR processing failed" 
        });
      }
    } catch (error) {
      console.error("OCR Error:", error);
      res.status(500).json({ message: "OCR processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to extract total value from receipt text
function extractTotalFromText(text: string): number {
  // Common patterns for total values in Brazilian receipts
  const patterns = [
    /total[:\s]*r?\$?\s*(\d+[,.]?\d*)/i,
    /valor\s*total[:\s]*r?\$?\s*(\d+[,.]?\d*)/i,
    /subtotal[:\s]*r?\$?\s*(\d+[,.]?\d*)/i,
    /total\s*geral[:\s]*r?\$?\s*(\d+[,.]?\d*)/i,
    /r?\$\s*(\d+[,.]?\d*)\s*total/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Convert comma to dot for decimal separator and parse
      const value = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  }

  // Fallback: look for any currency value (might need manual verification)
  const currencyPattern = /r?\$\s*(\d+[,.]?\d*)/gi;
  const matches = text.match(currencyPattern);
  if (matches && matches.length > 0) {
    const values = matches.map(match => {
      const numStr = match.replace(/[r$\s]/gi, '').replace(',', '.');
      return parseFloat(numStr);
    }).filter(val => !isNaN(val) && val > 0);
    
    if (values.length > 0) {
      // Return the largest value found (likely to be the total)
      return Math.max(...values);
    }
  }

  return 0;
}
