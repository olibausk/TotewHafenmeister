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

  app.use(express.static(path.join(__dirname, "public")));

  // Alle Nachrichten abrufen
  app.get("/api/messages", (req, res) => {
    res.json(loadMessages());
  });

  // Nachricht neu planen
  app.post("/api/reschedule/:id", (req, res) => {
    const messages = loadMessages();
    const msg = messages.find(m => m.id === req.params.id);

    if (msg) {
      const newTime = new Date(req.body.timestamp).getTime();
      if (!isNaN(newTime)) {
        msg.scheduledTimestamp = newTime;
        msg.sent = false;
        saveMessages(messages);
        console.log(`♻️ Nachricht ${msg.id} neu geplant für ${req.body.timestamp}`);
      }
    }

    res.json({ success: true });
  });

  // Sofort senden
  app.post("/api/sendnow/:id", (req, res) => {
    const messages = loadMessages();
    const msg = messages.find(m => m.id === req.params.id);

    if (msg) {
      msg.scheduledTimestamp = Date.now();
      msg.sent = false;
      saveMessages(messages);
      console.log(`🚀 Nachricht ${msg.id} für sofortigen Versand markiert`);
    }

    res.json({ success: true });
  });

  // ❌ Nachricht löschen
  app.delete("/api/delete/:id", (req, res) => {
    let messages = loadMessages();
    messages = messages.filter(m => m.id !== req.params.id);
    saveMessages(messages);
    console.log(`🗑️ Nachricht ${req.params.id} gelöscht`);
    res.json({ success: true });
  });

  app.listen(10001, () => {
    console.log("✅ Adminpanel läuft auf Port 10001");
  });
}
