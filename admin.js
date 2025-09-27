// admin.js
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { loadMessages, saveMessages } from "./utils.js";

export function startAdmin() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // 👉 Public-Ordner für HTML/CSS/JS
  app.use(express.static(path.join(__dirname, "public")));

  // API: Alle Nachrichten holen
  app.get("/api/messages", (req, res) => {
    const messages = loadMessages();
    res.json(messages);
  });

  // API: Neu planen
  app.post("/api/reschedule/:id", (req, res) => {
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === req.params.id);

    if (msg) {
      const newTime = new Date(req.body.timestamp).getTime();
      if (!isNaN(newTime)) {
        msg.scheduledTimestamp = newTime;
        msg.sent = false; // zurücksetzen
        saveMessages(messages);
        console.log(`♻️ Nachricht ${msg.id} neu geplant für ${req.body.timestamp}`);
      }
    }

    res.json({ success: true });
  });

  // API: Sofort senden
  app.post("/api/sendnow/:id", (req, res) => {
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === req.params.id);

    if (msg) {
      msg.scheduledTimestamp = Date.now();
      msg.sent = false;
      saveMessages(messages);
      console.log(`🚀 Nachricht ${msg.id} für sofortigen Versand markiert`);
    }

    res.json({ success: true });
  });

  app.listen(10001, () => {
    console.log("✅ Adminpanel läuft auf Port 10001");
  });
}
