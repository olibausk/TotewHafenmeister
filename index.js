// index.js

import express from 'express';
import basicAuth from 'express-basic-auth';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth
app.use(['/admin', '/api/clear', '/api/add'], basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
}));

const DB_FILE = './db.json';
let geplanteAntworten = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : {};

const speichern = () => fs.writeFileSync(DB_FILE, JSON.stringify(geplanteAntworten, null, 2));

// Discord Bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const antworten = [
  {
    chance: 0.7,
    text: (user) => `Sehr geehrte/r <@${user}>,\nIhre Bestellung trifft in der nächsten Woche im Hafen von Annesburg ein. Bitte lassen Sie Ihre Bestellung hier abholen.\nGez. Annesburg Hafenmeisterei`
  },
  {
    chance: 0.2,
    text: (user) => `Sehr geehrte/r <@${user}>,\nIhre Bestellung trifft in der nächsten Woche im Hafen von Annesburg ein. Leider haben Ratten auf dem Schiff die Hälfte der bestellten Waren zerstört bzw. die Matrosen mussten die Hälfte der Waren über Bord gehen lassen um die Ratten zu versenken. Bitte lassen Sie die Bestellung in der nächsten Woche hier abholen.\nGez. Annesburg Hafenmeisterei`
  },
  {
    chance: 0.1,
    text: (user) => `Sehr geehrte/r <@${user}>,\ndas Schiff mit Ihrer Bestellung ist leider gesunken. Da die Reederei nicht versichert war und nun insolvent ist, kann keine Erstattung erfolgen. Bitte bestellen Sie erneut.\nGez. Annesburg Hafenmeisterei`
  },
];

function planeAntwort(message) {
  const id = message.id;
  const userId = message.author.id;
  const jetzt = Date.now();
  const versandZeit = jetzt + 2 * 24 * 60 * 60 * 1000; // 2 Tage

  geplanteAntworten[id] = {
    id,
    userId,
    timestamp: jetzt,
    versandZeit,
    originalText: message.content
  };

  speichern();
  console.log(`🕒 Nachricht geplant: ${id} von ${message.author.tag}`);
}

client.on(Events.MessageCreate, message => {
  if (message.author.bot) return;
  const botMentionedDirectly = message.mentions.users.has(client.user.id);
  if (botMentionedDirectly) {
    planeAntwort(message);
  }
});

setInterval(() => {
  const jetzt = Date.now();
  for (const id in geplanteAntworten) {
    const eintrag = geplanteAntworten[id];
    if (eintrag.versandZeit <= jetzt) {
      const channel = client.channels.cache.find(c => c.isTextBased() && c.messages);
      if (channel) {
        const antwort = waehleAntwort(eintrag.userId);
        channel.send({ content: antwort });
        console.log(`📤 Gesendet: ${antwort}`);
      }
      delete geplanteAntworten[id];
      speichern();
    }
  }
}, 60 * 1000);

function waehleAntwort(userId) {
  let r = Math.random();
  let acc = 0;
  for (const a of antworten) {
    acc += a.chance;
    if (r < acc) return a.text(userId);
  }
  return antworten[0].text(userId);
}

// Adminpanel (HTML)
app.get('/admin', (req, res) => {
  const items = Object.values(geplanteAntworten)
    .map(e => `
      <tr>
        <td>${e.id}</td>
        <td><code>${e.originalText}</code></td>
        <td>${new Date(e.timestamp).toLocaleString()}</td>
        <td>${new Date(e.versandZeit).toLocaleString()}</td>
        <td>${e.userId}</td>
        <td>
          <form method="POST" action="/api/clear?id=${e.id}">
            <button type="submit">🗑️ Löschen</button>
          </form>
        </td>
      </tr>`)
    .join('');

  res.send(`
    <html>
    <head><title>Totew Hafenpanel</title></head>
    <body>
      <h1>Geplante Nachrichten</h1>
      <table border="1">
        <tr><th>ID</th><th>Text</th><th>Erstellt</th><th>Geplant für</th><th>User</th><th>Aktion</th></tr>
        ${items || '<tr><td colspan="6">Keine Einträge</td></tr>'}
      </table>
    </body>
    </html>
  `);
});

// API-Route: geplante anzeigen
app.get('/api/list', (req, res) => {
  res.json(Object.values(geplanteAntworten));
});

// API-Route: löschen
app.post('/api/clear', (req, res) => {
  const id = req.query.id;
  if (geplanteAntworten[id]) {
    delete geplanteAntworten[id];
    speichern();
    return res.send(`✅ Nachricht ${id} gelöscht.`);
  }
  res.status(404).send('❌ Nachricht nicht gefunden.');
});

// Dummy-Server
app.get('/', (req, res) => res.send('✅ Dummy-Webserver läuft auf Port ' + PORT));
app.listen(PORT, () => console.log(`✅ Dummy-Webserver läuft auf Port ${PORT}`));

client.login(process.env.DISCORD_TOKEN);
