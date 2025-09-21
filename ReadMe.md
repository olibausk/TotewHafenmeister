# 🛳️ Totew Hafenmeister – Discord-Bot & Adminpanel

Totew Hafenmeister ist ein Discord-Bot, der auf Erwähnungen reagiert und Nachrichten mit Verzögerung antwortet – z. B. nach 3 Tagen. Zusätzlich bietet er ein einfaches Web-Adminpanel zum Verwalten, Hinzufügen und Planen von Nachrichten.

---

## 🔧 Features

- Discord-Bot reagiert auf Erwähnungen
- Nachrichten werden verzögert beantwortet (z. B. +72 h)
- Admin-Webinterface zur Verwaltung von Nachrichten
- Nachrichtenplan mit originalem und geplantem Timestamp
- Login-geschützter Zugang zum Adminbereich

---

## 📁 Projektstruktur

```txt
/
├── bot.js             # Discord-Bot-Logik
├── admin.js           # Express-Adminpanel
├── index.js           # Startet Bot & Adminpanel
├── utils.js           # Hilfsfunktionen (z. B. Nachrichten laden/speichern)
├── package.json       # Projektdefinition & Abhängigkeiten
├── messages.json      # (Laufzeit) Nachrichten-Speicher (wird ignoriert)
├── .env               # Umgebungsvariablen (nicht committed)
└── .gitignore         # Ignoriert .env und messages.json
