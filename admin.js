import express from "express";
import basicAuth from "express-basic-auth";
import fs from "fs";

export function startAdmin(logFile = "bot.log", port = 10001) {
  const app = express();

  // Basic Auth direkt auf alles anwenden
  app.use(
    basicAuth({
      users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
      challenge: true,
    })
  );

  // Dashboard direkt unter "/"
  app.get("/", (_req, res) => {
    res.send(`
      <html>
        <head>
          <title>Bot Dashboard</title>
          <meta http-equiv="refresh" content="5">
          <style>
            body { font-family: monospace; background: #111; color: #eee; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Logs</h1>
          <pre>${fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "Noch keine Logs."}</pre>
        </body>
      </html>
    `);
  });

  app.listen(port, () => {
    console.log(`✅ Adminpanel läuft auf Port ${port}`);
  });
}
