// admin.js
import express from "express";
import bodyParser from "body-parser";
import { loadMessages, saveMessages } from "./utils.js";
import { sendScheduledMessage } from "./scheduler.js";

const app = express();
const PORT = 10001;

app.use(bodyParser.json());
app.use(express.static("public"));

// 👉 Nachrichtenliste
app.get("/messages", (req, res) => {
  const messages = loadMessages();
  res.json(messages);
});

// 👉 Nachricht updaten (Zeit ändern)
app.post("/update", (req, res) => {
  const { id, scheduledTimestamp } = req.body;
  const messages = loadMessages();
  const msg = messages.find(m => m.id === id);
  if (msg) {
    msg.scheduledTimestamp = new Date(scheduledTimestamp).getTime();
    saveMessages(messages);
    console.log(`✏️ Nachricht ${id} auf ${msg.scheduledTimestamp} geändert`);
  }
  res.json({ success: true });
});

// 👉 Nachricht sofort senden
app.post("/send-now", async (req, res) => {
  const { id } = req.body;
  const messages = loadMessages();
  const msg = messages.find(m => m.id === id);
  if (msg && !msg.sent) {
    await sendScheduledMessage(msg);
    return res.json({ success: true });
  }
  res.json({ success: false, error: "Nicht gefunden oder schon gesendet" });
});

export function startAdmin() {
  app.listen(PORT, () => {
    console.log(`✅ Adminpanel läuft auf Port ${PORT}`);
  });
}
