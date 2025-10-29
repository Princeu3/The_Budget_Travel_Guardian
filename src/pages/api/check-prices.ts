import type { APIRoute } from 'astro';
import type { TripDetails, PriceCheck } from '../../types/travel';

// Mock data for demo purposes - simulates API calls to flight/hotel/car services
function generateMockPrices(tripDetails: TripDetails): PriceCheck {
  const days = Math.ceil(
    (new Date(tripDetails.endDate).getTime() - new Date(tripDetails.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  // Generate random prices with some variance around the budget
  const flightPrice = Math.round(
    tripDetails.flightBudget * (0.7 + Math.random() * 0.6)
  );

  const hotelPricePerNight = Math.round(
    tripDetails.hotelBudgetPerNight * (0.7 + Math.random() * 0.6)
  );

  const carPricePerDay = Math.round(
    tripDetails.carBudgetPerDay * (0.7 + Math.random() * 0.6)
  );

  const carriers = ['Delta', 'United', 'American', 'Southwest', 'JetBlue'];
  const hotelNames = ['Marriott', 'Hilton', 'Hyatt', 'Holiday Inn', 'Best Western'];
  const carTypes = ['Economy', 'Compact', 'Mid-size', 'Full-size', 'SUV'];

  const totalHotelCost = hotelPricePerNight * days;
  const totalCarCost = carPricePerDay * days;
  const totalCost = flightPrice + totalHotelCost + totalCarCost;

  return {
    flight: {
      price: flightPrice,
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      withinBudget: flightPrice <= tripDetails.flightBudget,
    },
    hotel: {
      pricePerNight: hotelPricePerNight,
      name: hotelNames[Math.floor(Math.random() * hotelNames.length)],
      withinBudget: hotelPricePerNight <= tripDetails.hotelBudgetPerNight,
    },
    car: {
      pricePerDay: carPricePerDay,
      type: carTypes[Math.floor(Math.random() * carTypes.length)],
      withinBudget: carPricePerDay <= tripDetails.carBudgetPerDay,
    },
    totalCost,
    withinTotalBudget: totalCost <= tripDetails.totalBudget,
    timestamp: new Date().toISOString(),
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const tripDetails: TripDetails = await request.json();

    // Validate trip details
    if (!tripDetails.origin || !tripDetails.destination || !tripDetails.startDate || !tripDetails.endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required trip details' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate mock price data
    // In a real app, you would call actual APIs here:
    // - Flight: Amadeus, Skyscanner, Kayak API
    // - Hotel: Booking.com, Hotels.com, Expedia API
    // - Car: Rentalcars.com, Kayak API
    const priceCheck = generateMockPrices(tripDetails);

    return new Response(
      JSON.stringify(priceCheck),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking prices:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check prices' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
