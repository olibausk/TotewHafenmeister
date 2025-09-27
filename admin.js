// admin.js
import dotenv from "dotenv";
dotenv.config(); // <--- sorgt dafür, dass .env auch hier geladen ist

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
  const PORT = process.env.ADMIN_PORT || 10001;

  // Auth mit ADMIN_USER / ADMIN_PASS
  const users = {};
  if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
    users[process.env.ADMIN_USER] = process.env.ADMIN_PASS;
  } else {
    console.error("❌ Bitte ADMIN_USER und ADMIN_PASS in der .env setzen!");
    process.exit(1);
  }

  app.use(
    basicAuth({
      users,
      challenge: true,
      realm: "Hafenmeister-Admin",
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logs anzeigen
  app.get("/logs", (req, res) => {
    const logfile = path.join(__dirname, "hafenmeister.log");
    if (!fs.existsSync(logfile)) return res.send("Keine Logs vorhanden");
    const content = fs.readFileSync(logfile, "utf-8");
    res.type("text/plain").send(content);
  });

  // Nachrichten abrufen
  app.get("/api/messages", (req, res) => {
    res.json(loadMessages());
  });

  // Nachricht sofort senden
  app.post("/api/sendNow", (req, res) => {
    const { id } = req.body;
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === id);
    if (msg) {
      msg.scheduledTimestamp = Date.now();
      saveMessages(messages);
      return res.json({ ok: true, message: "Auf sofort gestellt" });
    }
    res.status(404).json({ ok: false });
  });

  // Nachricht löschen
  app.post("/api/delete", (req, res) => {
    const { id } = req.body;
    let messages = loadMessages();
    messages = messages.filter((m) => m.id !== id);
    saveMessages(messages);
    return res.json({ ok: true });
  });

  // Dashboard
  app.get("/", (req, res) => {
    res.send(`
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Hafenmeister Admin</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            textarea { width: 100%; height: 300px; }
          </style>
          <script>
            async function refresh() {
              const res = await fetch('/logs');
              const text = await res.text();
              document.getElementById('logs').value = text;
              setTimeout(refresh, 5000);
            }
            window.onload = refresh;
          </script>
        </head>
        <body>
          <h1>Hafenmeister Admin</h1>
          <h2>Logs</h2>
          <textarea id="logs" readonly></textarea>
        </body>
      </html>
    `);
  });

  app.listen(PORT, () =>
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`)
  );
}
