import express from 'express';
import fs from 'fs';
import path from 'path';
import basicAuth from 'express-basic-auth';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

const DATA_FILE = path.join(__dirname, 'scheduledMessages.json');
const AUTH_USER = 'TotewPostAdmin';
const AUTH_PASS = process.env.ADMIN_PASSWORD || 'changeme'; // in Render als ENV setzen

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(basicAuth({
  users: { [AUTH_USER]: AUTH_PASS },
  challenge: true
}));

function readMessages() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeMessages(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => {
  const messages = readMessages();
  const rows = messages.map(msg => `
    <tr>
      <td>${msg.id}</td>
      <td>${new Date(msg.timestamp).toLocaleString()}</td>
      <td>${new Date(msg.sendAt).toLocaleString()}</td>
      <td>${msg.userId}</td>
      <td>${msg.content}</td>
      <td>
        <form method="POST" action="/delete">
          <input type="hidden" name="id" value="${msg.id}" />
          <button type="submit">Löschen</button>
        </form>
      </td>
    </tr>`).join('');

  res.send(`
    <html>
      <head>
        <title>Admin Panel</title>
      </head>
      <body>
        <h1>Geplante Nachrichten</h1>
        <table border="1">
          <tr><th>ID</th><th>Erstellt</th><th>Geplant</th><th>UserID</th><th>Nachricht</th><th>Aktion</th></tr>
          ${rows}
        </table>
        <h2>Neue Nachricht hinzufügen</h2>
        <form method="POST" action="/add">
          <label>ID: <input type="text" name="id" required></label><br>
          <label>Timestamp (ms seit Epoch): <input type="text" name="timestamp" required></label><br>
          <label>Sendezeitpunkt (ms seit Epoch): <input type="text" name="sendAt" required></label><br>
          <label>User ID: <input type="text" name="userId" required></label><br>
          <label>Inhalt: <input type="text" name="content" required></label><br>
          <button type="submit">Hinzufügen</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/delete', (req, res) => {
  const { id } = req.body;
  let messages = readMessages();
  messages = messages.filter(msg => msg.id !== id);
  writeMessages(messages);
  res.redirect('/');
});

app.post('/add', (req, res) => {
  const { id, timestamp, sendAt, userId, content } = req.body;
  let messages = readMessages();
  messages.push({ id, timestamp: parseInt(timestamp), sendAt: parseInt(sendAt), userId, content });
  writeMessages(messages);
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`✅ Admin-Panel läuft auf Port ${PORT}`);
});
