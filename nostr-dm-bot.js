import { EventEmitter } from 'events';
import 'websocket-polyfill'
import { getEventHash, getPublicKey, nip04, relayInit, signEvent } from 'nostr-tools';
import FileLogger from 'cln-file-logger'

class NostrDMBot extends EventEmitter {
  constructor(relay_address, sender_private_key_hex, recipient_pub_key_hex, logger = new FileLogger('[NostrDMBot]')) {
    super();

		this.relay_address = relay_address
		this.private_key = sender_private_key_hex
		this.public_key = getPublicKey(this.private_key) 
		this.recipient_pub_key_hex = recipient_pub_key_hex
		this.relay = relayInit(this.relay_address)
		this.logger = logger

		this.relay.on('connect', () => {
			this.logger.logInfo('Connected to relay')
			this.emit('connect')
		})

		this.relay.on('error', (err) => {
			this.logger.logError(err)
			this.emit('error', err)
		})

		const sub = this.relay.sub([
			{
				kinds: [4],
				authors: [this.recipient_pub_key_hex]
			}
		])

		sub.on('event', async (event) => {
			this.logger.logInfo('Received event')
			this.logger.logInfo(event)
			let recipient = event.tags.find(([k, v]) => k === 'p' && v && v !== '')[1]
			if (this.public_key === recipient) {
				let plaintext = await nip04.decrypt(this.private_key, this.recipient_pub_key_hex, event.content)
				this.emit('message', plaintext)
			}
		})
  }

	async connect() {
		await this.relay.connect()
	}

  async publish(content) {
    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }

		let event = {
			kind: 4,
			pubkey: this.public_key,
			created_at: Math.floor(Date.now() / 1000),
			tags: [['p', this.recipient_pub_key_hex]],
			content: await nip04.encrypt(this.private_key, this.recipient_pub_key_hex, content)
		}

		event.id = getEventHash(event)
		event.sig = signEvent(event, this.private_key)

		let pub = this.relay.publish(event)

		pub.on('ok', () => {
			this.logger.logInfo('event published')
		})

		pub.on('failed', () => {
			this.logger.logError('event publish failed')
		})
  }
}

export default NostrDMBot;
