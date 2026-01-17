export interface TripSummary {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  mode: string;
  estimatedTotalCost: string;
  currency: string;
}

export interface RouteInfo {
  overview: string;
  transportation: string;
}

export interface Activity {
  time: string;
  activity: string;
  description: string;
  location: string;
  estimatedCost: number;
  duration: string;
  tips: string;
}

export interface Meals {
  breakfast: { place: string; cuisine: string; estimatedCost: number };
  lunch: { place: string; cuisine: string; estimatedCost: number };
  dinner: { place: string; cuisine: string; estimatedCost: number };
}

export interface Accommodation {
  name: string;
  type: string;
  estimatedCost: number;
  location: string;
}

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
  meals: Meals;
  accommodation: Accommodation;
  dailyTotal: number;
}

export interface TripPlan {
  tripSummary: TripSummary;
  route: RouteInfo;
  days: DayPlan[];
  packingTips: string[];
  localTips: string[];
}
