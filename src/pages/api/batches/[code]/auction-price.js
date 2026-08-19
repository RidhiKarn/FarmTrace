import prisma from '../../../../lib/prisma'
import { getUser } from '../../../../lib/auth'
import { recordAuctionPriceSet } from '../../../../../blockchain'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only APMC agents can set auction price
    if (user.role !== 'APMC_AGENT') {
      return res.status(403).json({ error: 'Only APMC agents can set auction price' })
    }

    const { code } = req.query
    const { auctionPricePerKg } = req.body

    if (!auctionPricePerKg || auctionPricePerKg <= 0) {
      return res.status(400).json({ error: 'Valid auction price is required' })
    }

    // Get the batch
    const batch = await prisma.batch.findUnique({
      where: { batchCode: code }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    // Only current owner can set auction price
    if (batch.currentOwnerId !== user.id) {
      return res.status(403).json({ error: 'Only the current owner can set auction price' })
    }

    // Update the batch with auction price
    const updatedBatch = await prisma.batch.update({
      where: { batchCode: code },
      data: {
        auctionPricePerKg: parseFloat(auctionPricePerKg)
      },
      include: {
        currentOwner: {
          select: { farmtraceId: true, name: true, role: true }
        },
        createdBy: {
          select: { farmtraceId: true, name: true, role: true }
        }
      }
    })

    // Record on blockchain
    try {
      const blockchainTx = await recordAuctionPriceSet(updatedBatch, user, parseFloat(auctionPricePerKg))
      console.log('Blockchain TX:', blockchainTx)
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError)
      // Continue even if blockchain fails - data is in DB
    }

    res.status(200).json({
      success: true,
      batch: updatedBatch,
      message: `Auction price set to Rs ${auctionPricePerKg}/Kg (Farmer's price was Rs ${batch.basePricePerKg}/Kg)`
    })
  } catch (error) {
    console.error('Set auction price error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
