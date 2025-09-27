import express from "express";
import basicAuth from "express-basic-auth";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

function getLogs(filename) {
  const LOG_DIR = "/root/.pm2/logs";
  try {
    const filePath = path.join(LOG_DIR, filename);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");
    return lines.slice(-50).join("\n");
  } catch (err) {
    return `⚠️ Fehler beim Laden von ${filename}: ${err.message}`;
  }
}

export function startAdmin() {
  const app = express();
  const PORT = process.env.PORT_ADMIN || 10001;

  // Authentifizierung
  app.use(
    "/admin",
    basicAuth({
      users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
      challenge: true,
    })
  );

  // Dashboard
  app.get("/admin", (_req, res) => {
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="5">
          <title>Bot Logs Dashboard</title>
          <style>
            body { font-family: monospace; background: #111; color: #eee; }
            h1 { font-size: 1.2em; }
            .logs { display: flex; gap: 20px; }
            .column { flex: 1; background: #222; padding: 10px; border-radius: 5px; overflow-y: scroll; height: 90vh; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Bot Logs Dashboard</h1>
          <div class="logs">
            <div class="column">
              <h2>Hafenmeister</h2>
              <pre>${getLogs("hafenmeister-out.log")}</pre>
            </div>
            <div class="column">
              <h2>Totew</h2>
              <pre>${getLogs("totew-out.log")}</pre>
            </div>
            <div class="column">
              <h2>Gambit</h2>
              <pre>${getLogs("gambit-out.log")}</pre>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  app.listen(PORT, () => {
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
  });
}
