// admin.js
import express from "express";
import bodyParser from "body-parser";
import { loadMessages, saveMessages } from "./utils.js";

export function startAdmin() {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  // HTML Adminpanel
  app.get("/", (req, res) => {
    const messages = loadMessages();

    res.send(`
      <html>
        <head>
          <title>Hafenmeister Adminpanel</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            h1 { color: #333; }
            .msg { background: white; padding: 10px; margin: 10px 0; border-radius: 6px; }
            .sent { background: #e0ffe0; }
            .meta { font-size: 0.9em; color: #666; }
            form { margin-top: 5px; }
            textarea { width: 100%; height: 40px; }
            button { margin-right: 5px; }
          </style>
        </head>
        <body>
          <h1>⚓ Hafenmeister Adminpanel</h1>
          ${messages
            .map(
              (m, idx) => `
              <div class="msg ${m.sent ? "sent" : ""}">
                <b>User:</b> ${m.userId}<br/>
                <b>Original:</b> ${m.message}<br/>
                ${
                  m.sent
                    ? `<b>✅ Gesendet:</b> ${m.response || "(keine Antwort)"}`
                    : `<b>📅 Geplant:</b> ${new Date(m.scheduledTimestamp).toLocaleString()}`
                }
                <div class="meta">ID: ${m.id}</div>

                ${
                  !m.sent
                    ? `
                <form method="POST" action="/update/${idx}">
                  <label>Neuer Zeitpunkt (YYYY-MM-DD HH:MM):</label><br/>
                  <input type="text" name="time" value="${new Date(
                    m.scheduledTimestamp
                  ).toISOString().slice(0, 16).replace("T", " ")}"/>
                  <button type="submit">Speichern</button>
                </form>
                <form method="POST" action="/sendNow/${idx}">
                  <button type="submit">🚀 Sofort senden</button>
                </form>
                `
                    : ""
                }
                <form method="POST" action="/delete/${idx}">
                  <button type="submit">🗑️ Löschen</button>
                </form>
              </div>
            `
            )
            .join("")}
        </body>
      </html>
    `);
  });

  // Zeitpunkt ändern
  app.post("/update/:idx", (req, res) => {
    const messages = loadMessages();
    const idx = parseInt(req.params.idx, 10);
    if (messages[idx]) {
      const newTime = req.body.time;
      const ts = Date.parse(newTime);
      if (!isNaN(ts)) {
        messages[idx].scheduledTimestamp = ts;
        saveMessages(messages);
        console.log(`✏️ Nachricht ${messages[idx].id} auf ${new Date(ts)} geändert`);
      }
    }
    res.redirect("/");
  });

  // Sofort senden (setzt Timestamp = jetzt)
  app.post("/sendNow/:idx", (req, res) => {
    const messages = loadMessages();
    const idx = parseInt(req.params.idx, 10);
    if (messages[idx]) {
      messages[idx].scheduledTimestamp = Date.now();
      saveMessages(messages);
      console.log(`🚀 Nachricht ${messages[idx].id} auf sofort gestellt`);
    }
    res.redirect("/");
  });

  // Löschen
  app.post("/delete/:idx", (req, res) => {
    const messages = loadMessages();
    const idx = parseInt(req.params.idx, 10);
    if (messages[idx]) {
      console.log(`🗑️ Nachricht ${messages[idx].id} gelöscht`);
      messages.splice(idx, 1);
      saveMessages(messages);
    }
    res.redirect("/");
  });

  const PORT = 10001;
  app.listen(PORT, () => {
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
  });
}
