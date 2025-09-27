import express from "express";
import basicAuth from "express-basic-auth";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { loadMessages, saveMessages } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startAdmin() {
  const app = express();

  app.use(express.json());

  // 🔑 Login mit env
  app.use(
    basicAuth({
      users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
      challenge: true,
    })
  );

  // Nachrichten abrufen
  app.get("/messages", (req, res) => {
    res.json(loadMessages());
  });

  // Nachricht sofort senden
  app.post("/messages/send", (req, res) => {
    const { id } = req.body;
    const messages = loadMessages();
    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "Nicht gefunden" });
    msg.scheduledTimestamp = Date.now();
    saveMessages(messages);
    res.json({ ok: true });
  });

  // Nachricht löschen
  app.post("/messages/delete", (req, res) => {
    const { id } = req.body;
    let messages = loadMessages();
    messages = messages.filter(m => m.id !== id);
    saveMessages(messages);
    res.json({ ok: true });
  });

  // Logs abrufen (letzte 50 Zeilen pro Bot)
  app.get("/logs", (req, res) => {
    const bots = ["hafenmeister", "gambit"];
    const logs = {};
    bots.forEach(bot => {
      try {
        const out = fs.readFileSync(`/root/.pm2/logs/${bot}-out.log`, "utf8")
          .split("\n").slice(-50).join("\n");
        const err = fs.readFileSync(`/root/.pm2/logs/${bot}-error.log`, "utf8")
          .split("\n").slice(-50).join("\n");
        logs[bot] = { out, err };
      } catch {
        logs[bot] = { out: "Keine Logs gefunden", err: "" };
      }
    });
    res.json(logs);
  });

  // Dashboard HTML
  app.use(express.static(path.join(__dirname, "public")));

  app.listen(process.env.ADMIN_PORT || 10001, () => {
    console.log(`✅ Adminpanel läuft auf Port ${process.env.ADMIN_PORT || 10001}`);
  });
}
