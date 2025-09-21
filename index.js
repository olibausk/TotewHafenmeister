import express from 'express';
import fs from 'fs';
import basicAuth from 'express-basic-auth';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_USER = 'TotewPostAdmin';
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const MESSAGES_FILE = './messages.json';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Basis Auth
app.use(['/admin', '/delete', '/update'], basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true
}));

// Hilfsfunktion zum Laden der Daten
function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Hilfsfunktion zum Speichern der Daten
function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Adminpanel
app.get('/', (req, res) => {
  const messages = loadMessages();

  const rows = messages.map(msg => {
    const formattedOriginal = new Date(msg.timestamp).toISOString().slice(0, 16);
    const formattedScheduled = new Date(msg.scheduledTimestamp).toISOString().slice(0, 16);
    return `
      <tr>
        <td>${msg.id}</td>
        <td>${msg.message}</td>
        <td>${msg.userId}</td>
        <td>${formattedOriginal}</td>
        <td>
          <form method="POST" action="/update?id=${msg.id}">
            <input type="datetime-local" name="scheduledTimestamp" value="${formattedScheduled}">
            <button type="submit">💾</button>
          </form>
        </td>
        <td>
          <form method="POST" action="/delete?id=${msg.id}">
            <input type="hidden" name="token" value="${ADMIN_TOKEN}">
            <button type="submit">❌</button>
          </form>
        </td>
      </tr>
    `;
  }).join('');

  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>TotewPost Adminpanel</title>
      <style>
        table, th, td { border: 1px solid black; border-collapse: collapse; padding: 6px; }
        th { background: #f0f0f0; }
        input[type="text"], input[type="datetime-local"] { width: 100%; }
      </style>
    </head>
    <body>
      <h2>TotewPost Adminpanel</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nachricht</th>
            <th>User ID</th>
            <th>Original Timestamp</th>
            <th>Scheduled Timestamp</th>
            <th>Löschen</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <h3>➕ Neue Nachricht hinzufügen</h3>
      <form method="POST" action="/add">
        <label>Nachricht:<br><input type="text" name="message" required></label><br><br>
        <label>User ID:<br><input type="text" name="userId" required></label><br><br>
        <label>Original Timestamp (ISO):<br>
          <input type="datetime-local" name="timestamp" required>
        </label><br><br>
        <label>Geplanter Timestamp (optional):<br>
          <input type="datetime-local" name="scheduledTimestamp">
        </label><br><br>
        <button type="submit">➕ Hinzufügen</button>
      </form>
    </body>
    </html>
  `);
});

// Nachricht hinzufügen
app.post('/add', (req, res) => {
  const { message, userId, timestamp, scheduledTimestamp } = req.body;
  const originalTs = new Date(timestamp).getTime();
  let plannedTs = scheduledTimestamp ? new Date(scheduledTimestamp).getTime() : originalTs + 2 * 24 * 60 * 60 * 1000;

  const messages = loadMessages();
  const id = Date.now().toString(); // einfache ID-Generierung
  messages.push({
    id,
    message,
    userId,
    timestamp: originalTs,
    scheduledTimestamp: plannedTs,
    sent: false
  });

  saveMessages(messages);
  res.redirect('/');
});

// Nachricht löschen
app.post('/delete', (req, res) => {
  const { id } = req.query;
  const { token } = req.body;
  if (token !== ADMIN_TOKEN) return res.status(403).send('Unauthorized');

  let messages = loadMessages();
  messages = messages.filter(msg => msg.id !== id);
  saveMessages(messages);
  res.redirect('/');
});

// Timestamp aktualisieren
app.post('/update', (req, res) => {
  const { id } = req.query;
  const { scheduledTimestamp } = req.body;
  let messages = loadMessages();
  messages = messages.map(msg => {
    if (msg.id === id) {
      msg.scheduledTimestamp = new Date(scheduledTimestamp).getTime();
    }
    return msg;
  });
  saveMessages(messages);
  res.redirect('/');
});

// Dummy-Start
app.listen(PORT, () => {
  console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
});
