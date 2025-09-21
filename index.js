// index.js (komplett mit Login, Adminpanel, Anzeige, Editieren, Löschen)

import express from 'express';
import basicAuth from 'express-basic-auth';
import fs from 'fs';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// .env laden (falls lokal)
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_USER = process.env.ADMIN_USER || 'admin';
const AUTH_PASS = process.env.ADMIN_PASS || 'admin';
const MESSAGE_FILE = './messages.json';

// Bodyparser für Formulardaten
app.use(bodyParser.urlencoded({ extended: true }));

// Authentifizierungsmiddleware
const basicAuthMiddleware = basicAuth({
  users: { [AUTH_USER]: AUTH_PASS },
  challenge: true,
});

// Nachrichten laden
let scheduledMessages = [];
function loadMessages() {
  if (fs.existsSync(MESSAGE_FILE)) {
    scheduledMessages = JSON.parse(fs.readFileSync(MESSAGE_FILE));
  }
}
function saveMessages() {
  fs.writeFileSync(MESSAGE_FILE, JSON.stringify(scheduledMessages, null, 2));
}
loadMessages();

// Dummy-Webserver
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Adminpanel anzeigen
app.get('/admin', basicAuthMiddleware, (req, res) => {
  res.send(`
    <html>
    <head><title>Adminpanel</title></head>
    <body>
      <h1>Adminpanel – Geplante Antworten</h1>
      <form method="POST" action="/admin/add">
        <h2>Neue Nachricht hinzufügen</h2>
        <label>Message ID: <input type="text" name="id" required></label><br>
        <label>User ID: <input type="text" name="userId" required></label><br>
        <label>Text: <input type="text" name="originalMessage" required></label><br>
        <label>Ursprünglicher Zeitpunkt:
          <input type="datetime-local" name="originalTimestamp" required>
        </label><br>
        <label>Geplanter Versandzeitpunkt:
          <input type="datetime-local" name="scheduledTimestamp">
          <small>(optional – sonst wie oben)</small>
        </label><br>
        <button type="submit">➕ Hinzufügen</button>
      </form>
      <hr>
      <h2>Geplante Nachrichten</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>ID</th><th>User ID</th><th>Text</th><th>Geplant für</th><th>Speichern</th><th>Löschen</th>
        </tr>
        ${scheduledMessages.map(msg => `
          <tr>
            <form method="POST" action="/admin/update/${msg.id}">
              <td>${msg.id}</td>
              <td>${msg.userId}</td>
              <td>${msg.originalMessage}</td>
              <td>
                <input type="datetime-local" name="scheduledTimestamp"
                       value="${new Date(msg.scheduledTimestamp).toISOString().slice(0,16)}" required>
              </td>
              <td><button type="submit">💾 Speichern</button></td>
            </form>
            <td>
              <form method="POST" action="/admin/delete/${msg.id}" onsubmit="return confirm('Wirklich löschen?')">
                <button type="submit">❌ Löschen</button>
              </form>
            </td>
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `);
});

// Nachricht hinzufügen
app.post('/admin/add', basicAuthMiddleware, (req, res) => {
  const { id, userId, originalMessage, originalTimestamp, scheduledTimestamp } = req.body;
  const originalTs = new Date(originalTimestamp).getTime();
  const scheduledTs = scheduledTimestamp ? new Date(scheduledTimestamp).getTime() : originalTs;

  scheduledMessages.push({ id, userId, originalMessage, originalTimestamp: originalTs, scheduledTimestamp: scheduledTs });
  saveMessages();
  res.redirect('/admin');
});

// Nachricht bearbeiten (Zeitpunkt)
app.post('/admin/update/:id', basicAuthMiddleware, (req, res) => {
  const id = req.params.id;
  const newTs = new Date(req.body.scheduledTimestamp).getTime();
  const msg = scheduledMessages.find(m => m.id === id);

  if (!msg || isNaN(newTs)) return res.status(400).send('Ungültige Daten');
  msg.scheduledTimestamp = newTs;
  saveMessages();
  res.redirect('/admin');
});

// Nachricht löschen
app.post('/admin/delete/:id', basicAuthMiddleware, (req, res) => {
  const id = req.params.id;
  scheduledMessages = scheduledMessages.filter(m => m.id !== id);
  saveMessages();
  res.redirect('/admin');
});

app.listen(port, () => {
  console.log(`✅ Adminpanel läuft auf Port ${port}`);
});
