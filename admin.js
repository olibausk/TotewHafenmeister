// admin.js
import express from "express";
import bodyParser from "body-parser";
import { loadMessages, saveMessages } from "./utils.js";

const app = express();
const PORT = 10001;

app.use(bodyParser.json());

// 👉 Übersicht als HTML-Seite
app.get("/", (req, res) => {
  const messages = loadMessages();
  const rows = messages
    .map(
      (m) => `
      <tr>
        <td>${m.id}</td>
        <td>${m.userId}</td>
        <td>${m.message}</td>
        <td>${new Date(m.scheduledTimestamp).toLocaleString()}</td>
        <td>
          <button onclick="editMessage('${m.id}')">✏️ Bearbeiten</button>
          <button onclick="deleteMessage('${m.id}')">🗑️ Löschen</button>
        </td>
      </tr>
    `
    )
    .join("");

  res.send(`
    <html>
      <head>
        <title>Hafenmeister Admin</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
          table { border-collapse: collapse; width: 100%; background: white; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #eee; }
          button { margin-right: 5px; }
        </style>
      </head>
      <body>
        <h1>⚓ Hafenmeister Adminpanel</h1>
        <table>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Nachricht</th>
            <th>Geplanter Zeitpunkt</th>
            <th>Aktionen</th>
          </tr>
          ${rows}
        </table>

        <script>
          async function deleteMessage(id) {
            if (!confirm("Wirklich löschen?")) return;
            await fetch("/messages/" + id, { method: "DELETE" });
            location.reload();
          }

          async function editMessage(id) {
            const newText = prompt("Neuer Nachrichtentext:");
            const newTime = prompt("Neuer Zeitpunkt (YYYY-MM-DD HH:MM):");

            let payload = {};
            if (newText) payload.message = newText;
            if (newTime) {
              const ts = new Date(newTime).getTime();
              if (!isNaN(ts)) payload.scheduledTimestamp = ts;
            }

            await fetch("/messages/" + id, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            location.reload();
          }
        </script>
      </body>
    </html>
  `);
});

// 👉 JSON-API bleibt bestehen
app.get("/messages", (req, res) => {
  res.json(loadMessages());
});

app.post("/messages/:id", (req, res) => {
  const { id } = req.params;
  const { scheduledTimestamp, message } = req.body;

  let messages = loadMessages();
  const index = messages.findIndex((m) => m.id === id);

  if (index === -1) return res.status(404).json({ error: "Message not found" });

  if (scheduledTimestamp) messages[index].scheduledTimestamp = scheduledTimestamp;
  if (message) messages[index].message = message;

  saveMessages(messages);
  res.json({ success: true, updated: messages[index] });
});

app.delete("/messages/:id", (req, res) => {
  const { id } = req.params;
  let messages = loadMessages();
  const filtered = messages.filter((m) => m.id !== id);

  if (filtered.length === messages.length)
    return res.status(404).json({ error: "Message not found" });

  saveMessages(filtered);
  res.json({ success: true });
});

// 👉 Starten
export function startAdmin() {
  app.listen(PORT, () => {
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
  });
}
