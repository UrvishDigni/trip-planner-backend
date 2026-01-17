import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

interface TripParams {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  numDays: number;
  travelers: number;
  mode: "cheap" | "balanced" | "premium";
}

const modeDescriptions: Record<string, string> = {
  cheap:
    "budget-friendly with hostels, street food, public transport, and free attractions",
  balanced:
    "mid-range with comfortable hotels, local restaurants, and a mix of paid/free activities",
  premium:
    "luxury with 5-star hotels, fine dining, private tours, and VIP experiences",
};

const modeBudgetRanges: Record<string, string> = {
  cheap: "₹800-1500/day per person",
  balanced: "₹2000-4000/day per person",
  premium: "₹8000+/day per person",
};

// Island and special destinations that require flight/ship access
const ISLAND_DESTINATIONS = ["andaman", "nicobar", "lakshadweep"];

function isIslandDestination(location: string): boolean {
  const loc = location.toLowerCase();
  return ISLAND_DESTINATIONS.some((island) => loc.includes(island));
}

export async function generateTripPlan({
  from,
  to,
  startDate,
  endDate,
  numDays,
  travelers,
  mode,
}: TripParams): Promise<any> {
  // TODO: Define strict return type

  const prompt = `You are a professional travel planner. Generate a detailed ${numDays}-day travel itinerary from ${from} to ${to} for ${travelers} traveler(s).

Trip Details:
- Start Date: ${startDate}
- End Date: ${endDate}
- Travelers: ${travelers}
- Budget Mode: ${mode.toUpperCase()} (${modeDescriptions[mode]})
- Daily Budget (per person): ${modeBudgetRanges[mode]}

**CRITICAL COST REQUIREMENTS:**
- All costs MUST be in Indian Rupees (INR)
- All costs should be TOTAL for ALL ${travelers} travelers combined, NOT per person
- For BALANCED mode: Daily total (all travelers) should be ₹${2000 * travelers} - ₹${4000 * travelers}
- Be realistic with Indian pricing - research typical costs if needed
- Travel costs should reflect actual Indian domestic travel prices

**GEOGRAPHIC CONSIDERATIONS:**
- If ${to} or ${from} is an ISLAND (Andaman, Nicobar, Lakshadweep, Diu, Daman), ONLY provide Flight and Ship/Ferry options
- Do NOT suggest train or bus for island destinations - they are geographically impossible
- For Andaman/Nicobar: Ships sail 3-4 times per month from Chennai/Kolkata (50-60 hours journey)
- For Lakshadweep: Only flights from Kochi are available
- Island flights are typically more expensive (₹8,000-15,000 per person)

Generate a JSON response with this EXACT structure (no markdown, just pure JSON):
{
  "tripSummary": {
    "from": "${from}",
    "to": "${to}",
    "startDate": "${startDate}",
    "endDate": "${endDate}",
    "totalDays": ${numDays},
    "travelers": ${travelers},
    "mode": "${mode}",
    "estimatedTotalCost": "total cost in local currency with symbol",
    "estimatedTravelCost": "estimated cost for flights/train to destination (numeric value only)",
    "currency": "INR",
    "currencySymbol": "₹"
  },
  "route": {
    "overview": "Brief description of the overall route",
    "transportation": "Main recommended transportation method",
    "travelOptions": [
      {
        "type": "Flight",
        "estimatedCost": 5000,
        "duration": "2h 15m",
        "details": "Direct flight from ${from} to ${to}",
        "recommended": true
      },
      {
        "type": "Train",
        "estimatedCost": 1200,
        "duration": "16h 00m",
        "details": "Sleeper/AC Class choices available",
        "recommended": false
      },
      {
        "type": "Bus",
        "estimatedCost": 800,
        "duration": "18h 30m",
        "details": "AC Volvo or Sleeper buses",
        "recommended": false
      }
    ]
  },
  "returnRoute": {
    "overview": "Brief description of the return route",
    "transportation": "Main recommended transportation method",
    "travelOptions": [
      {
        "type": "Flight",
        "estimatedCost": 5000,
        "duration": "2h 15m",
        "details": "Direct flight from ${from} to ${to}",
        "recommended": true
      }
    ]
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Catchy day title",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "description": "Brief description",
          "location": "Specific location",
          "estimatedCost": 0,
          "duration": "2 hours",
          "tips": "Helpful tip"
        }
      ],
      "meals": {
        "breakfast": { "place": "Restaurant name", "cuisine": "Type", "estimatedCost": 0 },
        "lunch": { "place": "Restaurant name", "cuisine": "Type", "estimatedCost": 0 },
        "dinner": { "place": "Restaurant name", "cuisine": "Type", "estimatedCost": 0 }
      },
      "accommodation": {
        "name": "Hotel/Hostel name",
        "type": "Hotel/Hostel/Airbnb",
        "estimatedCost": 0,
        "location": "Area/Neighborhood"
      },
      "dailyTotal": 0
    }
  ],
  "packingTips": ["tip1", "tip2", "tip3"],
  "localTips": ["tip1", "tip2", "tip3"]
}

Make sure:
1. All costs are realistic for ${mode} travel in local currency of ${to}
2. Activities are specific to ${to} and its attractions. DO NOT repeat the same activity on different days.
3. Include famous landmarks, local experiences, and hidden gems. For long trips, suggest day trips to nearby areas.
4. Restaurants should be real or realistic. Each meal (Breakfast, Lunch, Dinner) should be at a UNIQUE location every day.
5. Times should flow logically throughout each day.
6. Include variety in activities (culture, food, nature, entertainment, relaxation).
7. UNIQUE TITLES: Each day MUST have a unique, descriptive title. DO NOT use "Day X Adventure" or repetitive titles.
8. TRANSIT PRECISION: For the \`travelOptions\` array, research or simulate specific Indian transit names:
   - Train: Name specific trains (e.g., "12951 Mumbai Rajdhani", "12259 Sealdah Duronto"). Mention classes like 3AC, 2AC, SL.
   - Bus: Mention specific operators or types (e.g., "Zincbus Night Sleeper", "VRL AC Volvo").
     - If mode is CHEAP: MUST recommend the absolute CHEAPEST option (usually Bus or Sleeper Train).
     - If mode is BALANCED: Recommend Train (3AC/2AC) or Flight if price is competitive.
     - If mode is PREMIUM: Recommend Flight (Direct/Business if possible).
11. ROUTE PLAN WITH COSTING: For the \`recommended\` travel option in both outbound and return routes, provide a "full route plan" in the \`details\` field.
12. COST ALIGNMENT: The \`estimatedTravelCost\` in \`tripSummary\` MUST match the SUM of the \`estimatedCost\` of the \`recommended\` outbound travel option AND the \`recommended\` return travel option.
13. DOMESTIC ONLY: This planner only supports travel within India. Ensure all suggested locations and routes are strictly within the borders of India.

10. IMPORTANT: Calculate "estimatedTotalCost" and all daily/activity costs for ALL ${travelers} travelers collectively, NOT per person.
    - Example for BALANCED mode with 4 travelers: Daily total should be ₹8,000-16,000 (₹2,000-4,000 per person × 4)
    - Accommodation cost should be for ALL travelers (e.g., 2 rooms if 4 people)
    - Meal costs should be total for all travelers
    - Activity costs should be total entry fees for all travelers

11. SCALE & STRUCTURE (Essential for ${numDays} days):
   - Days 1-3: Major landmarks and arrival atmosphere.
   - Days 4-10: Deep cultural immersion and local neighborhoods.
   - Days 11-20: Hidden gems, off-the-beaten-path spots, and day trips to nearby towns.
   - Days 21-25: Specialized experiences (food tours, workshops, niche interests).
   - Days 26-30: Personal discovery and relaxed final experiences.
   Ensure EVERY single day from 1 to ${numDays} has completely unique places and activities.

12. use the real price form the internet if required do the browser search 

Return ONLY valid JSON, no additional text or markdown.`;
  try {
    const client = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: process.env.OPEN_ROUTER_URL,
    });

    const response = await client.chat.completions.create({
      // model: "meta-llama/llama-3.1-70b-instruct",
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: prompt }],
    });
    console.log(response, "::response::");

    function extractJSON(text: string) {
      // Remove markdown code blocks if present
      let cleanText = text.replace(/```json\n?|\n?```/g, "");
      // Remove single line comments // ...
      cleanText = cleanText.replace(/\/\/.*$/gm, "");
      // Find the first { and last }
      const start = cleanText.indexOf("{");
      const end = cleanText.lastIndexOf("}");
      if (start === -1 || end === -1)
        throw new Error("Invalid JSON from model");
      return JSON.parse(cleanText.slice(start, end + 1));
    }

    function recalculateTripCosts(tripPlan: any) {
      console.log("--- RECALCULATING COSTS (V2 - With Travel) ---");
      console.log(`Mode: ${mode}, Travelers: ${travelers}`);
      let grandTotal = 0;

      if (tripPlan.days && Array.isArray(tripPlan.days)) {
        tripPlan.days.forEach((day: any) => {
          let dayTotal = 0;

          // Sum activity costs
          if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach((act: any) => {
              const val = act.estimatedCost;
              const cost = typeof val === "number" ? val : Number(val) || 0;
              dayTotal += cost;
            });
          }

          // Sum meal costs
          if (day.meals) {
            ["breakfast", "lunch", "dinner"].forEach((mealType) => {
              if (day.meals[mealType]) {
                const val = day.meals[mealType].estimatedCost;
                const cost = typeof val === "number" ? val : Number(val) || 0;
                dayTotal += cost;
              }
            });
          }

          // Add accommodation cost
          if (day.accommodation) {
            const val = day.accommodation.estimatedCost;
            const cost = typeof val === "number" ? val : Number(val) || 0;
            dayTotal += cost;
          }

          day.dailyTotal = dayTotal;
          grandTotal += dayTotal;
        });
      }

      // Update trip summary total
      if (tripPlan.tripSummary) {
        const symbol = tripPlan.tripSummary.currencySymbol || "₹";
        const travelCostVal = tripPlan.tripSummary.estimatedTravelCost;
        const travelCost =
          typeof travelCostVal === "number"
            ? travelCostVal
            : Number(travelCostVal) || 0;

        // Add travel cost to grand total
        grandTotal += travelCost;

        tripPlan.tripSummary.estimatedTotalCost = `${symbol}${grandTotal}`;
        // Ensure the parsed number is stored back for consistency
        tripPlan.tripSummary.estimatedTravelCost = travelCost;
      }

      return tripPlan;
    }

    const text = response.choices[0].message.content;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    let tripPlan = extractJSON(text);
    // Recalculate costs to ensure consistency (AI often hallucinates totals)
    tripPlan = recalculateTripCosts(tripPlan);

    // Add travelers count to summary for frontend display
    if (tripPlan.tripSummary) {
      tripPlan.tripSummary.travelers = travelers;
    }
    console.log(tripPlan, "::tripPlan::");
    return tripPlan;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return generateFallbackPlan({
      from,
      to,
      startDate,
      endDate,
      numDays,
      travelers,
      mode,
    });
  }
}

