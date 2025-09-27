// admin.js
import express from "express";
import bodyParser from "body-parser";
import { loadMessages, saveMessages } from "./utils.js";

export function startAdmin() {
  const app = express();
  app.use(bodyParser.json());

  // ✅ Übersicht aller Nachrichten
  app.get("/messages/view", (req, res) => {
    const messages = loadMessages();

    const html = `
      <html>
        <head>
          <title>Hafenmeister Admin</title>
          <style>
            body { font-family: sans-serif; margin: 20px; background: #f7f7f7; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; background: white; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #eee; }
            form { margin: 0; }
            input[type="datetime-local"] { padding: 4px; }
            button { padding: 4px 8px; margin-left: 4px; }
          </style>
        </head>
        <body>
          <h1>Geplante Nachrichten</h1>
          <table>
            <tr>
              <th>User</th>
              <th>Nachricht</th>
              <th>Geplant für</th>
              <th>Aktion</th>
            </tr>
            ${messages
              .map(m => {
                const iso = new Date(m.scheduledTimestamp).toISOString().slice(0,16);
                return `
                  <tr>
                    <td>${m.userId}</td>
                    <td>${m.message}</td>
                    <td>
                      <form method="POST" action="/messages/update">
                        <input type="hidden" name="id" value="${m.id}" />
                        <input type="datetime-local" name="scheduledTime" value="${iso}" />
                        <button type="submit">Speichern</button>
                      </form>
                    </td>
                    <td>${m.sent ? "✅ gesendet" : "⏳ offen"}</td>
                  </tr>
                `;
              })
              .join("")}
          </table>
        </body>
      </html>
    `;
    res.send(html);
  });

  // ✅ Update-Route für das Formular
  app.post("/messages/update", express.urlencoded({ extended: true }), (req, res) => {
    const { id, scheduledTime } = req.body;
    if (!id || !scheduledTime) {
      return res.status(400).send("Fehlende Felder.");
    }

    const newTimestamp = new Date(scheduledTime).getTime();
    let messages = loadMessages();
    const msg = messages.find(m => m.id === id);

    if (!msg) {
      return res.status(404).send("Nachricht nicht gefunden.");
    }

    msg.scheduledTimestamp = newTimestamp;
    saveMessages(messages);

    console.log(`✅ Nachricht ${id} aktualisiert – neuer Zeitpunkt: ${new Date(newTimestamp).toUTCString()}`);
    res.redirect("/messages/view");
  });

  // Start Server
  const port = 10001;
  app.listen(port, () => {
    console.log(`✅ Adminpanel läuft auf Port ${port}`);
  });
}
