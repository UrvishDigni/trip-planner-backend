import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tripRoutes from "./routes/trip";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Routes
app.use("/api/trip", tripRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Trip Planner API is running!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
