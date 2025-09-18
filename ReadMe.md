# Discord-Bot: Verzögerte Antwort nach 3 Tagen

Ein Discord-Bot, der auf eine @Erwähnung reagiert, aber erst **nach 3 Tagen** automatisch mit einer von drei vorgegebenen Antworten auf die ursprüngliche Nachricht antwortet.

## Funktionen

- Erkennt @Erwähnung
- Antwort nach 3 Tagen mit 70/20/10 % Wahrscheinlichkeiten
- Antwort auf die ursprüngliche Nachricht im selben Kanal
- Speichert geplante Antworten in JSON-Datei

## Installation

```bash
git clone https://github.com/dein-username/dein-repo.git
cd dein-repo
npm install
cp .env.example .env
# TOKEN in .env eintragen
npm start
