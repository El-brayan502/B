"use strict"

const { proto } = require("../../WAProto")
const { makeLibSignalRepository } = require("../Signal/libsignal")
const { Browsers } = require("../Utils")
const logger = require("../Utils/logger").default
const { version } = require("./baileys-version.json")

exports.UNAUTHORIZED_CODES = [401, 403, 419, 440]
exports.DEFAULT_ORIGIN = "https://web.whatsapp.com"
exports.DEF_CALLBACK_PREFIX = "CB:"
exports.DEF_TAG_PREFIX = "TAG:"
exports.PHONE_CONNECTION_CB = "CB:Pong"
exports.WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60
exports.NOISE_MODE = "Noise_XX_25519_AESGCM_SHA256\0\0\0\0"
exports.DICT_VERSION = 4
exports.KEY_BUNDLE_TYPE = Buffer.from([5, 110])
exports.NOISE_WA_HEADER = Buffer.from([87, 65, 6, exports.DICT_VERSION])

exports.URL_REGEX = /https:\/\/(?![^:@\/\s]+:[^:@\/\s]+@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s]*)?/gi

exports.WA_CERT_DETAILS = {
  SERIAL: 0
}

exports.PROCESSABLE_HISTORY_TYPES = [
  proto.Message.HistorySyncNotification.HistorySyncType.INITIAL_BOOTSTRAP,
  proto.Message.HistorySyncNotification.HistorySyncType.PUSH_NAME,
  proto.Message.HistorySyncNotification.HistorySyncType.RECENT,
  proto.Message.HistorySyncNotification.HistorySyncType.FULL,
  proto.Message.HistorySyncNotification.HistorySyncType.ON_DEMAND
]

exports.DEFAULT_CONNECTION_CONFIG = {
  version,
  browser: Browsers.ubuntu("Chrome"),
  waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
  connectTimeoutMs: 20000,
  keepAliveIntervalMs: 15000,
  logger: logger.child({ class: "baileys" }),
  printQRInTerminal: false,
  emitOwnEvents: true,
  defaultQueryTimeoutMs: 60000,
  customUploadHosts: [],
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 5,
  fireInitQueries: true,
  auth: undefined,
  markOnlineOnConnect: true,
  syncFullHistory: false,
  patchMessageBeforeSending: msg => msg,
  shouldSyncHistoryMessage: () => true,
  shouldIgnoreJid: () => false,
  linkPreviewImageThumbnailWidth: 192,
  transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
  generateHighQualityLinkPreview: true,
  options: {},
  appStateMacVerification: {
    patch: true,
    snapshot: true
  },
  countryCode: "US",
  getMessage: async () => undefined,
  cachedGroupMetadata: async () => undefined,
  makeSignalRepository: makeLibSignalRepository
}

exports.MEDIA_PATH_MAP = {
  image: "/mms/image",
  video: "/mms/video",
  document: "/mms/document",
  audio: "/mms/audio",
  sticker: "/mms/sticker",
  gif: "/mms/gif",
  "thumbnail-link": "/mms/image",
  "product-catalog-image": "/product/image",
  "md-app-state": "",
  "md-msg-hist": "/mms/md-app-state"
}

exports.MEDIA_HKDF_KEY_MAPPING = {
  audio: "Audio",
  document: "Document",
  gif: "Gif",
  image: "Image",
  ppic: "ProfilePic",
  product: "Product",
  ptt: "PushToTalk",
  sticker: "Sticker",
  video: "Video",
  "thumbnail-document": "Thumbnail-Document",
  "thumbnail-image": "Thumbnail-Image",
  "thumbnail-video": "Thumbnail-Video",
  "thumbnail-link": "Thumbnail-Link",
  "md-msg-hist": "Msg-History",
  "md-app-state": "App-State",
  "product-catalog-image": "Product-Catalog-Image",
  "payment-bg-image": "Payment-Bg-Image",
  ptv: "Peer-To-View"
}

exports.MEDIA_KEYS = Object.keys(exports.MEDIA_PATH_MAP)
exports.MIN_PREKEY_COUNT = 5
exports.INITIAL_PREKEY_COUNT = 30

exports.DEFAULT_CACHE_TTLS = {
  SIGNAL_STORE: 30 * 60 * 1000,
  MSG_RETRY: 60 * 1000,
  CALL_OFFER: 120 * 1000,
  USER_DEVICES: 10 * 60 * 1000
}