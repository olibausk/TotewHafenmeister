// index.js
import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import { startAdmin } from "./admin.js";
import { loadMessages, saveMessages } from "./utils.js";

// ✅ Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`⚓ Hafenmeister-Bot eingeloggt als ${client.user.tag}`);
});

// 📥 Nachrichten-Handler
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const cmd = message.content.toLowerCase();

  // 👉 Command !hafen
  if (cmd === "!hafen") {
    const roll = Math.random() * 100;
    let antwort = "";

    if (roll < 80) {
      antwort = `Sehr geehrte/r <@${message.author.id}>, Ihre Waren kommen in der nächsten Woche im Hafen von Annesburg an. Bitte lassen Sie diese vom Postmeister abholen.  
Gezeichnet Hafenmeisterei Annesburg`;
    } else if (roll < 95) {
      antwort = `Sehr geehrte/r <@${message.author.id}>, Ihre Waren kommen in der nächsten Woche im Hafen von Annesburg an. Leider haben Ratten auf dem Schiff die Hälfte der Ladung angeknabbert und die Seeleute mussten diese Kiste über Bord werfen. Eine Erstattung wird es nicht geben, seien Sie froh, dass die Mehrarbeit nicht in Rechnung gestellt wurde.  
Gezeichnet Hafenmeister Annesburg`;
    } else {
      antwort = `Sehr geehrte/r <@${message.author.id}>, das Schiff mit Ihrer Bestellung ist untergegangen. Die Reederei ist leider nicht versichert, daher gibt es weder Waren noch Geld zurück. Hier müssen Sie eine neue Bestellung auslösen.  
Gezeichnet Hafenmeister Annesburg`;
    }

    message.reply(antwort);
  }

  // 👉 Speichere Erwähnungen (nur beim ersten Mal)
  if (message.mentions.has(client.user)) {
    const messages = loadMessages();
    const exists = messages.find(m => m.id === message.id);

    if (!exists) {
      messages.push({
        id: message.id,
        message: message.content,
        userId: message.author.id,
        timestamp: message.createdTimestamp,
        scheduledTimestamp: Date.now() + 2 * 24 * 60 * 60 * 1000, // Standard: +2 Tage
        sent: false,
      });

      saveMessages(messages);
      console.log(`💾 Nachricht gespeichert: ${message.content}`);
    } else {
      console.log(`⚠️ Nachricht ${message.id} schon vorhanden, wird nicht überschrieben`);
    }
  }
});

// 🔑 Login
client.login(process.env.HAFEN_TOKEN);

// 🚀 Adminpanel starten
startAdmin();

// 🕒 Scheduler-Log für Debug
setInterval(() => {
  const messages = loadMessages();
  const now = Date.now();
  const pending = messages.filter(m => !m.sent && m.scheduledTimestamp > now);

  if (pending.length > 0) {
    const next = pending.sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp)[0];
    const diff = Math.max(0, Math.round((next.scheduledTimestamp - now) / 1000));
    console.log(`[Scheduler] ⏳ Nächste geplante Antwort: ${new Date(next.scheduledTimestamp).toUTCString()} (${diff} Sekunden verbleibend)`);
  }
}, 60 * 1000); // alle 60 Sekunden prüfen
