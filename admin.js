// admin.js
import express from "express";
import { loadMessages, saveMessages } from "./utils.js";

export function startAdmin(client) {
  const app = express();
  app.use(express.json());
  app.use(express.static("public"));

  // 📜 Alle Nachrichten abrufen
  app.get("/messages", (req, res) => {
    const messages = loadMessages();
    res.json(messages);
  });

  // ⏰ Zeitpunkt aktualisieren
  app.post("/update/:id", (req, res) => {
    const { id } = req.params;
    const { scheduledTimestamp } = req.body;
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === id);

    if (!msg) return res.status(404).send("Not found");
    msg.scheduledTimestamp = scheduledTimestamp;
    saveMessages(messages);
    res.json({ success: true });
  });

  // 📤 Sofort senden
  app.post("/sendNow/:id", async (req, res) => {
    const { id } = req.params;
    const messages = loadMessages();
    const msg = messages.find((m) => m.id === id);

    if (!msg) return res.status(404).send("Not found");
    if (msg.sent) return res.status(400).send("Already sent");

    try {
      const channel = await client.channels.fetch(msg.channelId);

      const roll = Math.random() * 100;
      let antwort = "";
      if (roll < 80) {
        antwort = `Sehr geehrte/r <@${msg.userId}>, Ihre Waren kommen in der nächsten Woche im Hafen von Annesburg an.\nGezeichnet Hafenmeisterei Annesburg`;
      } else if (roll < 95) {
        antwort = `Sehr geehrte/r <@${msg.userId}>, leider haben Ratten die Hälfte Ihrer Ladung zerstört.\nGezeichnet Hafenmeister Annesburg`;
      } else {
        antwort = `Sehr geehrte/r <@${msg.userId}>, das Schiff mit Ihrer Bestellung ist gesunken.\nGezeichnet Hafenmeister Annesburg`;
      }

      await channel.send(antwort);

      msg.sent = true;
      msg.botMessage = antwort;
      saveMessages(messages);

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Fehler beim sofortigen Senden:", err);
      res.status(500).send("Fehler beim Senden");
    }
  });

  app.listen(10001, () => {
    console.log("✅ Adminpanel läuft auf Port 10001");
  });
}
