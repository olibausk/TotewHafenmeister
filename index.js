const fs = require('fs');
const express = require("express");
const basicAuth = require('express-basic-auth');
const { Client, GatewayIntentBits, Events } = require("discord.js");

const PORT = process.env.PORT || 10000;
const TOKEN = process.env.TOKEN;
const ADMIN_USER = "TotewPostAdmin";
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ANTWORTEN_DATEI = './antworten.json';
const DELAY_MS = 2 * 24 * 60 * 60 * 1000; // 2 Tage

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const app = express();
app.use(express.urlencoded({ extended: true }));

let geplanteAntworten = {};

// Datei laden
if (fs.existsSync(ANTWORTEN_DATEI)) {
  try {
    geplanteAntworten = JSON.parse(fs.readFileSync(ANTWORTEN_DATEI));
  } catch {
    geplanteAntworten = {};
  }
}

// Zufällige Antwort wählen
function wähleAntwort(userId) {
  const zufall = Math.random();
  if (zufall < 0.7) {
    return `Sehr geehrte/r <@${userId}>,\nIhre Bestellung trifft in der nächsten Woche im Hafen von Annesburg ein. Bitte lassen Sie Ihre Bestellung hier abholen.\nGez. Annesburg Hafenmeisterei`;
  } else if (zufall < 0.9) {
    return `Sehr geehrte/r <@${userId}>,\nRatten haben einen Teil Ihrer Ware gefressen, bitte holen Sie ab, was übrig ist.\nGez. Annesburg Hafenmeisterei`;
  } else {
    return `Sehr geehrte/r <@${userId}>,\ndas Schiff mit Ihrer Bestellung ist leider gesunken. Bitte bestellen Sie erneut.\nGez. Annesburg Hafenmeisterei`;
  }
}

// Nachricht planen
function planeAntwort(message) {
  const id = message.id;
  if (geplanteAntworten[id]) return;

  geplanteAntworten[id] = {
    userId: message.author.id,
    channelId: message.channel.id,
    timestamp: Date.now(),
    content: message.content
  };

  fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
  console.log(`📝 Antwort geplant: ID ${id} | User ${message.author.tag} | Nachricht: ${message.content}`);
}

// Regelmäßige Prüfung
setInterval(() => {
  const jetzt = Date.now();
  for (const [id, info] of Object.entries(geplanteAntworten)) {
    if (jetzt - info.timestamp >= DELAY_MS) {
      const kanal = client.channels.cache.get(info.channelId);
      if (kanal) {
        kanal.messages.fetch(id).then(originalMessage => {
          const antwort = wähleAntwort(info.userId);
          originalMessage.reply(antwort);
          console.log(`📤 Antwort gesendet für ID ${id}: ${antwort}`);
        }).catch(() => {});
      }
      delete geplanteAntworten[id];
      fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
    }
  }
}, 60 * 1000);

// Bot reagiert bei Erwähnung
client.on(Events.MessageCreate, message => {
  if (message.author.bot) return;
  if (message.mentions.has(client.user)) {
    planeAntwort(message);
  }
});

// Dummy-Webserver
app.get("/", (_, res) => res.send("Bot läuft."));

// HTML-Adminpanel mit Login
app.use("/admin", basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
  realm: "Totew Hafenmeister Admin"
}));

app.get("/admin", (_, res) => {
  const rows = Object.entries(geplanteAntworten).map(([id, info]) => {
    const inMs = info.timestamp + DELAY_MS - Date.now();
    const inMin = Math.round(inMs / 60000);
    return `
      <tr>
        <td>${id}</td>
        <td>${info.userId}</td>
        <td>${new Date(info.timestamp).toLocaleString()}</td>
        <td>in ${inMin} min</td>
        <td>${info.content}</td>
        <td>
          <form method="POST" action="/admin/clear">
            <input type="hidden" name="id" value="${id}">
            <button type="submit">Löschen</button>
          </form>
        </td>
      </tr>`;
  }).join("");

  res.send(`
    <html><head><title>Totew Hafenmeister</title></head>
    <body>
      <h1>Geplante Antworten</h1>
      <table border="1" cellpadding="5">
        <tr><th>ID</th><th>UserID</th><th>Erstellt</th><th>Sendet in</th><th>Nachricht</th><th>Aktion</th></tr>
        ${rows || "<tr><td colspan='6'>Keine geplanten Antworten</td></tr>"}
      </table>
    </body></html>
  `);
});

// POST zum gezielten Löschen via Panel
app.post("/admin/clear", (req, res) => {
  const id = req.body.id;
  if (geplanteAntworten[id]) {
    delete geplanteAntworten[id];
    fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
    console.log(`❌ Antwort gelöscht: ID ${id}`);
  }
  res.redirect("/admin");
});

// JSON-API mit Token-Absicherung für Übersicht
app.get("/status", (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(403).send("Zugriff verweigert");
  res.json(geplanteAntworten);
});

// JSON-API mit Token-Absicherung zum gezielten Löschen
app.get("/clear", (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(403).send("Zugriff verweigert");
  const id = req.query.id;
  if (!id || !geplanteAntworten[id]) return res.status(404).send("Nicht gefunden");
  delete geplanteAntworten[id];
  fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
  console.log(`❌ Antwort gelöscht über API: ID ${id}`);
  res.send("OK");
});

app.listen(PORT, () => console.log(`✅ Dummy-Webserver läuft auf Port ${PORT}`));
client.login(TOKEN);
