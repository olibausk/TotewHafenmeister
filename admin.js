// admin.js
import express from "express";
import basicAuth from "express-basic-auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadMessages, saveMessages } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startAdmin() {
  const app = express();

  // Auth
  app.use(
    basicAuth({
      users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
      challenge: true,
    })
  );

  app.use(express.json());

  // Statische Dateien
  app.use(express.static(path.join(__dirname, "public")));

  // Nachrichten holen
  app.get("/messages", (_req, res) => {
    res.json(loadMessages());
  });

  // Sofort senden
  app.post("/messages/sendnow/:id", (req, res) => {
    const id = req.params.id;
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === id);

    if (!msg) return res.status(404).send("Not found");

    msg.scheduledTimestamp = Date.now();
    saveMessages(messages);

    console.log(`🚀 Nachricht ${id} auf sofort gestellt`);
    res.json({ ok: true });
  });

  // Nachricht löschen
  app.delete("/messages/:id", (req, res) => {
    const id = req.params.id;
    let messages = loadMessages();
    messages = messages.filter((m) => m.id !== id);
    saveMessages(messages);

    console.log(`🗑️ Nachricht ${id} gelöscht`);
    res.json({ ok: true });
  });

  // Logs holen
  app.get("/logs", (_req, res) => {
    const bots = ["hafenmeister", "gambit"];
    const result = {};

    for (const bot of bots) {
      try {
        const outPath = `/root/.pm2/logs/${bot}-out.log`;
        const errPath = `/root/.pm2/logs/${bot}-error.log`;

        const out = fs.existsSync(outPath)
          ? fs.readFileSync(outPath, "utf-8").trim().split("\n").slice(-100)
          : [];
        const err = fs.existsSync(errPath)
          ? fs.readFileSync(errPath, "utf-8").trim().split("\n").slice(-100)
          : [];

        result[bot] = { out, err };
      } catch (e) {
        result[bot] = { out: [], err: [`Fehler beim Laden: ${e.message}`] };
      }
    }

    res.json(result);
  });

  // Start
  const port = process.env.ADMIN_PORT || 10001;
  app.listen(port, () =>
    console.log(`✅ Adminpanel läuft auf Port ${port}`)
  );
}
