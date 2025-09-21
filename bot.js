import { Client, GatewayIntentBits } from 'discord.js';
import { loadMessages, saveMessages } from './utils.js';

const token = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`🤖 Bot angemeldet als ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const isBotMentioned = message.mentions.has(client.user);
  if (!isBotMentioned) return;

  const messages = loadMessages();
  messages.push({
    id: message.id,
    message: message.content,
    userId: message.author.id,
    timestamp: message.createdTimestamp,
    scheduledTimestamp: Date.now() + 2 * 24 * 60 * 60 * 1000,
    sent: false
  });

  saveMessages(messages);
  console.log(`💾 Nachricht gespeichert: ${message.content}`);
});

export function startBot() {
  client.login(token);
}
