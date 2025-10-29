export interface TripDetails {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  flightBudget: number;
  hotelBudgetPerNight: number;
  carBudgetPerDay: number;
}

export interface PriceCheck {
  flight: {
    price: number;
    carrier: string;
    withinBudget: boolean;
  };
  hotel: {
    pricePerNight: number;
    name: string;
    withinBudget: boolean;
  };
  car: {
    pricePerDay: number;
    type: string;
    withinBudget: boolean;
  };
  totalCost: number;
  withinTotalBudget: boolean;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  raindropEnabled?: boolean;
}
