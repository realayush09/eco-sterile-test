# Location API Proxy Server

## Overview

A lightweight Express.js proxy server that forwards requests to the India Location Hub API while handling CORS issues and providing consistent endpoints for the EcoSterile frontend.

## Why This?

The India Location Hub API (`https://india-location-hub.in/api`) doesn't have CORS headers enabled, which prevents browser-based requests from working directly. This proxy server:

- ✅ Bypasses CORS restrictions
- ✅ Provides clean, consistent endpoints
- ✅ Includes request logging
- ✅ Handles errors gracefully
- ✅ Runs locally during development

## Setup

### 1. Install Dependencies

```bash
cd EcoSterile-Pro
npm install
```

This installs:

- `express` - Web server framework
- `cors` - CORS middleware
- `node-fetch` - For making HTTP requests
- `nodemon` - Development file watcher (optional)

### 2. Start the Server

**Production mode:**

```bash
npm start
```

**Development mode (auto-restart on file changes):**

```bash
npm run dev
```

### 3. Verify It's Running

Open your browser and visit:

```
http://localhost:3000/health
```

You should see:

```json
{ "status": "ok", "message": "Location proxy server is running" }
```

## Available Endpoints

### 1. Get States

```
GET http://localhost:3000/api/location/states
```

Returns array of all Indian states with `{ name, code }` objects.

### 2. Get Districts

```
GET http://localhost:3000/api/location/districts?stateCode=18
```

Returns districts for a given state.

**Required Query Parameters:**

- `stateCode` - State code (e.g., "18" for Assam)

### 3. Get Talukas

```
GET http://localhost:3000/api/location/talukas?districtCode=317
```

Returns talukas/sub-districts for a given district.

**Required Query Parameters:**

- `districtCode` - District code (e.g., "317" for Karimganj)

### 4. Get Villages

```
GET http://localhost:3000/api/location/villages?talukaCode=02101
```

Returns villages for a given taluka.

**Required Query Parameters:**

- `talukaCode` - Taluka code (e.g., "02101")

## Server Logs

When the server is running, you'll see logs like:

```
[2025-12-31T16:06:10.656Z] GET /api/location/states
📍 Proxying request to: /locations/states
✅ States fetched: 36 items

[2025-12-31T16:06:12.123Z] GET /api/location/districts?stateCode=18
📍 Proxying request to: /locations/districts?stateCode=18
✅ Districts fetched for state 18: 8 items
```

## Error Handling

### Missing Query Parameters

```json
{
  "error": "Missing parameter",
  "message": "stateCode query parameter is required"
}
```

### API Failure

```json
{
  "error": "Failed to fetch districts",
  "message": "External API returned 500: Internal Server Error"
}
```

### Invalid Route

```json
{
  "error": "Not found",
  "message": "Route GET /unknown does not exist"
}
```

## CORS Configuration

The server enables CORS for all origins:

```javascript
app.use(
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 3600,
  })
);
```

This means the frontend can make requests from any domain.

## Frontend Integration

The signup page (`auth/signup.html`) is already configured to use this proxy:

```javascript
const LOCATION_API_BASE = "http://localhost:3000/api/location";
```

When you start typing location selection on the signup form, it automatically calls the proxy server.

## Troubleshooting

### Server Won't Start

**Error:** `Cannot find module 'express'`

**Solution:** Run `npm install` first

---

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:** Port 3000 is already in use. Either:

- Kill the process using port 3000: `lsof -i :3000` then `kill -9 <PID>`
- Change the PORT: `PORT=3001 npm start`

---

### API Calls Fail

**Error:** `Failed to load states. Check if proxy server is running.`

**Solution:**

1. Make sure the proxy server is running: `npm start`
2. Verify it's on port 3000: `http://localhost:3000/health`
3. Check browser console for CORS errors

---

### External API Not Responding

**Error:** `External API returned 503: Service Unavailable`

**Solution:**

- The India Location Hub API might be down temporarily
- Check if you have internet connectivity
- Try again in a few moments

## Performance

- **States load**: ~50-100ms (36 items)
- **Districts load**: ~100-150ms (varies by state)
- **Talukas load**: ~100-150ms (varies by district)
- **Villages load**: ~200-500ms (can have 1000+ items)

## Security Notes

- ⚠️ This proxy forwards all requests to a public API without authentication
- ⚠️ No rate limiting is implemented (add if needed)
- ✅ Only GET requests are allowed (no POST/PUT/DELETE)
- ✅ No sensitive data is stored or logged

## Production Deployment

For production, you can deploy this server on:

- Heroku (free tier available)
- AWS EC2
- DigitalOcean
- Railway
- Render

Update `auth/signup.html` with your production URL:

```javascript
const LOCATION_API_BASE = "https://your-proxy-server.com/api/location";
```

## License

MIT

## Support

For issues or questions, check:

1. Server is running: `npm start`
2. Correct port is in use: `http://localhost:3000/health`
3. Query parameters are correct
4. External API is accessible from your network
