/**
 * Blockchain API for FarmTrace
 *
 * Easy-to-use functions for recording supply chain events on the ledger.
 * All functions are async because records are persisted to Postgres.
 */

const {
  recordTransaction,
  getFullChain,
  isChainValid,
  getStats,
  getTransactionsForBatch,
  TX_TYPES
} = require('./blockchain')

// Record a new user registration
async function recordUserRegistration(user) {
  return recordTransaction({
    type: TX_TYPES.USER_REGISTERED,
    userId: user.id,
    farmtraceId: user.farmtraceId,
    name: user.name,
    role: user.role,
    village: user.village,
    state: user.state
  })
}

// Record a new batch creation
async function recordBatchCreation(batch, farmer) {
  return recordTransaction({
    type: TX_TYPES.BATCH_CREATED,
    batchId: batch.id,
    batchCode: batch.batchCode,
    crop: batch.crop,
    quantityKg: batch.quantityKg,
    basePricePerKg: batch.basePricePerKg,
    originVillage: batch.originVillage,
    originState: batch.originState,
    farmerId: farmer.id,
    farmerFarmtraceId: farmer.farmtraceId,
    farmerName: farmer.name
  })
}

// Record a transfer initiation
async function recordTransferInitiated(transfer, batch, fromOwner, toOwner, transporter) {
  return recordTransaction({
    type: TX_TYPES.TRANSFER_INITIATED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    batchId: batch.id,
    fromOwnerId: fromOwner.farmtraceId,
    fromOwnerName: fromOwner.name,
    fromOwnerRole: fromOwner.role,
    toOwnerId: toOwner.farmtraceId,
    toOwnerName: toOwner.name,
    toOwnerRole: toOwner.role,
    transporterId: transporter?.farmtraceId || null,
    transporterName: transporter?.name || null,
    pickupLocation: transfer.pickupLocation,
    dropoffLocation: transfer.dropoffLocation,
    otpHash: require('crypto').createHash('sha256').update(transfer.otp).digest('hex') // Store hash, not actual OTP
  })
}

// Record transfer acceptance
async function recordTransferAccepted(transfer, batch, newOwner) {
  return recordTransaction({
    type: TX_TYPES.TRANSFER_ACCEPTED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    newOwnerId: newOwner.farmtraceId,
    newOwnerName: newOwner.name,
    newOwnerRole: newOwner.role,
    newStatus: batch.status
  })
}

// Record pickup confirmation
async function recordPickupConfirmed(transfer, batch, transporter) {
  return recordTransaction({
    type: TX_TYPES.PICKUP_CONFIRMED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    transporterId: transporter.farmtraceId,
    transporterName: transporter.name,
    pickupLocation: transfer.pickupLocation,
    pickupTime: transfer.pickupTime
  })
}

// Record dropoff confirmation
async function recordDropoffConfirmed(transfer, batch, transporter) {
  return recordTransaction({
    type: TX_TYPES.DROPOFF_CONFIRMED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    transporterId: transporter.farmtraceId,
    transporterName: transporter.name,
    dropoffLocation: transfer.dropoffLocation,
    dropoffTime: transfer.dropoffTime
  })
}

// Record auction price set by APMC agent
async function recordAuctionPriceSet(batch, apmcAgent, auctionPrice) {
  return recordTransaction({
    type: TX_TYPES.AUCTION_PRICE_SET,
    batchCode: batch.batchCode,
    batchId: batch.id,
    crop: batch.crop,
    basePricePerKg: batch.basePricePerKg,
    auctionPricePerKg: auctionPrice,
    priceDifference: auctionPrice - batch.basePricePerKg,
    percentageChange: (((auctionPrice - batch.basePricePerKg) / batch.basePricePerKg) * 100).toFixed(2),
    apmcAgentId: apmcAgent.farmtraceId,
    apmcAgentName: apmcAgent.name
  })
}

// Record retail price set
async function recordRetailPriceSet(batch, retailer, retailPrice) {
  return recordTransaction({
    type: TX_TYPES.RETAIL_PRICE_SET,
    batchCode: batch.batchCode,
    batchId: batch.id,
    basePricePerKg: batch.basePricePerKg,
    auctionPricePerKg: batch.auctionPricePerKg,
    retailPricePerKg: retailPrice,
    retailerId: retailer.farmtraceId,
    retailerName: retailer.name
  })
}

// Get all blockchain transactions for a batch
async function getBatchBlockchainHistory(batchCode) {
  return getTransactionsForBatch(batchCode)
}

// Get blockchain stats
async function getBlockchainStats() {
  return getStats()
}

// Verify blockchain integrity
async function verifyBlockchain() {
  const [valid, stats] = await Promise.all([isChainValid(), getStats()])
  return { isValid: valid, stats }
}

// Get full blockchain for audit
async function getFullBlockchain() {
  return getFullChain()
}

module.exports = {
  recordUserRegistration,
  recordBatchCreation,
  recordTransferInitiated,
  recordTransferAccepted,
  recordPickupConfirmed,
  recordDropoffConfirmed,
  recordAuctionPriceSet,
  recordRetailPriceSet,
  getBatchBlockchainHistory,
  getBlockchainStats,
  verifyBlockchain,
  getFullBlockchain,
  TX_TYPES
}
