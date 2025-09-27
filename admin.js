// admin.js
import express from "express";
import bodyParser from "body-parser";
import { loadMessages, saveMessages } from "./utils.js";

export function startAdmin() {
  const app = express();
  app.use(bodyParser.json());

  // ➡️ Alle Nachrichten als JSON abrufen
  app.get("/messages", (req, res) => {
    const messages = loadMessages();
    res.json(messages);
  });

  // ➡️ Übersicht im Browser (Tabelle)
  app.get("/messages/view", (req, res) => {
    const messages = loadMessages();
    let html = `
      <html>
      <head>
        <title>Hafenmeister Admin</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>Geplante Nachrichten</h1>
        <table>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Nachricht</th>
            <th>Geplant für</th>
            <th>Gesendet?</th>
          </tr>`;

    messages.forEach(m => {
      html += `
        <tr>
          <td>${m.id}</td>
          <td>${m.userId}</td>
          <td>${m.message}</td>
          <td>${new Date(m.scheduledTimestamp).toUTCString()}</td>
          <td>${m.sent ? "✅ Ja" : "❌ Nein"}</td>
        </tr>`;
    });

    html += `</table></body></html>`;
    res.send(html);
  });

  // ➡️ Nachricht bearbeiten (z. B. Zeitpunkt ändern)
  app.post("/messages/update", (req, res) => {
    const { id, scheduledTimestamp } = req.body;
    let messages = loadMessages();

    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.scheduledTimestamp = scheduledTimestamp;
      saveMessages(messages);

      console.log(
        `✅ Nachricht ${id} aktualisiert – neuer Zeitpunkt: ${new Date(
          scheduledTimestamp
        ).toUTCString()}`
      );

      res.json({ success: true, message: "Nachricht aktualisiert." });
    } else {
      console.log(`⚠️ Nachricht ${id} nicht gefunden – keine Änderung`);
      res
        .status(404)
        .json({ success: false, message: "Nachricht nicht gefunden." });
    }
  });

  // ➡️ Adminpanel starten
  const port = 10001;
  app.listen(port, () => {
    console.log(`✅ Adminpanel läuft auf Port ${port}`);
  });
}
