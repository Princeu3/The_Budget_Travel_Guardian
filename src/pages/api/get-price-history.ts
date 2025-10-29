import type { APIRoute } from 'astro';
import { getRaindropClient, getSmartBucketLocation } from '../../lib/raindrop.js';

/**
 * Get price history for a user from SmartBuckets
 *
 * Query params:
 * - userId: User ID to get history for (required)
 * - limit: Number of results to return (default: 20)
 */
export const GET: APIRoute = async ({ url, request }) => {
  try {
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId query parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Fetching price history for user: ${userId} (limit: ${limit})`);

    // Get bucket name from environment
    const bucketName = process.env.RAINDROP_SMARTBUCKET_NAME ||
                       import.meta.env.RAINDROP_SMARTBUCKET_NAME ||
                       'BudgetTravelGuardian-sb';

    try {
      const client = getRaindropClient();
      const bucketLocation = getSmartBucketLocation(bucketName);

      // List all objects in the bucket
      console.log(`🔍 Listing objects in bucket: ${bucketName}`);
      const listResult = await client.bucket.list({
        bucketLocation,
      });

      console.log(`📦 Found ${listResult.objects?.length || 0} total objects in bucket`);

      // Filter for price snapshots for this user
      const priceObjects = listResult.objects?.filter((obj: any) =>
        obj.key.startsWith(`price-${userId}-`)
      ) || [];

      console.log(`💰 Found ${priceObjects.length} price snapshots for user ${userId}`);

      // Sort by timestamp (newest first) and limit
      const sortedObjects = priceObjects
        .sort((a: any, b: any) => {
          const timeA = new Date(a.lastModified).getTime();
          const timeB = new Date(b.lastModified).getTime();
          return timeB - timeA; // Newest first
        })
        .slice(0, limit);

      // Fetch the actual price data for each snapshot
      const priceHistory = await Promise.all(
        sortedObjects.map(async (obj: any) => {
          try {
            const result = await client.bucket.get({
              bucketLocation,
              key: obj.key,
            });

            // Decode base64 content
            const jsonString = Buffer.from(result.content || '', 'base64').toString('utf-8');
            const data = JSON.parse(jsonString);

            return {
              key: obj.key,
              timestamp: data.timestamp || obj.lastModified,
              lastModified: obj.lastModified,
              size: obj.size,
              ...data,
            };
          } catch (err) {
            console.error(`❌ Error fetching price snapshot ${obj.key}:`, err);
            return null;
          }
        })
      );

      // Filter out any failed fetches
      const validHistory = priceHistory.filter(h => h !== null);

      console.log(`✅ Successfully retrieved ${validHistory.length} price snapshots`);

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          count: validHistory.length,
          history: validHistory,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    } catch (raindropError: any) {
      console.error('❌ Raindrop error:', raindropError);

      // Return empty history if bucket doesn't exist or other Raindrop errors
      return new Response(
        JSON.stringify({
          success: false,
          userId,
          count: 0,
          history: [],
          error: raindropError.message || 'Failed to fetch price history',
          details: 'Raindrop integration may not be configured or bucket may not exist',
        }),
        {
          status: 200, // Return 200 with empty data rather than error
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('❌ Error in get-price-history:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch price history',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
