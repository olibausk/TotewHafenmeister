const fs = require('fs');
const express = require("express");
const { Client, GatewayIntentBits, Events } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PORT = process.env.PORT || 10000;
const app = express();
app.get("/", (_, res) => res.send("Bot läuft."));
app.listen(PORT, () => console.log(`✅ Dummy-Webserver läuft auf Port ${PORT}`));

const DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 Tage
// const DELAY_MS = 10 * 60 * 1000; // 10 Minuten
const ANTWORTEN_DATEI = './antworten.json';

let geplanteAntworten = {};

// Lade geplante Antworten
if (fs.existsSync(ANTWORTEN_DATEI)) {
  try {
    geplanteAntworten = JSON.parse(fs.readFileSync(ANTWORTEN_DATEI));
  } catch {
    geplanteAntworten = {};
  }
}

// Antwortmöglichkeiten
function wähleAntwort(userId) {
  const zufall = Math.random();

  if (zufall < 0.7) {
    return `Sehr geehrte/r <@${userId}>,\nIhre Bestellung trifft in der nächsten Woche im Hafen von Annesburg ein. Bitte lassen Sie Ihre Bestellung hier abholen.\nGez. Annesburg Hafenmeisterei`;
  } else if (zufall < 0.9) {
    return `Sehr geehrte/r <@${userId}>,\nIhre Bestellung trifft in der nächsten Woche im Hafen von Annesburg ein. Leider haben Ratten auf dem Schiff die Hälfte der bestellten Waren zerstört bzw. die Matrosen mussten die Hälfte der Waren über Bord gehen lassen um die Ratten zu versenken. Bitte lassen Sie die Bestellung in der nächsten Woche hier abholen.\nGez. Annesburg Hafenmeisterei`;
  } else {
    return `Sehr geehrte/r <@${userId}>,\ndas Schiff mit Ihrer Bestellung ist leider gesunken. Da die Reederei nicht versichert war und nun insolvent ist, kann keine Erstattung erfolgen. Bitte bestellen Sie erneut.\nGez. Annesburg Hafenmeisterei`;
  }
}

// Planung und Speicherung
function planeAntwort(message) {
  const id = message.id;
  if (geplanteAntworten[id]) return;

  geplanteAntworten[id] = {
    userId: message.author.id,
    channelId: message.channel.id,
    timestamp: Date.now()
  };

  fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
}

// Regelmäßig prüfen
setInterval(() => {
  const jetzt = Date.now();
  for (const [id, info] of Object.entries(geplanteAntworten)) {
    if (jetzt - info.timestamp >= DELAY_MS) {
      const kanal = client.channels.cache.get(info.channelId);
      if (kanal) {
        kanal.messages.fetch(id).then(originalMessage => {
          const antwort = wähleAntwort(info.userId);
          originalMessage.reply(antwort);
        }).catch(() => {});
      }
      delete geplanteAntworten[id];
      fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
    }
  }
}, 60 * 1000); // jede Minute

client.on(Events.MessageCreate, message => {
  if (message.author.bot) return;
  if (message.mentions.has(client.user)) {
    console.log(`🕒 Geplante Antwort für Nachricht von ${message.author.tag}`);
    planeAntwort(message);
  }
});

client.login(process.env.TOKEN);
