// admin.js
import express from "express";
import bodyParser from "body-parser";
import { loadMessages, saveMessages } from "./utils.js";

export function startAdmin() {
  const app = express();
  app.use(bodyParser.json());

  // 👉 Alle Nachrichten anzeigen
  app.get("/", (req, res) => {
    const messages = loadMessages();
    res.send(`
      <h1>Adminpanel</h1>
      <ul>
        ${messages
          .map(
            (m) => `
          <li>
            <b>User:</b> ${m.userId}<br>
            <b>Original:</b> ${m.message}<br>
            <b>Geplant für:</b> ${new Date(
              m.scheduledTimestamp
            ).toLocaleString()}<br>
            <b>Status:</b> ${m.sent ? "✅ Gesendet" : "⏳ Offen"}<br>
            ${
              m.sent
                ? `
              <b>Gesendet am:</b> ${new Date(m.sentAt).toLocaleString()}<br>
              <b>Bot-Antwort:</b> ${m.botResponse}
            `
                : ""
            }
            <form method="POST" action="/reschedule/${m.id}">
              <input type="text" name="timestamp" placeholder="YYYY-MM-DD HH:MM:SS">
              <button type="submit">Neu planen</button>
            </form>
            <form method="POST" action="/sendnow/${m.id}">
              <button type="submit">Sofort senden</button>
            </form>
          </li>
        `
          )
          .join("")}
      </ul>
    `);
  });

  // 👉 Neu planen
  app.post("/reschedule/:id", bodyParser.urlencoded({ extended: true }), (req, res) => {
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === req.params.id);

    if (msg) {
      const newTime = new Date(req.body.timestamp).getTime();
      if (!isNaN(newTime)) {
        msg.scheduledTimestamp = newTime;
        msg.sent = false; // zurücksetzen, falls schon gesendet
        saveMessages(messages);
        console.log(`♻️ Nachricht ${msg.id} neu geplant für ${req.body.timestamp}`);
      }
    }

    res.redirect("/");
  });

  // 👉 Sofort senden
  app.post("/sendnow/:id", (req, res) => {
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === req.params.id);

    if (msg) {
      msg.scheduledTimestamp = Date.now();
      msg.sent = false; // sicherstellen, dass sie rausgeht
      saveMessages(messages);
      console.log(`🚀 Nachricht ${msg.id} für sofortigen Versand markiert`);
    }

    res.redirect("/");
  });

  app.listen(10001, () => {
    console.log("✅ Adminpanel läuft auf Port 10001");
  });
}
