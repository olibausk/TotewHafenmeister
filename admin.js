// admin.js
import express from "express";
import basicAuth from "express-basic-auth";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.resolve();
const app = express();

// Auth mit ENV Variablen
app.use(
  basicAuth({
    users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
    challenge: true,
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Hilfsfunktion: Logs einlesen mit Timestamp
function readLog(file, lines = 50) {
  try {
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, "utf8").trim().split("\n");
    return content
      .slice(-lines)
      .map((line) => {
        return `[${new Date().toISOString()}] ${line}`;
      });
  } catch (err) {
    return [`Error reading ${file}: ${err.message}`];
  }
}

// Logs für mehrere Bots abrufen
app.get("/logs", (req, res) => {
  const bots = {
    hafenmeister: {
      out: "/root/.pm2/logs/hafenmeister-out.log",
      err: "/root/.pm2/logs/hafenmeister-error.log",
    },
    gambit: {
      out: "/root/.pm2/logs/gambit-out.log",
      err: "/root/.pm2/logs/gambit-error.log",
    },
    totew: {
      out: "/root/.pm2/logs/totew-out.log",
      err: "/root/.pm2/logs/totew-error.log",
    },
  };

  const result = {};
  for (const [name, paths] of Object.entries(bots)) {
    result[name] = {
      out: readLog(paths.out),
      err: readLog(paths.err),
    };
  }

  res.json(result);
});

// Nachrichten-Endpunkte
let messages = [];
export function loadMessages() {
  try {
    const file = path.join(__dirname, "messages.json");
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export function saveMessages(data) {
  const file = path.join(__dirname, "messages.json");
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get("/messages", (req, res) => {
  res.json(loadMessages());
});

app.post("/messages/send", (req, res) => {
  const { id } = req.body;
  let msgs = loadMessages();
  const msg = msgs.find((m) => m.id === id);
  if (msg) {
    msg.scheduledTimestamp = Date.now();
    saveMessages(msgs);
    return res.json({ ok: true });
  }
  res.status(404).json({ ok: false, error: "Message not found" });
});

app.post("/messages/delete", (req, res) => {
  const { id } = req.body;
  let msgs = loadMessages();
  msgs = msgs.filter((m) => m.id !== id);
  saveMessages(msgs);
  res.json({ ok: true });
});

// Start Adminserver
export function startAdmin() {
  const port = process.env.ADMIN_PORT || 10001;
  app.listen(port, () => {
    console.log(`✅ Adminpanel läuft auf Port ${port}`);
  });
}
