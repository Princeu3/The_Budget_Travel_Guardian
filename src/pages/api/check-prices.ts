import type { APIRoute } from 'astro';
import type { TripDetails, PriceCheck } from '../../types/travel';
import { saveToSmartBucket } from '../../lib/raindrop.js';
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

/**
 * Domain filters for travel booking websites
 */
const TRAVEL_DOMAINS = {
  flights: [
    'expedia.com',
    'kayak.com',
    'skyscanner.com',
    'google.com/flights',
    'united.com',
    'delta.com',
    'american.com',
    'southwest.com',
    'jetblue.com',
    'alaskaair.com',
    'spirit.com',
    'frontier.com',
    'priceline.com',
    'orbitz.com',
    'cheapoair.com',
    'momondo.com',
    'hipmunk.com',
    'booking.com/flights'
  ],
  hotels: [
    'booking.com',
    'expedia.com',
    'hotels.com',
    'priceline.com',
    'orbitz.com',
    'kayak.com',
    'trivago.com',
    'agoda.com',
    'marriott.com',
    'hilton.com',
    'ihg.com',
    'hyatt.com',
    'accor.com',
    'choicehotels.com',
    'wyndhamhotels.com',
    'bestwestern.com',
    'sheraton.com',
    'westin.com',
    'ritzcarlton.com',
    'fourseasons.com'
  ],
  cars: [
    'enterprise.com',
    'hertz.com',
    'avis.com',
    'budget.com',
    'nationalcar.com',
    'alamo.com',
    'thrifty.com',
    'dollar.com',
    'expedia.com',
    'kayak.com',
    'priceline.com',
    'orbitz.com',
    'rentalcars.com',
    'autoeurope.com',
    'carrentals.com',
    'hotwire.com',
    'costcotravel.com',
    'aaa.com'
  ]
};

/**
 * Call Perplexity Search API for real-time data with domain filtering
 */
async function searchPerplexity(query: string, searchType: 'flights' | 'hotels' | 'cars'): Promise<any> {
  const apiKey = process.env.PERPLEXITY_API_KEY || import.meta.env.PERPLEXITY_API_KEY;

  console.log('🔑 Perplexity API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

  if (!apiKey) {
    console.warn('⚠️ Perplexity API key not found, using mock data');
    return null;
  }

  try {
    console.log(`📡 Calling Perplexity API for ${searchType}...`);
    
    // Get domain filter for the search type
    const domainFilter = TRAVEL_DOMAINS[searchType];
    console.log(`🎯 Filtering to ${domainFilter.length} travel domains`);

    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: 5,
        max_tokens_per_page: 512,
        search_domain_filter: domainFilter
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Perplexity API error: ${response.status} ${response.statusText}`);
      console.error(`Error details:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Perplexity API success, data:', JSON.stringify(data).substring(0, 200));
    return data;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    return null;
  }
}

/**
 * Extract price from Perplexity response text
 * Enhanced to handle multiple price formats
 */
function extractPrice(text: string, fallbackMin: number, fallbackMax: number): number {
  // Try multiple price patterns for better extraction
  const patterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,  // $500, $1,200.50
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)/gi,  // 500 USD, 1200 dollars
    /price[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,  // price: $500
    /(?:from|starting at|as low as)[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,  // from $500
  ];

  let prices: number[] = [];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 0 && price >= fallbackMin * 0.3 && price <= fallbackMax * 3) {
        prices.push(Math.round(price));
      }
    }
  }

  // Return the lowest price found, or fallback
  if (prices.length > 0) {
    return Math.min(...prices);
  }

  // Fallback to random price in range
  return Math.round(fallbackMin + Math.random() * (fallbackMax - fallbackMin));
}

/**
 * Extract booking URLs from Perplexity response
 */
function extractBookingUrls(searchResult: any): string[] {
  const urls: string[] = [];
  
  if (searchResult.results && Array.isArray(searchResult.results)) {
    searchResult.results.forEach((result: any) => {
      if (result.url) {
        urls.push(result.url);
      }
    });
  }
  
  return urls.slice(0, 3); // Return up to 3 booking URLs
}

/**
 * Check flight prices using Perplexity API
 */
