function createActiveEventsEmbed(events) {
  const embed = new EmbedBuilder()
    .setColor('#43B581')
    .setTitle('🟢 Arc Raiders - Active Events')
    .setTimestamp()
    .setFooter({ text: 'Arc Raiders Event Tracker' });

  if (events.active.length > 0) {
    const activeText = events.active.map(e => {
      const endsTimestamp = Math.floor(e.endsAt / 1000);
      return `🟢 **${e.name}**\n📍 ${e.map}\n⏱️ Ends <t:${endsTimestamp}:R>`;
    }).join('\n\n');
    embed.addFields({ name: '━━━ ACTIVE NOW ━━━', value: activeText, inline: false });
  } else {
    embed.addFields({ name: '━━━ ACTIVE NOW ━━━', value: '⚫ No active events', inline: false });
  }

  if (events.upcoming.length > 0) {
    // Get unique start times to find the next timeslot
    const nextStartTime = events.upcoming[0].startsAt;
    const nextEvents = events.upcoming.filter(e => e.startsAt === nextStartTime);
    const upcomingText = nextEvents.map(e => {
      const startsTimestamp = Math.floor(e.startsAt / 1000);
      return `🔵 **${e.name}**\n📍 ${e.map}\n🕐 Starts <t:${startsTimestamp}:R>`;
    }).join('\n\n');
    embed.addFields({ name: '━━━ UPCOMING NEXT ━━━', value: upcomingText, inline: false });
  }

  return embed;
}
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const eventTracker = require('./eventTracker');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('events')
    .setDescription('Show currently active Arc Raiders events')
    .addBooleanOption(option =>
      option.setName('live')
        .setDescription('Enable live updates (updates every 30 seconds)')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('next')
    .setDescription('Show upcoming events that will start next'),
  
  new SlashCommandBuilder()
    .setName('event')
    .setDescription('Track a specific event type')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Event name to track')
        .setRequired(true)
        .addChoices(
          { name: 'Bird City', value: 'Bird City' },
          { name: 'Cold Snap', value: 'Cold Snap' },
          { name: 'Electromagnetic Storm', value: 'Electromagnetic Storm' },
          { name: 'Harvester', value: 'Harvester' },
          { name: 'Hidden Bunker', value: 'Hidden Bunker' },
          { name: 'Launch Tower Loot', value: 'Launch Tower Loot' },
          { name: 'Locked Gate', value: 'Locked Gate' },
          { name: 'Lush Blooms', value: 'Lush Blooms' },
          { name: 'Matriarch', value: 'Matriarch' },
          { name: 'Night Raid', value: 'Night Raid' },
          { name: 'Prospecting Probes', value: 'Prospecting Probes' }
        )),
  
  new SlashCommandBuilder()
    .setName('map')
    .setDescription('Show events for a specific map')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Map name')
        .setRequired(true)
        .addChoices(
          { name: 'Spaceport', value: 'Spaceport' },
          { name: 'Blue Gate', value: 'Blue Gate' },
          { name: 'Buried City', value: 'Buried City' },
          { name: 'Dam', value: 'Dam' },
          { name: 'Stella Montis', value: 'Stella Montis' }
        )),
  
  new SlashCommandBuilder()
    .setName('allevents')
    .setDescription('Show all events for the next 24 hours')
].map(command => command.toJSON());

// Store active live updates
const liveUpdates = new Map();

