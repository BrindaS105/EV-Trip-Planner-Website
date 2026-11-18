import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import tripRoutes from "./routes/tripRoutes.js";

// 🔥 Fix for ES Modules (__dirname not available)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env from root folder
dotenv.config({ path: path.join(__dirname, "../.env") });

// 🧪 Debug (remove later)
console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/trip", tripRoutes);

// Server
app.listen(5000, () => console.log("Server running on port 5000"));