async function checkFlightPrices(origin: string, destination: string, startDate: string): Promise<any> {
  // Optimized query with specific instructions for better results
  const query = `Find the cheapest flight prices from ${origin} to ${destination} departing on ${startDate}. 
Search only travel booking sites (Kayak, Expedia, Google Flights, Skyscanner).
Provide specific dollar amounts, airline names, and direct booking links.
Format: "$XXX on [Airline] via [booking site URL]"`;

  console.log(`🔍 Searching flights: ${query}`);
  const searchResult = await searchPerplexity(query, 'flights');

  if (searchResult && (searchResult.answer || searchResult.results)) {
    const text = searchResult.answer || (searchResult.results && searchResult.results.map((r: any) => r.snippet || r.title || '').join(' ')) || '';
    console.log(`✅ Perplexity flight result:`, text ? text.substring(0, 200) : 'No text found');

    const price = extractPrice(text, 400, 900);
    const bookingUrls = extractBookingUrls(searchResult);

    // Extract airline from response with better pattern matching
    const airlines = ['United', 'Delta', 'American', 'Southwest', 'JetBlue', 'Alaska', 'Spirit', 'Frontier'];
    const airlinePattern = new RegExp(airlines.join('|'), 'i');
    const airlineMatch = text.match(airlinePattern);
    const airline = airlineMatch ? airlineMatch[0] : airlines[Math.floor(Math.random() * airlines.length)];

    return {
      price,
      carrier: airline,
      withinBudget: false, // Will be set later
      source: 'perplexity',
      searchResult: text.substring(0, 300),
      bookingUrls,
    };
  }

  // Fallback to realistic simulation
  console.log('⚠️ Using fallback flight pricing');
  const basePrice = 400 + Math.random() * 500;
  const variance = -100 + Math.random() * 200;
  const airlines = ['United', 'Delta', 'American', 'Southwest', 'JetBlue'];
  const airline = airlines[Math.floor(Math.random() * airlines.length)];

  // Generate realistic booking URLs
  const bookingUrls = [
    `https://www.${airline.toLowerCase()}.com/flights/${origin.toLowerCase()}-${destination.toLowerCase()}`,
    `https://www.expedia.com/flights/${origin.toLowerCase()}-${destination.toLowerCase()}`,
    `https://www.kayak.com/flights/${origin.toLowerCase()}-${destination.toLowerCase()}`
  ];

  return {
    price: Math.round(basePrice + variance),
    carrier: airline,
    withinBudget: false,
    source: 'simulation',
    bookingUrls,
  };
}

/**
 * Check hotel prices using Perplexity API
 */
async function checkHotelPrices(destination: string, startDate: string): Promise<any> {
  // Optimized query for specific pricing and booking information
  const query = `Find the cheapest hotel rates per night in ${destination} for check-in date ${startDate}.
Search only hotel booking sites (Booking.com, Hotels.com, Expedia, Kayak, Trivago).
Provide specific nightly rates (price per night), hotel names, star ratings, and direct booking URLs.
Format: "$XXX/night at [Hotel Name] ([X] stars) - [booking URL]"`;

  console.log(`🔍 Searching hotels: ${query}`);
  const searchResult = await searchPerplexity(query, 'hotels');

  if (searchResult && (searchResult.answer || searchResult.results)) {
    const text = searchResult.answer || (searchResult.results && searchResult.results.map((r: any) => r.snippet || r.title || '').join(' ')) || '';
    console.log(`✅ Perplexity hotel result:`, text ? text.substring(0, 200) : 'No text found');

    const pricePerNight = extractPrice(text, 80, 280);
    const bookingUrls = extractBookingUrls(searchResult);

    // Extract hotel name from response with better pattern matching
    const hotelNames = ['Marriott', 'Hilton', 'Hyatt', 'Holiday Inn', 'Best Western', 'Sheraton', 'DoubleTree', 'Courtyard', 'Hampton Inn', 'Fairfield Inn'];
    const hotelPattern = new RegExp(hotelNames.join('|'), 'i');
    const hotelMatch = text.match(hotelPattern);
    const name = hotelMatch ? hotelMatch[0] : hotelNames[Math.floor(Math.random() * hotelNames.length)];

    return {
      pricePerNight,
      name,
      withinBudget: false,
      source: 'perplexity',
      searchResult: text.substring(0, 300),
      bookingUrls,
    };
  }

  // Fallback to realistic simulation
  console.log('⚠️ Using fallback hotel pricing');
  const basePrice = 80 + Math.random() * 200;
  const variance = -40 + Math.random() * 80;
  const hotelNames = ['Marriott', 'Hilton', 'Hyatt', 'Holiday Inn', 'Best Western', 'Sheraton'];
  const name = hotelNames[Math.floor(Math.random() * hotelNames.length)];

  // Generate realistic booking URLs
  const bookingUrls = [
    `https://www.${name.toLowerCase().replace(' ', '')}.com/hotels/${destination.toLowerCase()}`,
    `https://www.booking.com/searchresults.html?ss=${destination}`,
    `https://www.hotels.com/search.do?destination=${destination}`
  ];

  return {
    pricePerNight: Math.round(basePrice + variance),
    name,
    withinBudget: false,
    source: 'simulation',
    bookingUrls,
  };
}

/**
 * Check car rental prices using Perplexity API
 */