// Store last message per channel for deletion
const lastMessages = new Map();

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Arc Raiders Event Bot is ready!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // Delete previous bot message in this channel
    const channelId = interaction.channelId;
    if (lastMessages.has(channelId)) {
      try {
        const previousMessage = lastMessages.get(channelId);
        if (!previousMessage) {
          console.log('No previous message object found for channel:', channelId);
        } else {
          // Clear any live update interval for the previous message
          const updateKey = `${previousMessage.channelId}-${previousMessage.id}`;
          if (liveUpdates.has(updateKey)) {
            clearInterval(liveUpdates.get(updateKey).interval);
            liveUpdates.delete(updateKey);
          }
          await previousMessage.delete();
          console.log('Deleted previous message in channel:', channelId);
        }
      } catch (error) {
        // Message might already be deleted, ignore error
        console.log('Could not delete previous message:', error.message);
      }
    }

    // Defer reply immediately to prevent timeout
    await interaction.deferReply();

    if (commandName === 'events') {
      const live = interaction.options.getBoolean('live') || false;
      const events = await eventTracker.getCurrentEvents();
      const embed = createActiveEventsEmbed(events);
      await interaction.editReply({ embeds: [embed] });
      const message = await interaction.fetchReply();
      if (!message) {
        console.log('fetchReply did not return a message object for events command');
      } else {
        lastMessages.set(interaction.channelId, message);
        console.log('Stored message for deletion in channel:', interaction.channelId, 'message id:', message.id);
      }
      if (live) {
        // Set up live updates
        const updateKey = `${message.channelId}-${message.id}`;
        // Clear any existing interval for this message
        if (liveUpdates.has(updateKey)) {
          clearInterval(liveUpdates.get(updateKey).interval);
        }
        const intervalId = setInterval(async () => {
          try {
            const updatedEvents = await eventTracker.getCurrentEvents();
            const updatedEmbed = createActiveEventsEmbed(updatedEvents);
            await message.edit({ embeds: [updatedEmbed] });
          } catch (err) {
            console.error('Error updating live event:', err);
            clearInterval(intervalId);
            liveUpdates.delete(updateKey);
          }
        }, 30000); // 30 seconds
        liveUpdates.set(updateKey, { interval: intervalId, startTime: Date.now() });
        setTimeout(() => {
          if (liveUpdates.has(updateKey)) {
            clearInterval(liveUpdates.get(updateKey).interval);
            liveUpdates.delete(updateKey);
          }
        }, 600000); // 10 minutes
      }
      lastMessages.set(interaction.channelId, message);
    } else if (commandName === 'event') {
      const eventName = interaction.options.getString('name');
      const events = await eventTracker.getCurrentEvents();
      const filtered = {
        active: events.active.filter(e => e.name === eventName),
        upcoming: events.upcoming.filter(e => e.name === eventName)
      };
      const embedEvent = createEventTypeEmbed(eventName, filtered);
      await interaction.editReply({ embeds: [embedEvent] });
      const message = await interaction.fetchReply();
      if (!message) {
        console.log('fetchReply did not return a message object for event command');
      } else {
        lastMessages.set(interaction.channelId, message);
        console.log('Stored message for deletion in channel:', interaction.channelId, 'message id:', message.id);
      }
    } else if (commandName === 'map') {
      const mapName = interaction.options.getString('name');
      const events = await eventTracker.getCurrentEvents();
      // Filter events by map
      const filtered = {
        active: events.active.filter(e => e.map === mapName),
        upcoming: events.upcoming.filter(e => e.map === mapName)
      };
      const embed = createMapEmbed(mapName, filtered);
      await interaction.editReply({ embeds: [embed] });
    } else if (commandName === 'next') {
      const events = await eventTracker.getCurrentEvents();
      const embed = createUpcomingEventsEmbed(events);
      await interaction.editReply({ embeds: [embed] });
    } else if (commandName === 'allevents') {
      const allEvents = await eventTracker.getEventsForNext24Hours();
      const embed = createAllEventsEmbed(allEvents);
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error(error);
    const replyMethod = interaction.deferred ? 'editReply' : 'reply';
    await interaction[replyMethod]({ content: 'An error occurred while fetching events.' }).catch(() => {});
  }
});



function createUpcomingEventsEmbed(events) {
  const embed = new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle('⏰ Arc Raiders - Upcoming Events')
    .setTimestamp()
    .setFooter({ text: 'Arc Raiders Event Tracker' });

  if (events.upcoming.length > 0) {
    // Show upcoming events
    const upcomingText = events.upcoming.slice(0, 10).map(e => {
      const startsTimestamp = Math.floor(e.startsAt / 1000);
      return `⏳ **${e.name}**\n📍 ${e.map}\n🕐 Starts <t:${startsTimestamp}:R>`;
    }).join('\n\n');
    embed.addFields({ name: '━━━ STARTING NEXT ━━━', value: upcomingText, inline: false });
  } else {
    embed.addFields({ name: '━━━ STARTING NEXT ━━━', value: '⚫ No upcoming events', inline: false });
  }

  return embed;
}