function getCurrencyData(to: string) {
  return { code: "INR", symbol: "₹", rate: 83 };
}

function getTransportOptions(
  from: string,
  to: string,
  mode: string,
  travelers: number,
  costMultiplier: number,
) {
  const isToIsland = isIslandDestination(to);
  const isFromIsland = isIslandDestination(from);

  // For island destinations
  if (isToIsland || isFromIsland) {
    const isAndaman =
      to.toLowerCase().includes("andaman") ||
      from.toLowerCase().includes("andaman");

    return {
      outbound: [
        {
          type: "Flight",
          estimatedCost: Math.round(8000 * travelers * costMultiplier),
          duration: "2-4 hours",
          details: isAndaman
            ? `Direct flight from ${from} to ${to} (Air India/IndiGo). Limited daily flights.`
            : `Flight from ${from} to ${to}. Check availability.`,
          recommended: true,
        },
        {
          type: "Ship/Ferry",
          estimatedCost: Math.round(4000 * travelers * costMultiplier),
          duration: isAndaman ? "50-60 hours" : "Variable",
          details: isAndaman
            ? "Passenger ship from Chennai/Kolkata to Port Blair. Sails 3-4 times per month. Book in advance."
            : "Check ferry availability and schedules.",
          recommended: mode === "cheap",
        },
      ],
      return: [
        {
          type: "Flight",
          estimatedCost: Math.round(8000 * travelers * costMultiplier),
          duration: "2-4 hours",
          details: isAndaman
            ? `Direct flight from ${to} to ${from} (Air India/IndiGo). Limited daily flights.`
            : `Flight from ${to} to ${from}. Check availability.`,
          recommended: true,
        },
        {
          type: "Ship/Ferry",
          estimatedCost: Math.round(4000 * travelers * costMultiplier),
          duration: isAndaman ? "50-60 hours" : "Variable",
          details: isAndaman
            ? "Passenger ship from Port Blair to Chennai/Kolkata. Sails 3-4 times per month."
            : "Check ferry availability and schedules.",
          recommended: mode === "cheap",
        },
      ],
    };
  }

  // For mainland destinations (existing logic)
  return {
    outbound: [
      {
        type: "Flight",
        estimatedCost: Math.round(4500 * travelers * costMultiplier),
        duration: "2-3 hours",
        details: `Domestic flight from ${from} to ${to} (Indigo/Air India)`,
        recommended: mode === "premium",
      },
      {
        type: "Train",
        estimatedCost: Math.round(1500 * travelers * costMultiplier),
        duration: "14-22 hours",
        details: "Express Train (Sleeper/3AC Class). Affordable and scenic.",
        recommended: mode === "balanced",
      },
      {
        type: "Bus",
        estimatedCost: Math.round(800 * travelers * costMultiplier),
        duration: "16-24 hours",
        details: "Intercity AC Sleeper/Volvo Bus. Most budget-friendly.",
        recommended: mode === "cheap",
      },
    ],
    return: [
      {
        type: "Flight",
        estimatedCost: Math.round(4500 * travelers * costMultiplier),
        duration: "2-3 hours",
        details: `Domestic flight from ${to} to ${from} (Indigo/Air India)`,
        recommended: mode === "premium",
      },
      {
        type: "Train",
        estimatedCost: Math.round(1500 * travelers * costMultiplier),
        duration: "14-22 hours",
        details: "Express Train (Sleeper/3AC Class). Affordable and scenic.",
        recommended: mode === "balanced",
      },
      {
        type: "Bus",
        estimatedCost: Math.round(800 * travelers * costMultiplier),
        duration: "16-24 hours",
        details: "Intercity AC Sleeper/Volvo Bus. Most budget-friendly.",
        recommended: mode === "cheap",
      },
    ],
  };
}

