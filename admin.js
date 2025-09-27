import express from "express";
import basicAuth from "express-basic-auth";
import fs from "fs";
import path from "path";
import { loadMessages, saveMessages } from "./utils.js";

const app = express();
const PORT = 10001;

// 🔑 Zugangsdaten
app.use(
  basicAuth({
    users: { admin: "038ddd559495ff1d310fd7907d0687b6" }, // Ändere Benutzer & Passwort
    challenge: true,
  })
);

app.use(express.json());
app.use(express.static("public"));

// 📜 Hilfsfunktion: Logs laden
function loadLog(file, lines = 50) {
  try {
    const data = fs.readFileSync(file, "utf-8").split("\n");
    return data.slice(-lines).join("\n");
  } catch {
    return `❌ Keine Logdatei gefunden (${file})`;
  }
}

// ✅ Root: Tabs (UI)
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Hafenmeister Adminpanel</title>
        <style>
          body { font-family: sans-serif; margin: 0; background: #111; color: #eee; }
          nav { display: flex; background: #222; }
          nav button {
            flex: 1;
            padding: 15px;
            border: none;
            background: #222;
            color: #eee;
            cursor: pointer;
          }
          nav button.active { background: #444; }
          .tab { display: none; padding: 20px; }
          .tab.active { display: block; }
          pre { background: #000; padding: 10px; border-radius: 5px; overflow-x: auto; max-height: 70vh; }
          h2 { color: #6cf; }
        </style>
        <script>
          function showTab(tabId) {
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.getElementById("btn-" + tabId).classList.add('active');
          }

          // Auto-Refresh Logs
          async function refreshLogs() {
            const res = await fetch('/dashboard-data');
            const data = await res.json();
            for (const bot in data) {
              document.getElementById("log-" + bot).textContent = data[bot];
            }
          }
          setInterval(refreshLogs, 5000);
          window.onload = () => { refreshLogs(); showTab('messages'); };
        </script>
      </head>
      <body>
        <nav>
          <button id="btn-messages" onclick="showTab('messages')">📨 Nachrichten</button>
          <button id="btn-dashboard" onclick="showTab('dashboard')">📊 Dashboard</button>
        </nav>

        <div id="messages" class="tab">
          <h2>Nachrichtenverwaltung</h2>
          <iframe src="/messages-ui" style="width:100%;height:80vh;border:none;"></iframe>
        </div>

        <div id="dashboard" class="tab">
          <h2>Bot-Logs</h2>
          <div style="display:flex; gap:20px;">
            <div><h3>Hafenmeister</h3><pre id="log-hafenmeister"></pre></div>
            <div><h3>Gambit</h3><pre id="log-gambit"></pre></div>
            <div><h3>Viehgesundheit</h3><pre id="log-totew"></pre></div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// ✅ Logs JSON (für Auto-Refresh)
app.get("/dashboard-data", (_req, res) => {
  const bots = {
    hafenmeister: "/root/.pm2/logs/hafenmeister-out.log",
    gambit: "/root/.pm2/logs/gambit-out.log",
    totew: "/root/.pm2/logs/totew-out.log",
  };
  const out = {};
  for (const [name, file] of Object.entries(bots)) {
    out[name] = loadLog(file, 50);
  }
  res.json(out);
});

// ✅ Nachrichten-UI als eigenes HTML (iframe in Tab 1)
app.get("/messages-ui", (_req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// ✅ API für Nachrichten
app.get("/messages", (_req, res) => {
  res.json(loadMessages());
});

app.post("/messages", (req, res) => {
  saveMessages(req.body);
  res.json({ ok: true });
});

export function startAdmin() {
  app.listen(PORT, () => {
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
  });
}