function createEventTypeEmbed(eventName, events) {
  const embed = new EmbedBuilder()
    .setColor('#FFB347')
    .setTitle(`📍 ${eventName} - Event Schedule`)
    .setTimestamp()
    .setFooter({ text: 'Arc Raiders Event Tracker' });

  if (events.active.length > 0) {
    const activeText = events.active.map(e => {
      const endsTimestamp = Math.floor(e.endsAt / 1000);
      return `🔴 **${e.map}**\n⏱️ Ends <t:${endsTimestamp}:R>`;
    }).join('\n\n');
    embed.addFields({ name: '━━━ ACTIVE NOW ━━━', value: activeText, inline: false });
  }

  if (events.upcoming.length > 0) {
    const upcomingText = events.upcoming.slice(0, 8).map(e => {
      const startsTimestamp = Math.floor(e.startsAt / 1000);
      return `⏳ **${e.map}** • <t:${startsTimestamp}:R>`;
    }).join('\n');
    embed.addFields({ name: '━━━ UPCOMING ━━━', value: upcomingText, inline: false });
  }

  if (events.active.length === 0 && events.upcoming.length === 0) {
    embed.setDescription(`No **${eventName}** events scheduled in the near future.`);
  }

  return embed;
}

function createMapEmbed(mapName, events) {
  const embed = new EmbedBuilder()
    .setColor('#6C63FF')
    .setTitle(`🗺️ ${mapName} - Event Schedule`)
    .setTimestamp()
    .setFooter({ text: 'Arc Raiders Event Tracker' });

  if (events.active.length > 0) {
    const activeText = events.active.map(e => {
      const endsTimestamp = Math.floor(e.endsAt / 1000);
      return `🔴 **${e.name}**\n⏱️ Ends <t:${endsTimestamp}:R>`;
    }).join('\n\n');
    embed.addFields({ name: '━━━ ACTIVE NOW ━━━', value: activeText, inline: false });
  }

  if (events.upcoming.length > 0) {
    const upcomingText = events.upcoming.slice(0, 8).map(e => {
      const startsTimestamp = Math.floor(e.startsAt / 1000);
      return `⏳ **${e.name}** • <t:${startsTimestamp}:R>`;
    }).join('\n');
    embed.addFields({ name: '━━━ UPCOMING ━━━', value: upcomingText, inline: false });
  }

  if (events.active.length === 0 && events.upcoming.length === 0) {
    embed.setDescription(`No events scheduled on **${mapName}** in the near future.`);
  }

  return embed;
}

function createAllEventsEmbed(events) {
  const embed = new EmbedBuilder()
    .setColor('#95E1D3')
    .setTitle('📅 Events - Next 24 Hours')
    .setTimestamp()
    .setFooter({ text: 'Arc Raiders Event Tracker' });

  if (events.length > 0) {
    const eventText = events.map(e => {
      if (e.isActive) {
        const endsTimestamp = Math.floor(e.endsAt / 1000);
        return `🔴 **${e.name}** • ${e.map}\n⏱️ Ends <t:${endsTimestamp}:R>`;
      } else {
        const startsTimestamp = Math.floor(e.startsAt / 1000);
        return `⏳ **${e.name}** • ${e.map}\n🕐 Starts <t:${startsTimestamp}:R>`;
      }
    }).join('\n\n');
    embed.setDescription(eventText);
  } else {
    embed.setDescription('No events scheduled for the next 24 hours.');
  }

  return embed;
}

client.login(process.env.DISCORD_TOKEN);
// Ensure all blocks and functions are properly closed
// (Add missing closing braces if any function or block is unterminated)
