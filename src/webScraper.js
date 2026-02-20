const axios = require('axios');

/**
 * Scrape event data from metaforge.app
 */
async function scrapeEvents() {
  try {
    // Use the correct API endpoint
    const apiUrl = 'https://metaforge.app/api/arc-raiders/events-schedule';
    console.log('🔍 Fetching events from API:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid API response format');
    }

    console.log(`✓ Got ${response.data.data.length} events from API`);
    
    const now = Date.now();
    
    // Transform the API data to our internal format
    const events = {
      active: [],
      upcoming: []
    };
    
    response.data.data.forEach(event => {
      const eventData = {
        name: event.name,
        map: event.map,
        icon: event.icon,
        startsAt: event.startTime,
        endsAt: event.endTime,
        isActive: now >= event.startTime && now < event.endTime
      };
      
      if (eventData.isActive) {
        events.active.push(eventData);
      } else if (event.startTime > now) {
        events.upcoming.push(eventData);
      }
    });
    
    // Sort upcoming by start time
    events.upcoming.sort((a, b) => a.startsAt - b.startsAt);
    
    console.log(`✓ Found ${events.active.length} active and ${events.upcoming.length} upcoming events`);
    
    // Convert to timestamps for consistency with fallback system
    return convertToTimestamps(events);
  } catch (error) {
    console.error('Error fetching events from API:', error.message);
    return null;
  }
}

/**
 * Convert scraped events to bot format with timestamps (already has timestamps from API)
 */
function convertToTimestamps(events) {
  // Events already have timestamps from API, just format them properly
  return {
    active: events.active.map(event => ({
      name: event.name,
      map: event.map,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      duration: Math.round((event.endsAt - event.startsAt) / 1000 / 60), // in minutes
      isActive: true
    })),
    upcoming: events.upcoming.map(event => ({
      name: event.name,
      map: event.map,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      duration: Math.round((event.endsAt - event.startsAt) / 1000 / 60), // in minutes
      isActive: false
    }))
  };
}

module.exports = {
  scrapeEvents,
  convertToTimestamps
};
