// index.js
import dotenv from "dotenv";
dotenv.config();
import { startBot } from './bot.js';
import { startAdmin } from './admin.js';
import { Client, GatewayIntentBits } from "discord.js";

// ✅ Hafenmeister-Bot extra Client
const hafenClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

hafenClient.once("ready", () => {
  console.log(`⚓ Hafenmeister-Bot eingeloggt als ${hafenClient.user.tag}`);
});

hafenClient.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const cmd = message.content.toLowerCase();
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
});

// 🚀 Starte die beiden bestehenden Module
startBot();
startAdmin();

// 🔑 Login Hafenmeister-Bot
hafenClient.login(process.env.HAFEN_TOKEN);