function generateFallbackPlan({
  from,
  to,
  startDate,
  endDate,
  numDays,
  travelers = 1,
  mode,
}: TripParams) {
  const { code, symbol, rate } = getCurrencyData(to);
  const costMultiplier = mode === "premium" ? 4 : mode === "balanced" ? 2 : 1;

  // Base costs per person in INR (Realistic Indian pricing)
  const baseCosts = {
    activity1: 200,
    activity2: 300,
    activity3: 200,
    breakfast: 150,
    lunch: 250,
    dinner: 400,
    accommodation: 1500, // Per room (2 people)
    travel: 2000, // Base travel cost estimate per person (One way)
  };

  // Calculate cost in INR with mode multiplier
  // For accommodation: divide travelers by 2 (assume 2 per room)
  const calculateCost = (baseInr: number, isAccommodation = false) => {
    if (isAccommodation) {
      // Accommodation: cost per room, assume 2 people per room
      const rooms = Math.ceil(travelers / 2);
      return Math.round(baseInr * costMultiplier * rooms);
    }
    // Other costs: total for all travelers
    return Math.round(baseInr * costMultiplier * travelers);
  };

  const days = [];
  const start = new Date(startDate);
  let grandTotal = 0;

  for (let i = 0; i < numDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    // Calculate daily components
    const costs = {
      act1: calculateCost(baseCosts.activity1),
      act2: calculateCost(baseCosts.activity2),
      act3: calculateCost(baseCosts.activity3),
      bkf: calculateCost(baseCosts.breakfast),
      lnch: calculateCost(baseCosts.lunch),
      dnr: calculateCost(baseCosts.dinner),
      stay: calculateCost(baseCosts.accommodation, true), // true = accommodation
    };

    const dailyTotal = Object.values(costs).reduce((a, b) => a + b, 0);
    grandTotal += dailyTotal;

    const activityThemes = [
      {
        type: "Culture",
        items: [
          {
            act: "Museum & Gallery Visit",
            desc: "Explore the rich history and art of the region.",
            loc: "Historic District",
          },
          {
            act: "Traditional Workshop",
            desc: "Participate in a local craft or art session.",
            loc: "Artisan Quarter",
          },
          {
            act: "Temple/Cathedral Tour",
            desc: "Visit iconic religious and architectural sites.",
            loc: "Old Town",
          },
        ],
      },
      {
        type: "Nature",
        items: [
          {
            act: "Park & Garden Stroll",
            desc: "Enjoy the natural beauty and fresh air.",
            loc: "City Parks",
          },
          {
            act: "Botanical Garden Visit",
            desc: "Discover exotic plants and tranquil landscapes.",
            loc: "Outer Suburbs",
          },
          {
            act: "Riverside/Coastal Walk",
            desc: "Take a relaxing walk along the waterfront.",
            loc: "Port Area",
          },
        ],
      },
      {
        type: "Food",
        items: [
          {
            act: "Local Market Tour",
            desc: "Taste authentic local flavors and shop for souvenirs.",
            loc: "Central Market",
          },
          {
            act: "Street Food Crawl",
            desc: "Experience the vibrant street food scene.",
            loc: "Gourmet Street",
          },
          {
            act: "Cooking Masterclass",
            desc: "Learn to prepare traditional local dishes.",
            loc: "Culinary Institute",
          },
        ],
      },
      {
        type: "Landmark",
        items: [
          {
            act: "Historic Site Visit",
            desc: "Visit iconic monuments and architectural wonders.",
            loc: "National Plaza",
          },
          {
            act: "Panoramic City View",
            desc: "Get a bird's eye view of the entire city.",
            loc: "Observation Tower",
          },
          {
            act: "Palace/Castle Tour",
            desc: "Explore the former residence of royalty.",
            loc: "High Ridge Area",
          },
        ],
      },
      {
        type: "Adventure",
        items: [
          {
            act: "Local Neighborhood Hike",
            desc: "Discover hidden streets and panoramic views.",
            loc: "Northern Hills",
          },
          {
            act: "Cycling Tour",
            desc: "Explore the city on two wheels.",
            loc: "Bike Trails",
          },
          {
            act: "Nearby Village Day Trip",
            desc: "Explore the outskirts for a rural experience.",
            loc: "Country Side",
          },
        ],
      },
      {
        type: "Relaxation",
        items: [
          {
            act: "Leisurely City Walk",
            desc: "Soak in the local atmosphere at a steady pace.",
            loc: "Pedestrian Zone",
          },
          {
            act: "Library/Bookshop Visit",
            desc: "Browse local literature and quiet spaces.",
            loc: "Literary Corner",
          },
          {
            act: "Spa & Wellness Session",
            desc: "Unwind with traditional local treatments.",
            loc: "Wellness Center",
          },
        ],
      },
    ];

    const theme1 = activityThemes[i % activityThemes.length];
    const theme2 = activityThemes[(i + 2) % activityThemes.length];
    const theme3 = activityThemes[(i + 4) % activityThemes.length];

    const item1 = theme1.items[i % theme1.items.length];
    const item2 = theme2.items[(i + 1) % theme2.items.length];
    const item3 = theme3.items[(i + 2) % theme3.items.length];

    const mealPlaces = [
      { b: "The Morning Nook", l: "Corner Bistro", d: "Starry Night Grill" },
      { b: "Sunshine Cafe", l: "The Golden Plate", d: "Twilight Tavern" },
      { b: "Baker's Street", l: "Street Side Eats", d: "Grand Harbor Dining" },
      { b: "Garden Terrace", l: "Green Leaf Deli", d: "Oak & Iron Steakhouse" },
      { b: "Mountain View Coffee", l: "Valley Kitchen", d: "Cliffside Lounge" },
      { b: "Harbor Brews", l: "Oceanic Catch", d: "Coral Reef Dining" },
      { b: "The Daily Grind", l: "Urban Sprout", d: "City Lights Bistro" },
      { b: "Sunrise Bakery", l: "Local Harvest", d: "The Rustic Table" },
    ];
    const meals = mealPlaces[i % mealPlaces.length];

    days.push({
      day: i + 1,
      date: currentDate.toISOString().split("T")[0],
      title:
        i === 0
          ? "Arrival & Exploration"
          : i === numDays - 1
            ? "Final Day & Departure"
            : `${theme1.type} & ${to} Discovery`,
      activities: [
        {
          time: "09:00 AM",
          activity: i === 0 ? "Arrival & Check-in" : item1.act,
          description:
            i === 0
              ? `Welcome to ${to}! Settle into your accommodation.`
              : item1.desc,
          location: i === 0 ? `${to} Central District` : item1.loc,
          estimatedCost: costs.act1,
          duration: "3 hours",
          tips: "Start early to avoid crowds",
        },
        {
          time: "02:00 PM",
          activity: i === 0 ? "Initial Sightseeing" : item2.act,
          description:
            i === 0
              ? `Take a stroll around the main highlights of ${to}.`
              : item2.desc,
          location: i === 0 ? `${to} Landmarks` : item2.loc,
          estimatedCost: costs.act2,
          duration: "4 hours",
          tips: "Don't forget your camera",
        },
        {
          time: "07:00 PM",
          activity: i === 0 ? "Evening Introduction" : item3.act,
          description:
            i === 0
              ? "Enjoy your first evening with a walk in a lively area."
              : item3.desc,
          location: i === 0 ? `${to} Entertainment Hub` : item3.loc,
          estimatedCost: costs.act3,
          duration: "3 hours",
          tips: "Try local street food",
        },
      ],
      meals: {
        breakfast: {
          place: meals.b,
          cuisine: "Local",
          estimatedCost: costs.bkf,
        },
        lunch: {
          place: meals.l,
          cuisine: "Local",
          estimatedCost: costs.lnch,
        },
        dinner: {
          place: meals.d,
          cuisine: "International",
          estimatedCost: costs.dnr,
        },
      },
      accommodation: {
        name:
          mode === "premium"
            ? "Luxury Hotel"
            : mode === "balanced"
              ? "Comfortable Hotel"
              : "Budget Hostel",
        type:
          mode === "premium"
            ? "5-Star Hotel"
            : mode === "balanced"
              ? "3-Star Hotel"
              : "Hostel",
        estimatedCost: costs.stay,
        location: `${to} Central`,
      },
      dailyTotal: dailyTotal,
    });
  }

  const transportOptions = getTransportOptions(
    from,
    to,
    mode,
    travelers,
    costMultiplier,
  );

  return {
    tripSummary: {
      from,
      to,
      startDate,
      endDate,
      totalDays: numDays,
      travelers,
      mode,
      estimatedTotalCost: `${symbol}${grandTotal + calculateCost(baseCosts.travel)}`,
      estimatedTravelCost: calculateCost(baseCosts.travel),
      currency: code,
      currencySymbol: symbol,
    },
    route: {
      overview: isIslandDestination(to)
        ? `Travel from ${from} to ${to} (island destination) via ${transportOptions.outbound.find((o) => o.recommended)?.type || "flight"}`
        : `Travel from ${from} to ${to} for an amazing ${numDays}-day adventure`,
      transportation:
        transportOptions.outbound.find((o) => o.recommended)?.type || "Flight",
      travelOptions: transportOptions.outbound,
    },
    returnRoute: {
      overview: `Return from ${to} to ${from}`,
      transportation:
        transportOptions.return.find((o) => o.recommended)?.type || "Flight",
      travelOptions: transportOptions.return,
    },
    days,
    packingTips: [
      "Pack comfortable walking shoes",
      "Bring weather-appropriate clothing",
      "Don't forget travel adapters",
      "Carry a reusable water bottle",
    ],
    localTips: [
      "Learn a few local phrases",
      "Keep copies of important documents",
      "Stay hydrated and take breaks",
      "Respect local customs and traditions",
    ],
  };
}
