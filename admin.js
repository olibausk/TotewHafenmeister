import express from 'express';
import basicAuth from 'express-basic-auth';
import { loadMessages, saveMessages } from './utils.js';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const ADMIN_USER = 'TotewPostAdmin';
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(['/admin', '/delete', '/update', '/debug/messages'], basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true
}));

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
    <html><head><title>TotewPost Adminpanel</title>
    <style>table, th, td { border: 1px solid black; padding: 6px; }</style></head><body>
      <h2>TotewPost Adminpanel</h2>
      <table><thead>
        <tr><th>ID</th><th>Nachricht</th><th>User ID</th><th>Original</th><th>Geplant</th><th>Löschen</th></tr>
      </thead><tbody>${rows}</tbody></table>
      <h3>Neue Nachricht</h3>
      <form method="POST" action="/add">
        <label>Nachricht:<br><input name="message" required></label><br>
        <label>User ID:<br><input name="userId" required></label><br>
        <label>Original Zeit:<br><input type="datetime-local" name="timestamp" required></label><br>
        <label>Geplante Zeit:<br><input type="datetime-local" name="scheduledTimestamp"></label><br><br>
        <button>Hinzufügen</button>
      </form>
    </body></html>
  `);
});

app.post('/add', (req, res) => {
  const { message, userId, timestamp, scheduledTimestamp } = req.body;
  const originalTs = new Date(timestamp).getTime();
  const plannedTs = scheduledTimestamp ? new Date(scheduledTimestamp).getTime() : originalTs + 2 * 24 * 60 * 60 * 1000;

  const messages = loadMessages();
  messages.push({
    id: Date.now().toString(),
    message,
    userId,
    timestamp: originalTs,
    scheduledTimestamp: plannedTs,
    sent: false
  });

  saveMessages(messages);
  res.redirect('/');
});

app.post('/delete', (req, res) => {
  const { id } = req.query;
  const { token } = req.body;
  if (token !== ADMIN_TOKEN) return res.status(403).send('Unauthorized');

  const messages = loadMessages().filter(m => m.id !== id);
  saveMessages(messages);
  res.redirect('/');
});

app.post('/update', (req, res) => {
  const { id } = req.query;
  const { scheduledTimestamp } = req.body;

  const messages = loadMessages().map(m => {
    if (m.id === id) m.scheduledTimestamp = new Date(scheduledTimestamp).getTime();
    return m;
  });

  saveMessages(messages);
  res.redirect('/');
});

// ✅ Debug-Route zum Anzeigen der messages.json
app.get('/debug/messages', (req, res) => {
  const messages = loadMessages();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(messages, null, 2));
});

export function startAdmin() {
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
  });
}
