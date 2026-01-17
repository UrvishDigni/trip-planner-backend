import express, { Request, Response } from "express";
import { generateTripPlan } from "../services/geminiService";

const router = express.Router();

interface TripRequestBody {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  mode: "cheap" | "balanced" | "premium";
  travelers?: number;
}

router.post(
  "/generate",
  async (req: Request<{}, {}, TripRequestBody>, res: Response) => {
    try {
      const { from, to, startDate, endDate, mode, travelers } = req.body;

      // Validate inputs
      if (!from || !to || !startDate || !endDate || !mode) {
        res.status(400).json({
          error: "Missing required fields: from, to, startDate, endDate, mode",
        });
        return;
      }

      // Calculate number of days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const numDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      if (numDays < 1 || numDays > 30) {
        res.status(400).json({
          error: "Trip duration must be between 1 and 30 days",
        });
        return;
      }

      console.log(from, to, startDate, endDate, numDays, mode, travelers);

      // Generate trip plan using AI
      const tripPlan = await generateTripPlan({
        from,
        to,
        startDate,
        endDate,
        numDays,
        mode,
        travelers: travelers || 1,
      });

      res.json(tripPlan);
    } catch (error: any) {
      console.error("Error generating trip:", error);
      res.status(500).json({
        error: "Failed to generate trip plan. Please try again.",
        details: error.message,
      });
    }
  },
);

export default router;
