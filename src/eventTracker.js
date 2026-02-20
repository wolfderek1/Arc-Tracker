/**
 * Arc Raiders Event Tracker
 * Tracks and calculates event timers for different maps
 */

const webScraper = require('./webScraper');

// Event schedule - each map has 4 event slots that rotate hourly
// The schedule repeats every 4 hours
const EVENT_SCHEDULE = {
  'Spaceport': [
    'Harvester',           // Hour 0, 4, 8, 12, 16, 20
    'Launch Tower Loot',   // Hour 1, 5, 9, 13, 17, 21
    'Prospecting Probes',  // Hour 2, 6, 10, 14, 18, 22
    'Lush Blooms'          // Hour 3, 7, 11, 15, 19, 23
  ],
  'Blue Gate': [
    'Matriarch',
    'Hidden Bunker',
    'Launch Tower Loot',
    'Lush Blooms'
  ],
  'Buried City': [
    'Bird City',
    'Hidden Bunker',
    'Prospecting Probes',
    'Matriarch'
  ],
  'Dam': [
    'Electromagnetic Storm',
    'Harvester',
    'Locked Gate',
    'Launch Tower Loot'
  ],
  'Stella Montis': [
    'Night Raid',
    'Cold Snap',
    'Bird City',
    'Locked Gate'
  ]
};

// Cache for scraped events
let cachedEvents = null;
let lastScrapeTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get which event is active for a map at a specific time
 */
function getEventForHour(mapName, hour) {
  const schedule = EVENT_SCHEDULE[mapName];
  if (!schedule) return null;
  
  // Events rotate every hour in a 4-hour cycle
  const eventIndex = hour % 4;
  return schedule[eventIndex];
}

/**
 * Get all current and upcoming events - tries to fetch live data first
 */
async function getCurrentEvents() {
  // Try to get live data from website
  const now = Date.now();
  
  if (!cachedEvents || (now - lastScrapeTime > CACHE_DURATION)) {
    try {
      const scrapedEvents = await webScraper.scrapeEvents();
      if (scrapedEvents && (scrapedEvents.active.length > 0 || scrapedEvents.upcoming.length > 0)) {
        cachedEvents = webScraper.convertToTimestamps(scrapedEvents);
        lastScrapeTime = now;
        console.log('✓ Using live event data from metaforge.app');
        return cachedEvents;
      }
    } catch (error) {
      console.log('⚠ Web scraper error:', error.message);
    }
  } else if (cachedEvents) {
    console.log('✓ Using cached event data');
    return cachedEvents;
  }

  // Fallback to calculated events if scraping fails
  console.log('⚠ Using fallback event calculations');
  const activeEvents = [];
  const upcomingEvents = [];
  const nowDate = new Date();
  const currentHour = nowDate.getUTCHours();
  
  // Get current hour boundaries
  const currentHourStart = new Date(nowDate);
  currentHourStart.setUTCMinutes(0, 0, 0);
  const currentHourEnd = new Date(currentHourStart);
  currentHourEnd.setUTCHours(currentHourStart.getUTCHours() + 1);
  
  // Get next hour boundaries  
  const nextHourStart = new Date(currentHourEnd);
  const nextHourEnd = new Date(nextHourStart);
  nextHourEnd.setUTCHours(nextHourStart.getUTCHours() + 1);

  // Calculate active events for current hour
  Object.keys(EVENT_SCHEDULE).forEach(mapName => {
    const eventName = getEventForHour(mapName, currentHour);
    if (eventName) {
      activeEvents.push({
        name: eventName,
        map: mapName,
        startsAt: currentHourStart.getTime(),
        endsAt: currentHourEnd.getTime(),
        duration: 60,
        isActive: true
      });
    }
  });

  // Calculate upcoming events for next hour
  Object.keys(EVENT_SCHEDULE).forEach(mapName => {
    const eventName = getEventForHour(mapName, currentHour + 1);
    if (eventName) {
      upcomingEvents.push({
        name: eventName,
        map: mapName,
        startsAt: nextHourStart.getTime(),
        endsAt: nextHourEnd.getTime(),
        duration: 60,
        isActive: false
      });
    }
  });

  return {
    active: activeEvents,
    upcoming: upcomingEvents
  };
}

/**
 * Get the next event to start
 */
async function getNextEvent() {
  const events = await getCurrentEvents();
  return events.upcoming.length > 0 ? events.upcoming[0] : null;
}

/**
 * Get all events for the next 24 hours
 */
async function getEventsForNext24Hours() {
  // Try to get live data first
  const liveEvents = await getCurrentEvents();
  if (cachedEvents) {
    // If we have live data, return active + upcoming
    const allEvents = [...liveEvents.active, ...liveEvents.upcoming];
    return allEvents.slice(0, 20);
  }

  // Fallback calculation - get events for next 24 hours
  const allEvents = [];
  const nowDate = new Date();
  
  for (let hourOffset = 0; hourOffset < 24; hourOffset++) {
    const checkHour = (nowDate.getUTCHours() + hourOffset) % 24;
    const checkDate = new Date(nowDate);
    checkDate.setUTCHours(nowDate.getUTCHours() + hourOffset, 0, 0, 0);
    const checkEnd = new Date(checkDate);
    checkEnd.setUTCHours(checkDate.getUTCHours() + 1);
    
    Object.keys(EVENT_SCHEDULE).forEach(mapName => {
      const eventName = getEventForHour(mapName, checkHour);
      if (eventName) {
        allEvents.push({
          name: eventName,
          map: mapName,
          startsAt: checkDate.getTime(),
          endsAt: checkEnd.getTime(),
          duration: 60,
          isActive: hourOffset === 0
        });
      }
    });
  }

  return allEvents;
}

module.exports = {
  getCurrentEvents,
  getNextEvent,
  getEventsForNext24Hours,
  EVENT_SCHEDULE
};
