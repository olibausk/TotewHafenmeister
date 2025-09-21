import express from 'express';
import basicAuth from 'express-basic-auth';
import fs from 'fs';
import bodyParser from 'body-parser';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const messagesFile = './messages.json';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const auth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  realm: 'Admin Panel'
});

function loadMessages() {
  if (!fs.existsSync(messagesFile)) fs.writeFileSync(messagesFile, '[]');
  return JSON.parse(fs.readFileSync(messagesFile));
}

function saveMessages(messages) {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// HTML Admin Panel
app.get('/', auth, (req, res) => {
  const messages = loadMessages();
  const rows = messages.map(msg => `
    <tr>
      <td>${msg.id}</td>
      <td>${msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : ''}</td>
      <td>${msg.scheduledTimestamp ? new Date(msg.scheduledTimestamp * 1000).toISOString() : ''}</td>
      <td>${msg.userId}</td>
      <td>${msg.message}</td>
      <td>
        <form method="POST" action="/delete?token=${process.env.ADMIN_TOKEN}">
          <input type="hidden" name="id" value="${msg.id}" />
          <button type="submit">Löschen</button>
        </form>
      </td>
    </tr>`).join('');

  res.send(`
    <html><body>
    <h1>Admin Panel</h1>
    <table border="1" cellpadding="5">
      <tr><th>ID</th><th>Original Timestamp</th><th>Scheduled</th><th>User</th><th>Nachricht</th><th>Aktion</th></tr>
      ${rows}
    </table>
    <h2>Neue Nachricht hinzufügen</h2>
    <form method="POST" action="/add?token=${process.env.ADMIN_TOKEN}">
      <label>ID: <input name="id" required></label><br>
      <label>UserID: <input name="userId" required></label><br>
      <label>Nachricht: <input name="message" required></label><br>
      <label>Original-Timestamp (ISO): <input name="timestamp" type="datetime-local" required></label><br>
      <label>Scheduled Timestamp (ISO, optional): <input name="scheduledTimestamp" type="datetime-local"></label><br>
      <button type="submit">Speichern</button>
    </form>
    </body></html>
  `);
});

// Add message
app.post('/add', auth, (req, res) => {
  if (req.query.token !== process.env.ADMIN_TOKEN) return res.status(403).send('Invalid token');

  const { id, userId, message, timestamp, scheduledTimestamp } = req.body;

  const parsedOriginal = Date.parse(timestamp);
  const parsedScheduled = scheduledTimestamp ? Date.parse(scheduledTimestamp) : parsedOriginal;

  if (isNaN(parsedOriginal) || isNaN(parsedScheduled)) {
    return res.status(400).send('Invalid date format');
  }

  const newMessage = {
    id,
    userId,
    message,
    timestamp: Math.floor(parsedOriginal / 1000),
    scheduledTimestamp: Math.floor(parsedScheduled / 1000),
  };

  const messages = loadMessages();
  messages.push(newMessage);
  saveMessages(messages);
  res.redirect('/');
});

// Delete message
app.post('/delete', auth, (req, res) => {
  if (req.query.token !== process.env.ADMIN_TOKEN) return res.status(403).send('Invalid token');
  const { id } = req.body;
  const messages = loadMessages().filter(msg => msg.id !== id);
  saveMessages(messages);
  res.redirect('/');
});

// Debug JSON
app.get('/debug/messages', auth, (req, res) => {
  res.json(loadMessages());
});

// Discord Bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
  console.log(`✅ Bot eingeloggt als ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const botId = client.user.id;
  const isBotMentioned = message.mentions.users.has(botId);

  if (isBotMentioned) {
    console.log(`[TRIGGER] Bot wurde erwähnt: ${message.content}`);

    // Nachricht speichern
    const messages = loadMessages();
    messages.push({
      id: message.id,
      timestamp: Math.floor(message.createdTimestamp / 1000),
      scheduledTimestamp: Math.floor(message.createdTimestamp / 1000),
      userId: message.author.id,
      message: message.content,
    });
    saveMessages(messages);
  }
});

client.login(process.env.DISCORD_TOKEN);

// Dummy-Server zum wach halten
app.listen(PORT, () => {
  console.log(`✅ Adminpanel & Server läuft auf Port ${PORT}`);
});
