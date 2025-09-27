import dotenv from 'dotenv';
dotenv.config();

import { startBot } from './bot.js';
import { startAdmin } from './admin.js';

startBot();
startAdmin();
