// scheduler.js
import { loadMessages, saveMessages } from "./utils.js";
import { client } from "./index.js";

// Zufallsgenerator für Bot-Antwort
function randomAntwort(userId) {
  const roll = Math.random() * 100;
  if (roll < 80) {
    return `Sehr geehrte/r <@${userId}>, Ihre Waren kommen in der nächsten Woche am Bahnhof an. Bitte lassen Sie diese vom Postmeister abholen.\nGezeichnet Postamt`;
  } else if (roll < 95) {
    return `Sehr geehrte/r <@${userId}>, Ihre Waren kommen in der nächsten Woche am Bahnhof an. Leider war ein Teil der Ladung beschädigt und musste entsorgt werden.\nGezeichnet Postamt`;
  } else {
    return `Sehr geehrte/r <@${userId}>, auf einem Überfall wurde die Ladung gestohlen. Die Lieferung ist leider nicht versichert.\nGezeichnet Postamt`;
  }
}

export async function sendScheduledMessage(msg) {
  try {
    const channel = await client.channels.fetch(msg.channelId);
    const antwort = randomAntwort(msg.userId);

    await channel.send(antwort);

    const messages = loadMessages();
    const stored = messages.find(m => m.id === msg.id);
    if (stored) {
      stored.sent = true;
      stored.sentMessage = antwort;
      saveMessages(messages);
    }

    console.log(`📤 Nachricht ${msg.id} gesendet`);
  } catch (err) {
    console.error("❌ Fehler beim Senden:", err);
  }
}

// Scheduler: alle 60 Sek. prüfen
setInterval(async () => {
  const messages = loadMessages();
  const now = Date.now();
  const due = messages.filter(m => !m.sent && m.scheduledTimestamp <= now);

  for (const msg of due) {
    await sendScheduledMessage(msg);
  }

  const pending = messages.filter(m => !m.sent && m.scheduledTimestamp > now);
  if (pending.length > 0) {
    const next = pending.sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp)[0];
    const diff = Math.max(0, Math.round((next.scheduledTimestamp - now) / 1000));
    console.log(`[Scheduler] ⏳ Nächste geplante Antwort: ${new Date(next.scheduledTimestamp).toUTCString()} (${diff} Sekunden verbleibend)`);
  }
}, 60 * 1000);
