/**
 * FarmTrace Blockchain Implementation
 *
 * A custom hash-chain for storing agricultural supply chain data.
 * Each transaction (batch creation, transfer, price update) is mined into
 * its own block and persisted in Postgres via Prisma, so the chain survives
 * server restarts and deploys (unlike a file on Vercel's ephemeral disk).
 *
 * Security Features:
 * - SHA-256 cryptographic hashing
 * - Chain integrity verification
 * - Immutable records (tampering breaks the chain)
 * - Timestamped transactions
 */

const crypto = require('crypto')
const { prisma } = require('../src/lib/prisma')

const DIFFICULTY = 2 // Number of leading zeros required in hash

// Postgres stores transaction payloads as jsonb, which does not preserve
// object key order. Sorting keys before hashing makes the hash stable
// whether the data came from memory (at mine time) or from the database
// (at verify time).
function canonicalStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function calculateHash(index, previousHash, timestamp, transactions, nonce) {
  return crypto
    .createHash('sha256')
    .update(index + previousHash + timestamp + canonicalStringify(transactions) + nonce)
    .digest('hex')
}

// Proof of Work - mining the block
function mineBlock(index, previousHash, timestamp, transactions) {
  const target = Array(DIFFICULTY + 1).join('0')
  let nonce = 0
  let hash = calculateHash(index, previousHash, timestamp, transactions, nonce)
  while (hash.substring(0, DIFFICULTY) !== target) {
    nonce++
    hash = calculateHash(index, previousHash, timestamp, transactions, nonce)
  }
  return { hash, nonce }
}

// Get the latest block, creating the genesis block if the chain is empty
async function getLatestBlock(tx) {
  const latest = await tx.block.findFirst({ orderBy: { index: 'desc' } })
  if (latest) return latest

  const timestamp = new Date().toISOString()
  const genesisPayload = [{
    type: 'GENESIS',
    message: 'FarmTrace Jaipur Blockchain Genesis Block',
    createdAt: timestamp
  }]
  const { hash, nonce } = mineBlock(0, '0', timestamp, genesisPayload)

  return tx.block.create({
    data: {
      index: 0,
      timestamp: new Date(timestamp),
      previousHash: '0',
      hash,
      nonce,
      transactions: {
        create: [{
          txId: crypto.randomBytes(16).toString('hex'),
          type: 'GENESIS',
          timestamp: new Date(timestamp),
          data: genesisPayload[0]
        }]
      }
    }
  })
}

// Record a single transaction, mined into its own new block
async function recordTransaction(transactionData) {
  return prisma.$transaction(async (tx) => {
    const latest = await getLatestBlock(tx)

    const txId = crypto.randomBytes(16).toString('hex')
    const timestamp = new Date().toISOString()
    const fullTx = { ...transactionData, txId, timestamp }

    const { hash, nonce } = mineBlock(latest.index + 1, latest.hash, timestamp, [fullTx])

    const block = await tx.block.create({
      data: {
        index: latest.index + 1,
        timestamp: new Date(timestamp),
        previousHash: latest.hash,
        hash,
        nonce,
        transactions: {
          create: [{
            txId,
            type: transactionData.type,
            batchCode: transactionData.batchCode || null,
            timestamp: new Date(timestamp),
            data: fullTx
          }]
        }
      }
    })

    return { ...fullTx, blockIndex: block.index, blockHash: block.hash }
  })
}

async function getFullChain() {
  const blocks = await prisma.block.findMany({
    orderBy: { index: 'asc' },
    include: { transactions: true }
  })
  return blocks.map((b) => ({
    index: b.index,
    timestamp: b.timestamp.toISOString(),
    previousHash: b.previousHash,
    hash: b.hash,
    nonce: b.nonce,
    transactions: b.transactions.map((t) => t.data)
  }))
}

// Verify the integrity of the blockchain
async function isChainValid() {
  const chain = await getFullChain()
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i]
    const previous = chain[i - 1]

    const recalculatedHash = calculateHash(
      current.index,
      current.previousHash,
      current.timestamp,
      current.transactions,
      current.nonce
    )

    if (current.hash !== recalculatedHash) return false
    if (current.previousHash !== previous.hash) return false
  }
  return true
}

async function getStats() {
  const [totalBlocks, totalTransactions, latest, valid] = await Promise.all([
    prisma.block.count(),
    prisma.ledgerTransaction.count(),
    prisma.block.findFirst({ orderBy: { index: 'desc' } }),
    isChainValid()
  ])

  return {
    totalBlocks,
    totalTransactions,
    isValid: valid,
    lastBlockHash: latest ? latest.hash : null,
    pendingTransactions: 0
  }
}

// Get all transactions of a specific type
async function getTransactionsByType(type) {
  const rows = await prisma.ledgerTransaction.findMany({
    where: { type },
    include: { block: true },
    orderBy: { block: { index: 'asc' } }
  })
  return rows.map((t) => ({ ...t.data, blockIndex: t.block.index, blockHash: t.block.hash }))
}

// Get all transactions for a specific batch
async function getTransactionsForBatch(batchCode) {
  const rows = await prisma.ledgerTransaction.findMany({
    where: { batchCode },
    include: { block: true },
    orderBy: { block: { index: 'asc' } }
  })
  return rows.map((t) => ({
    ...t.data,
    blockIndex: t.block.index,
    blockHash: t.block.hash,
    blockTimestamp: t.block.timestamp.toISOString()
  }))
}

// Transaction types
const TX_TYPES = {
  USER_REGISTERED: 'USER_REGISTERED',
  BATCH_CREATED: 'BATCH_CREATED',
  TRANSFER_INITIATED: 'TRANSFER_INITIATED',
  TRANSFER_ACCEPTED: 'TRANSFER_ACCEPTED',
  PICKUP_CONFIRMED: 'PICKUP_CONFIRMED',
  DROPOFF_CONFIRMED: 'DROPOFF_CONFIRMED',
  AUCTION_PRICE_SET: 'AUCTION_PRICE_SET',
  RETAIL_PRICE_SET: 'RETAIL_PRICE_SET'
}

module.exports = {
  recordTransaction,
  getFullChain,
  isChainValid,
  getStats,
  getTransactionsByType,
  getTransactionsForBatch,
  TX_TYPES
}