async function checkCarPrices(destination: string, startDate: string): Promise<any> {
  // Optimized query for car rental pricing with specific requirements
  const query = `Find the cheapest car rental rates per day in ${destination} for pickup date ${startDate}.
Search only car rental booking sites (Enterprise, Hertz, Avis, Budget, Kayak, Expedia).
Provide specific daily rates (price per day), rental company names, car types (economy, compact, etc.), and direct booking URLs.
Format: "$XX/day for [Car Type] from [Company] - [booking URL]"`;

  console.log(`🔍 Searching car rentals: ${query}`);
  const searchResult = await searchPerplexity(query, 'cars');

  if (searchResult && (searchResult.answer || searchResult.results)) {
    const text = searchResult.answer || (searchResult.results && searchResult.results.map((r: any) => r.snippet || r.title || '').join(' ')) || '';
    console.log(`✅ Perplexity car rental result:`, text ? text.substring(0, 200) : 'No text found');

    const pricePerDay = extractPrice(text, 30, 100);
    const bookingUrls = extractBookingUrls(searchResult);

    // Extract car type from response with better pattern matching
    const carTypes = ['Economy', 'Compact', 'Mid-size', 'Midsize', 'Full-size', 'SUV', 'Standard', 'Intermediate'];
    const carPattern = new RegExp(carTypes.join('|'), 'i');
    const carMatch = text.match(carPattern);
    const type = carMatch ? carMatch[0] : carTypes[Math.floor(Math.random() * carTypes.length)];

    return {
      pricePerDay,
      type,
      withinBudget: false,
      source: 'perplexity',
      searchResult: text.substring(0, 300),
      bookingUrls,
    };
  }

  // Fallback to realistic simulation
  console.log('⚠️ Using fallback car rental pricing');
  const basePrice = 30 + Math.random() * 70;
  const variance = -20 + Math.random() * 40;
  const carTypes = ['Economy', 'Compact', 'Mid-size', 'Full-size', 'SUV'];
  const type = carTypes[Math.floor(Math.random() * carTypes.length)];

  // Generate realistic booking URLs
  const bookingUrls = [
    `https://www.enterprise.com/en/car-rental/locations/us/${destination.toLowerCase()}.html`,
    `https://www.hertz.com/rentacar/location/us/${destination.toLowerCase()}`,
    `https://www.avis.com/en/locations/us/${destination.toLowerCase()}`
  ];

  return {
    pricePerDay: Math.round(basePrice + variance),
    type,
    withinBudget: false,
    source: 'simulation',
    bookingUrls,
  };
}

/**
 * Generate comprehensive price data using Perplexity API
 */
async function checkAllPrices(tripDetails: TripDetails): Promise<PriceCheck> {
  const days = Math.ceil(
    (new Date(tripDetails.endDate).getTime() - new Date(tripDetails.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  console.log(`\n🎯 Checking prices for ${days}-day trip from ${tripDetails.origin} to ${tripDetails.destination}`);

  // Check all prices in parallel for speed
  const [flightData, hotelData, carData] = await Promise.all([
    checkFlightPrices(tripDetails.origin, tripDetails.destination, tripDetails.startDate),
    checkHotelPrices(tripDetails.destination, tripDetails.startDate),
    checkCarPrices(tripDetails.destination, tripDetails.startDate),
  ]);

  // Calculate totals
  const totalHotelCost = hotelData.pricePerNight * days;
  const totalCarCost = carData.pricePerDay * days;
  const totalCost = flightData.price + totalHotelCost + totalCarCost;

  // Check budgets
  flightData.withinBudget = flightData.price <= tripDetails.flightBudget;
  hotelData.withinBudget = hotelData.pricePerNight <= tripDetails.hotelBudgetPerNight;
  carData.withinBudget = carData.pricePerDay <= tripDetails.carBudgetPerDay;

  console.log(`💰 Total cost: $${totalCost} (Budget: $${tripDetails.totalBudget})`);
  console.log(`✈️  Flight: $${flightData.price} (${flightData.withinBudget ? '✅' : '❌'} budget: $${tripDetails.flightBudget})`);
  console.log(`🏨 Hotel: $${hotelData.pricePerNight}/night (${hotelData.withinBudget ? '✅' : '❌'} budget: $${tripDetails.hotelBudgetPerNight})`);
  console.log(`🚗 Car: $${carData.pricePerDay}/day (${carData.withinBudget ? '✅' : '❌'} budget: $${tripDetails.carBudgetPerDay})`);

  return {
    flight: flightData,
    hotel: hotelData,
    car: carData,
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
      const bucketName = process.env.RAINDROP_SMARTBUCKET_NAME || import.meta.env.RAINDROP_SMARTBUCKET_NAME;
      
      if (!bucketName) {
        throw new Error('RAINDROP_SMARTBUCKET_NAME environment variable not set');
      }
      
      const configKey = `trip-${userId}-${timestamp}`;

      const tripConfig = {
        ...tripDetails,
        userId,
        timestamp: new Date(timestamp).toISOString(),
        sessionId,
      };

      await saveToSmartBucket(bucketName, configKey, tripConfig);
      console.log(`✅ Saved trip config to SmartBucket: ${bucketName}/${configKey}`);

      // 2. Save user preferences to SmartBucket
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

    // Check prices using Perplexity API (or fallback to simulation)
    const priceCheck = await checkAllPrices(tripDetails);

    // Save price check to SmartBuckets if Raindrop is available
    if (sessionId && !raindropError) {
      try {
        const priceHistoryBucket = process.env.RAINDROP_SMARTBUCKET_NAME || import.meta.env.RAINDROP_SMARTBUCKET_NAME;
        
        if (!priceHistoryBucket) {
          throw new Error('RAINDROP_SMARTBUCKET_NAME environment variable not set');
        }
        
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
          'x-user-id': userId,
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
