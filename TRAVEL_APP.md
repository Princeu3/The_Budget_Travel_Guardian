# Travel Deal Monitor

A real-time travel deal monitoring application built for hackathon demo. Tracks flight, hotel, and car rental prices against your budget.

## Features

- **Trip Planning Form**: Enter your travel details and budget constraints
- **Real-time Monitoring**: Checks prices every 30 seconds
- **Budget Tracking**: Visual indicators show when deals are within budget
- **Price History**: See historical price trends for your trip
- **Responsive Design**: Works on desktop and mobile

## Pages

### 1. Landing Page (`/travel`)
- Simple form to enter trip details:
  - Origin and destination cities
  - Start and end dates
  - Budget allocations (total, flight, hotel, car)

### 2. Dashboard (`/travel-dashboard`)
- Real-time price monitoring display
- Individual cards for flights, hotels, and car rentals
- Total trip cost calculation
- Budget comparison with visual progress bar
- Price history timeline

### 3. API Route (`/api/check-prices`)
- POST endpoint that accepts trip details
- Returns current price data (mocked for demo)
- In production, would integrate with real APIs:
  - Flights: Amadeus, Skyscanner, Kayak
  - Hotels: Booking.com, Hotels.com, Expedia
  - Cars: Rentalcars.com, Kayak

## Usage

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/travel` in your browser

3. Fill out the trip details form:
   - Enter origin city (e.g., "New York")
   - Enter destination city (e.g., "Paris")
   - Select start and end dates
   - Adjust budgets as needed (defaults provided)

4. Click "Start Monitoring Prices"

5. Watch the dashboard update every 30 seconds with new price checks

## Technical Details

### Tech Stack
- **Astro**: Static site framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Netlify**: Deployment platform

### File Structure
```
src/
├── pages/
│   ├── travel.astro              # Landing page
│   ├── travel-dashboard.astro    # Dashboard page
│   └── api/
│       └── check-prices.ts       # Price checking API
└── types/
    └── travel.ts                 # TypeScript interfaces
```

### Data Flow
1. User submits form on `/travel`
2. Trip details stored in sessionStorage
3. Dashboard loads trip details and starts monitoring
4. Every 30 seconds, POST request sent to `/api/check-prices`
5. API returns price data (currently mocked)
6. Dashboard updates with new prices
7. History is maintained and displayed

## Future Enhancements

- [ ] Integrate real travel APIs
- [ ] Add email/SMS alerts for good deals
- [ ] Store trip history in database
- [ ] Add price prediction using ML
- [ ] Support multiple trips monitoring
- [ ] Add filtering by airlines, hotel brands
- [ ] Export price history to CSV
- [ ] Add calendar view for best dates

## Demo Mode

Currently uses mock data for demonstration purposes. Prices are randomly generated around your budget with realistic variance to simulate real market fluctuations.

## Performance

- Checks prices every 30 seconds
- Stores up to 50 price checks in history
- Minimal API calls in production
- Efficient client-side updates
