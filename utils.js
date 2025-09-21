import fs from 'fs';

const MESSAGES_FILE = './messages.json';

export function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}
