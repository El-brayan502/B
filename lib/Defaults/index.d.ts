import { proto } from '../../WAProto'
import type { MediaType, SocketConfig } from '../Types'

export const UNAUTHORIZED_CODES: number[] = [401, 403, 419, 440]
export const DEFAULT_ORIGIN = 'https://web.whatsapp.com'
export const DEF_CALLBACK_PREFIX = 'CB:'
export const DEF_TAG_PREFIX = 'TAG:'
export const PHONE_CONNECTION_CB = 'CB:Pong'
export const WA_DEFAULT_EPHEMERAL = 604800
export const NOISE_MODE = 'Noise_XX_25519_AESGCM_SHA256\0\0\0\0'
export const DICT_VERSION = 4
export const KEY_BUNDLE_TYPE = Buffer.from([5, 110])
export const NOISE_WA_HEADER = Buffer.from('WA', 'utf-8')

export const URL_REGEX = new RegExp(
  '^(https?:\\/\\/)?' +
  '(([\\da-z.-]+)\\.([a-z.]{2,6})|' +
  '(([0-9]{1,3}\\.){3}[0-9]{1,3}))' +
  '(\\:[0-9]{1,5})?(\\/[-a-zA-Z0-9()@:%_+.~#?&/=]*)?$',
  'i'
)

export const WA_CERT_DETAILS = {
  SERIAL: 0x12345678
}

export const PROCESSABLE_HISTORY_TYPES: proto.Message.HistorySyncNotification.HistorySyncType[] = [
  proto.Message.HistorySyncNotification.HistorySyncType.INITIAL_BOOTSTRAP,
  proto.Message.HistorySyncNotification.HistorySyncType.PUSH_NAME,
  proto.Message.HistorySyncNotification.HistorySyncType.INITIAL_STATUS_V3,
  proto.Message.HistorySyncNotification.HistorySyncType.RECENT
]

export const DEFAULT_CONNECTION_CONFIG: SocketConfig = {
  version: [2, 3001, 20251109],
  browser: ['Baileys', 'Chrome', 'Linux'],
  waWebSocketUrl: 'wss://web.whatsapp.com/ws',
  connectTimeoutMs: 20000,
  keepAliveIntervalMs: 10000,
  logQR: false,
  printQRInTerminal: true,
  defaultQueryTimeoutMs: 60000
}

export const MEDIA_PATH_MAP: { [T in MediaType]?: string } = {
  image: '/mms/image',
  video: '/mms/video',
  audio: '/mms/audio',
  document: '/mms/document',
  sticker: '/mms/sticker',
  gif: '/mms/gif'
}

export const MEDIA_HKDF_KEY_MAPPING = {
  audio: 'Audio',
  document: 'Document',
  gif: 'Gif',
  image: 'Image',
  ppic: 'ProfilePic',
  product: 'Product',
  ptt: 'PushToTalk',
  sticker: 'Sticker',
  video: 'Video',
  'thumbnail-document': 'Thumbnail-Document',
  'thumbnail-image': 'Thumbnail-Image',
  'thumbnail-video': 'Thumbnail-Video',
  'thumbnail-link': 'Thumbnail-Link',
  'md-msg-hist': 'Msg-History',
  'md-app-state': 'App-State',
  'product-catalog-image': 'Product-Catalog-Image',
  'payment-bg-image': 'Payment-Bg-Image',
  ptv: 'Peer-To-View'
}

export const MEDIA_KEYS: MediaType[] = [
  'image',
  'video',
  'audio',
  'document',
  'sticker',
  'gif',
  'ppic',
  'product',
  'ptt'
]

export const MIN_PREKEY_COUNT = 5
export const INITIAL_PREKEY_COUNT = 30

export const DEFAULT_CACHE_TTLS = {
  SIGNAL_STORE: 30 * 60 * 1000,
  MSG_RETRY: 60 * 1000,
  CALL_OFFER: 120 * 1000,
  USER_DEVICES: 10 * 60 * 1000
}