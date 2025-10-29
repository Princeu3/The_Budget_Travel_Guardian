export interface FlightPreferences {
  stops?: 'direct' | 'one-stop' | 'multi-stop' | 'any';
  preferredAirlines?: string[];
  seatPreference?: 'aisle' | 'window' | 'any';
  extraLegroom?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'red-eye' | 'any';
  baggageCount?: number;
}

export interface HotelPreferences {
  starRating?: number; // 1-5
  roomType?: 'single' | 'double' | 'suite' | 'any';
  amenities?: string[]; // ['wifi', 'breakfast', 'gym', 'pool', 'parking']
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict' | 'any';
}

export interface CarRentalPreferences {
  vehicleType?: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury' | 'any';
  transmission?: 'automatic' | 'manual' | 'any';
  mileage?: 'unlimited' | 'limited';
  features?: string[]; // ['gps', 'bluetooth', 'backup-camera']
}

export interface TripDetails {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  flightBudget: number;
  hotelBudgetPerNight: number;
  carBudgetPerDay: number;
  
  // Advanced preferences (optional)
  flightPreferences?: FlightPreferences;
  hotelPreferences?: HotelPreferences;
  carRentalPreferences?: CarRentalPreferences;
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
