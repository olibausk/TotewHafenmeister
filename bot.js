import { Client, GatewayIntentBits } from 'discord.js';
import { loadMessages, saveMessages } from './utils.js';

const token = process.env.DISCORD_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`🤖 Bot angemeldet als ${client.user.tag}`);

  // ⏳ Debug-Ausgabe für geplante Nachrichten
  setInterval(() => {
    const messages = loadMessages();
    if (messages.length === 0) return;

    const next = messages
      .filter(m => !m.sent)
      .sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp)[0];

    if (next) {
      const now = Date.now();
      const diff = next.scheduledTimestamp - now;

      if (diff > 0) {
        console.log(
          `⏳ Nächste geplante Antwort: ${new Date(next.scheduledTimestamp).toLocaleString()} (${Math.round(diff / 1000)} Sekunden verbleibend)`
        );
      } else {
        console.log(
          `⚠️ Antwort war fällig um ${new Date(next.scheduledTimestamp).toLocaleString()} (vor ${Math.abs(Math.round(diff / 1000))} Sekunden)`
        );
      }
    }
  }, 60 * 1000); // alle 60 Sekunden prüfen
});

// 📩 Nachrichten-Handler
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // --- SPEICHERN WENN BOT ERWÄHNT WIRD ---
  if (message.mentions.has(client.user)) {
    const messages = loadMessages();
    messages.push({
      id: message.id,
      message: message.content,
      userId: message.author.id,
      timestamp: message.createdTimestamp,
      scheduledTimestamp: Date.now() + 2 * 24 * 60 * 60 * 1000, // +2 Tage
      sent: false
    });
    saveMessages(messages);
    console.log(`💾 Nachricht gespeichert: ${message.content}`);
  }

  // --- DIREKTE ANTWORT BEI "!hafen" ---
  if (content === "!hafen") {
    const roll = Math.random() * 100;
    let antwort = "";

    if (roll < 80) {
      antwort = `Sehr geehrte/r <@${message.author.id}>, Ihre Waren kommen in der nächsten Woche am Bahnhof an. Bitte lassen Sie diese vom Postmeister abholen.\nGezeichnet Postamt`;
    } else if (roll < 95) {
      antwort = `Sehr geehrte/r <@${message.author.id}>, Ihre Waren kommen in der nächsten Woche am Bahnhof an. Leider war ein Teil der Ladung beschädigt und musste entsorgt werden. Eine Erstattung wird es nicht geben, seien Sie froh, dass die Mehrarbeit nicht in Rechnung gestellt wurde.\nGezeichnet Postamt`;
    } else {
      antwort = `Sehr geehrte/r <@${message.author.id}>, das Schiff mit Ihrer Bestellung ist verloren gegangen. Die Lieferung ist leider nicht versichert, daher gibt es weder Waren noch Geld zurück. Hier müssen Sie eine neue Bestellung auslösen.\nGezeichnet Postamt`;
    }

    message.reply(antwort);
  }
});

export function startBot() {
  client.login(token);
}
