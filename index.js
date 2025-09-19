// 📦 Notwendige Module
const fs = require('fs');
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, Events } = require('discord.js');

// 🔐 Auth-Konfiguration aus ENV
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const TOKEN = process.env.TOKEN;

// 🔁 Initiale Setup
const app = express();
const PORT = process.env.PORT || 10000;
const DELAY_MS = 2 * 24 * 60 * 60 * 1000; // 2 Tage
const ANTWORTEN_DATEI = './antworten.json';

let geplanteAntworten = {};
if (fs.existsSync(ANTWORTEN_DATEI)) {
  try {
    geplanteAntworten = JSON.parse(fs.readFileSync(ANTWORTEN_DATEI));
  } catch {
    geplanteAntworten = {};
  }
}

// 🔑 Auth
app.use(['/admin', '/admin/*'], basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: 'Zugriff verweigert'
}));

// 🔧 Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 🤖 Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🌐 Dummy Route
app.get('/', (_, res) => res.send('Bot läuft.'));

// 🧾 Übersichtspanel
app.get('/admin', (_, res) => {
  const einträge = Object.entries(geplanteAntworten).map(([id, info]) => {
    const inMs = info.timestamp + DELAY_MS;
    const sendAt = new Date(inMs).toLocaleString();
    return `<tr><td>${id}</td><td>${info.userId}</td><td>${info.message || '–'}</td><td>${sendAt}</td><td><form action="/admin/clear/${id}" method="POST"><button>❌</button></form></td></tr>`;
  }).join('');
  res.send(`
    <h2>Geplante Antworten</h2>
    <table border="1" cellpadding="6">
      <tr><th>Nachricht-ID</th><th>User-ID</th><th>Inhalt</th><th>Geplant für</th><th>Löschen</th></tr>
      ${einträge || '<tr><td colspan="5">Keine geplanten Antworten</td></tr>'}
    </table>
    <h3>Manuell hinzufügen</h3>
    <form method="POST" action="/admin/add">
      <label>Nachricht-ID: <input name="id" required></label><br>
      <label>User-ID: <input name="userId" required></label><br>
      <label>Channel-ID: <input name="channelId" required></label><br>
      <label>Nachricht: <textarea name="message" rows="3" cols="40"></textarea></label><br>
      <button type="submit">➕ Hinzufügen</button>
    </form>
  `);
});

// ➕ Manuelles Hinzufügen
app.post('/admin/add', (req, res) => {
  const { id, userId, channelId, message } = req.body;
  if (!id || !userId || !channelId) return res.send('Fehlende Felder.');
  geplanteAntworten[id] = { userId, channelId, timestamp: Date.now(), message };
  fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
  res.redirect('/admin');
});

// ❌ Eintrag löschen
app.post('/admin/clear/:id', (req, res) => {
  const id = req.params.id;
  delete geplanteAntworten[id];
  fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
  res.redirect('/admin');
});

// 💬 Antwortmöglichkeiten
function wähleAntwort(userId) {
  const zufall = Math.random();
  if (zufall < 0.7) {
    return `Sehr geehrte/r <@${userId}>,\nIhre Bestellung trifft in der nächsten Woche im Hafen von Annesburg ein.`;
  } else if (zufall < 0.9) {
    return `Sehr geehrte/r <@${userId}>,\nRatten haben leider Teile Ihrer Lieferung zerstört.`;
  } else {
    return `Sehr geehrte/r <@${userId}>,\nDas Schiff mit Ihrer Bestellung ist gesunken.`;
  }
}

// 🕒 Planung
function planeAntwort(message) {
  const id = message.id;
  if (geplanteAntworten[id]) return;
  geplanteAntworten[id] = {
    userId: message.author.id,
    channelId: message.channel.id,
    timestamp: Date.now(),
    message: message.content
  };
  fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
}

// ⏱ Prüfen und Senden
setInterval(() => {
  const jetzt = Date.now();
  for (const [id, info] of Object.entries(geplanteAntworten)) {
    if (jetzt - info.timestamp >= DELAY_MS) {
      const kanal = client.channels.cache.get(info.channelId);
      if (kanal) {
        kanal.messages.fetch(id).then(original => {
          const antwort = wähleAntwort(info.userId);
          console.log(`📤 Sende Antwort an ${info.userId}: ${antwort}`);
          original.reply(antwort);
        }).catch(() => {});
      }
      delete geplanteAntworten[id];
      fs.writeFileSync(ANTWORTEN_DATEI, JSON.stringify(geplanteAntworten, null, 2));
    }
  }
}, 60 * 1000);

// 📩 Nachrichten-Empfang
client.on(Events.MessageCreate, message => {
  if (message.author.bot) return;
  if (message.mentions.has(client.user)) {
    console.log(`🕒 Geplante Antwort für Nachricht ${message.id} von ${message.author.tag}`);
    planeAntwort(message);
  }
});

client.login(TOKEN);

// 🌍 Start Server
app.listen(PORT, () => console.log(`✅ Webserver aktiv auf Port ${PORT}`));
