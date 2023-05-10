import NostrDMBot from "./nostr-dm-bot.js"
import FileLogger from "cln-file-logger"
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const bot_secret = "45e237f0a302a7f5835137716341d5bd9019a12342ed7bd5d57c6e4fde98a47d"
const your_pubkey = "2f4fa408d85b962d1fe717daae148a4c98424ab2e10c7dd11927e101ed3257b2"
const some_relay = 'wss://nostr.klabo.blog'


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new FileLogger('[NostrDMBot]', path.join(__dirname, 'example.log'))

const bot = new NostrDMBot(some_relay, bot_secret, your_pubkey, logger)

bot.on('message', (msg) => {
	console.log('👍 received message', msg)
})

bot.on('connect', async () => {
	console.log('👍 connected to relay')
	await bot.publish('Hello world')
})

bot.on('error', (err) => {
	console.log('👎 error', err)
})

setTimeout(() => {
  console.log('Timeout reached, process will exit');
}, 3600000); // Keep the proc

await bot.connect()