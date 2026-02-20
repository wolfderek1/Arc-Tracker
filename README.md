# Arc Raiders Event Tracker Bot

A Discord bot that tracks and displays event timers for Arc Raiders maps.

## Features

- 🎮 Track events across multiple Arc Raiders maps
- ⏰ Real-time event notifications with Discord timestamps
- 📅 View all events for the next 24 hours
- 🔴 See currently active events
- ⏳ Check upcoming events

## Available Commands

- `/events` - Show current and upcoming Arc Raiders events
- `/nextevent` - Show the next upcoming event
- `/allevents` - Show all events for the next 24 hours

## Setup Instructions

### Prerequisites

- Node.js 16.9.0 or higher
- A Discord Bot Token

### Getting Your Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot"
5. Under the "TOKEN" section, click "Copy" to copy your bot token
6. Go to the "OAuth2" → "General" section and copy your "CLIENT ID"
7. Go to "OAuth2" → "URL Generator":
   - Select scopes: `bot`, `applications.commands`
   - Select bot permissions: `Send Messages`, `Use Slash Commands`
   - Copy the generated URL and open it to invite the bot to your server

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Edit the `.env` file and add your Discord bot credentials:
```
DISCORD_TOKEN=your_actual_bot_token
CLIENT_ID=your_actual_client_id
```

5. Start the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Map Events

The bot tracks events for the following maps:

### Slagteriet
- Supply Drop (15 min, every 2 hours)
- Elite Squad (20 min, every 3 hours)
- Resource Surge (30 min, every 4 hours)

### Reactor Core
- Energy Spike (15 min, every 2 hours)
- Meltdown Warning (25 min, every 3 hours)
- Contamination Zone (20 min, every 2.5 hours)

### Frozen Wastes
- Blizzard (20 min, every 2.5 hours)
- Ice Storm (15 min, every 2 hours)
- Arctic Convoy (30 min, every 4 hours)

### Industrial District
- Factory Alarm (15 min, every 2 hours)
- Convoy Route (25 min, every 3 hours)
- Heavy Patrol (20 min, every 2.5 hours)

## Customization

To customize event timings, edit `src/eventTracker.js` and modify the `EVENT_CONFIGS` object. You can:

- Add new maps
- Change event names
- Adjust event durations
- Modify event intervals
- Update base times for event rotations

## Troubleshooting

**Bot doesn't respond to commands:**
- Make sure the bot has been invited with the correct permissions
- Check that slash commands are enabled in your server
- Wait a few minutes for Discord to register the commands globally

**Events show incorrect times:**
- Verify your system time is correct
- Check the `baseTime` values in `eventTracker.js`

## License

MIT License - Feel free to use and modify for your own needs!

## Contributing

Feel free to submit issues or pull requests if you'd like to improve the bot!
