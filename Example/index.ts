import { Boom } from '@hapi/boom'
import NodeCache from '@cacheable/node-cache'
import readline from 'readline'
import makeWASocket, {
	delay,
	proto,
	AnyMessageContent,
	DisconnectReason,
	fetchLatestBaileysVersion,
	getAggregateVotesInPollMessage,
	makeCacheableSignalKeyStore,
	makeInMemoryStore,
	useMultiFileAuthState,
	Browsers,
	getContentType,
	jidNormalizedUser,
	WAMessageStubType,
	WAMessageKey,
	WAMessageContent
} from '../src/index.js'
import MAIN_LOGGER from '../lib/Utils/logger.js'
import open from 'open'
import fs from 'fs'
import { format } from 'util'

const logger = MAIN_LOGGER.child({})
const prefix = new RegExp(
	'^([' + ('‎/!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + '])'
)

const useStore = !process.argv.includes('--no-store')
const doReplies = !process.argv.includes('--no-reply')
const usePairingCode = process.argv.includes('--use-pairing-code')
const useMobile = process.argv.includes('--mobile')
const msgRetryCounterCache = new NodeCache()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const store = useStore ? makeInMemoryStore({ logger }) : undefined
store?.readFromFile('./baileys_store_multi.json')
setInterval(() => {
	store?.writeToFile('./baileys_store_multi.json')
}, 10_000)

function patchMessageBeforeSending(msg, jid) {
	if (msg?.deviceSentMessage?.message?.listMessage) {
		console.log('ListType in deviceSentMessage is patched:', msg.deviceSentMessage.message.listMessage.listType)
	}
	if (msg?.listMessage) {
		console.log('ListType in listMessage is patched:', msg.listMessage.listType)
	}
	const requiresPatch = !!(msg.buttonsMessage || msg.templateMessage || msg.listMessage)
	if (requiresPatch) {
		msg = {
			viewOnceMessage: {
				message: {
					messageContextInfo: {
						deviceListMetadata: {},
						deviceListMetadataVersion: 2
					},
					...msg
				}
			}
		}
	}
	console.log(JSON.stringify(msg, null, 2))
	return msg
}

const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`✅ Using WhatsApp v${version.join('.')} | Latest: ${isLatest}`)
	const browser = Browsers.macOS('Safari')

	const sock = makeWASocket({
		version,
		logger,
		browser,
		printQRInTerminal: !usePairingCode,
		mobile: useMobile,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger)
		},
		syncFullHistory: false,
		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		getMessage,
		patchMessageBeforeSending
	})

	store?.bind(sock.ev)

	if (usePairingCode && !sock.authState.creds.registered) {
		if (useMobile) throw new Error('Cannot use pairing code with mobile API')
		const phoneNumber = await question('📱 Enter your WhatsApp number:\n')
		const code = await sock.requestPairingCode(phoneNumber)
		console.log(`🔐 Pairing code for ${phoneNumber}: ${code?.match(/.{1,4}/g)?.join('-') || code}`)
	}

	const reply = async (jid, msg, options) => {
		await sock.presenceSubscribe(jid)
		await delay(500)
		await sock.sendPresenceUpdate('composing', jid)
		await delay(2000)
		await sock.sendPresenceUpdate('paused', jid)
		await sock.sendMessage(jid, msg, options)
	}

	sock.ev.process(async (events) => {
		if (events['connection.update']) {
			const update = events['connection.update']
			const { connection, lastDisconnect } = update
			const code =
				(lastDisconnect?.error instanceof Boom &&
					(lastDisconnect.error.output?.statusCode ||
						lastDisconnect.error.output?.payload?.statusCode)) ||
				undefined

			if (code) console.log({ code, reason: DisconnectReason[code] })
			if (connection === 'close') {
				if (code !== DisconnectReason.loggedOut) startSock()
				else console.log('❌ Connection closed. Logged out.')
			}
			console.log('connection update', update)
		}

		if (events['creds.update']) await saveCreds()
		if (events.call) console.log('📞 Call event:', events.call)

		if (events['messages.update']) {
			for (const { key, update } of events['messages.update']) {
				if (update.pollUpdates) {
					const pollCreation = await getMessage(key)
					if (pollCreation) {
						console.log(
							'🗳 Poll update:',
							getAggregateVotesInPollMessage({
								message: pollCreation,
								pollUpdates: update.pollUpdates
							})
						)
					}
				}
			}
		}

		if (events['messages.upsert']) {
			const upsert = events['messages.upsert']
			let m = upsert.messages[upsert.messages.length - 1]
			m = proto.WebMessageInfo.fromObject(m)

			const senderKeyDistributionMessage = m.message?.senderKeyDistributionMessage?.groupId
			const chat = jidNormalizedUser(
				m.key?.remoteJid ||
					(senderKeyDistributionMessage !== 'status@broadcast' && senderKeyDistributionMessage) ||
					''
			)

			const mtype = getContentType(m.message) || Object.keys(m.message || {})[0] || ''
			const msg =
				!m.message
					? null
					: /viewOnceMessage/.test(mtype)
					? m.message[Object.keys(m.message)[0]]
					: m.message[mtype]

			const body =
				typeof msg === 'string'
					? msg
					: msg?.text || msg?.caption || msg?.contentText || ''

			if (m.messageStubType) {
				console.log({
					messageStubType: WAMessageStubType[m.messageStubType],
					messageStubParameters: m.messageStubParameters,
					participant: m.participant
				})
			}

			const customPrefix = /^×?> /
			const match =
				(customPrefix.test(body)
					? [[customPrefix.exec(body), customPrefix]]
					: [[prefix.exec(body), prefix]])?.find((p) => p[1]) || ''
			const usedPrefix = (match[0] || match[1] || '')[0] || ''
			const noPrefix = body.replace(usedPrefix, '')
			let [command, ...args] = noPrefix.trim().split(/\s+/)
			args = args || []
			let text = args.join(' ')
			command = (command || '').toLowerCase()
			if (!usedPrefix) return

			console.log(`[${m.pushName}] ${usedPrefix + command}`)

			switch (command) {
				case 'list':
					await sock.sendMessage(
						chat,
						{
							text: 'Hello World',
							footer: 'Footer Example',
							buttonText: 'Choose one',
							sections: [
								{
									title: 'Example Section',
									rows: [
										{ title: 'Ping', rowId: usedPrefix + 'ping' },
										{ title: 'Menu', rowId: usedPrefix + 'menu' }
									]
								}
							]
						},
						{ quoted: m }
					)
					break

				case 'ping':
					await reply(chat, { text: 'pong ✅' }, { quoted: m })
					break

				default:
					if (customPrefix.test(body)) {
						let i = 10
						let _return
						const _text =
							/^(×>)/.test(usedPrefix) ? 'return ' + noPrefix : noPrefix
						try {
							const exec = new (async () => {}).constructor(
								'print',
								'm',
								'sock',
								'chat',
								'process',
								'args',
								'require',
								_text
							)
							_return = await exec.call(sock, (...args) => {
								if (--i < 1) return
								return reply(chat, { text: format(...args) }, { quoted: m })
							}, m, sock, chat, process, args, require)
						} catch (e) {
							_return = e
						} finally {
							await sock.sendMessage(chat, { text: format(_return) }, { quoted: m })
						}
					}
			}
		}
	})

	async function getMessage(key) {
		if (store) {
			const msg = await store.loadMessage(key.remoteJid, key.id)
			return msg?.message
		}
		return proto.Message.fromObject({})
	}
}

startSock()