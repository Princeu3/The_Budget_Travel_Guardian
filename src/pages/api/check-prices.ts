import type { APIRoute } from 'astro';
import type { TripDetails, PriceCheck } from '../../types/travel';
import {
  saveToSmartBucket,
} from '../../lib/raindrop.js';
import { randomUUID } from 'crypto';

/**
 * Generate a simple user ID (UUID v4)
 * In a real app, this would come from authentication
 */
function generateUserId(): string {
  return randomUUID();
}

/**
 * Get or create user ID from request headers/cookies
 * For this demo, we'll use a header or generate a new one
 */
function getUserId(request: Request): string {
  // Check for existing user ID in header
  const existingUserId = request.headers.get('x-user-id');

  if (existingUserId) {
    return existingUserId;
  }

  // Generate new user ID
  return generateUserId();
}

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

    // Get or generate user ID
    const userId = getUserId(request);
    const timestamp = Date.now();

    // Initialize Raindrop integration
    let raindropError: Error | null = null;
    let sessionId: string | null = `session-${userId}-${timestamp}`;

    try {
      console.log('🔍 Attempting Raindrop integration...');

      // 1. Save trip configuration to SmartBuckets
      // Use the bucket name from environment variables (provisioned by Netlify)
      const bucketName = process.env.RAINDROP_SMARTBUCKET_NAME || import.meta.env.RAINDROP_SMARTBUCKET_NAME || 'BudgetTravelGuardian-sb';
      const configKey = `trip-${userId}-${timestamp}`;

      const tripConfig = {
        ...tripDetails,
        userId,
        timestamp: new Date(timestamp).toISOString(),
        sessionId,
      };

      await saveToSmartBucket(bucketName, configKey, tripConfig);
      console.log(`✅ Saved trip config to SmartBucket: ${bucketName}/${configKey}`);

      // 2. Save user preferences to SmartBucket (instead of SmartMemory)
      const preferencesKey = `preferences-${userId}`;
      const budgetPreferences = {
        totalBudget: tripDetails.totalBudget,
        flightBudget: tripDetails.flightBudget,
        hotelBudgetPerNight: tripDetails.hotelBudgetPerNight,
        carBudgetPerDay: tripDetails.carBudgetPerDay,
        lastUpdated: new Date(timestamp).toISOString(),
      };

      await saveToSmartBucket(bucketName, preferencesKey, budgetPreferences);
      console.log(`✅ Saved user preferences to SmartBucket: ${bucketName}/${preferencesKey}`);

    } catch (raindropErr) {
      // Log Raindrop errors but don't fail the request
      raindropError = raindropErr as Error;
      console.error('❌ Raindrop integration error:', raindropErr);
      if (raindropErr instanceof Error) {
        console.error('Error message:', raindropErr.message);
      }
      // Continue with price checking even if Raindrop fails
    }

    // Generate mock price data
    // In a real app, you would call actual APIs here:
    // - Flight: Amadeus, Skyscanner, Kayak API
    // - Hotel: Booking.com, Hotels.com, Expedia API
    // - Car: Rentalcars.com, Kayak API
    const priceCheck = generateMockPrices(tripDetails);

    // Save price check to SmartBuckets if Raindrop is available
    if (sessionId && !raindropError) {
      try {
        // Using same bucket for price history
        const priceHistoryBucket = process.env.RAINDROP_SMARTBUCKET_NAME || import.meta.env.RAINDROP_SMARTBUCKET_NAME || 'BudgetTravelGuardian-sb';
        const priceKey = `price-${userId}-${timestamp}`;

        await saveToSmartBucket(priceHistoryBucket, priceKey, {
          ...priceCheck,
          tripDetails: {
            origin: tripDetails.origin,
            destination: tripDetails.destination,
            startDate: tripDetails.startDate,
            endDate: tripDetails.endDate,
          },
        });
        console.log(`✅ Saved price check to SmartBucket: ${priceHistoryBucket}/${priceKey}`);
      } catch (err) {
        console.error('❌ Error saving price history:', err);
      }
    }

    // Return response with userId and sessionId
    const response = {
      ...priceCheck,
      userId,
      sessionId,
      raindropEnabled: !raindropError,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId, // Return userId in header for client to store
        }
      }
    );
  } catch (error) {
    console.error('Error checking prices:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to check prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
