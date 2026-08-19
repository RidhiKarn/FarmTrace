import prisma from '../../../../lib/prisma'
import { getUser } from '../../../../lib/auth'
import { recordRetailPriceSet } from '../../../../../blockchain'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only retailers can set retail price
    if (user.role !== 'RETAILER') {
      return res.status(403).json({ error: 'Only retailers can set retail price' })
    }

    const { code } = req.query
    const { retailPricePerKg } = req.body

    if (!retailPricePerKg || retailPricePerKg <= 0) {
      return res.status(400).json({ error: 'Valid retail price is required' })
    }

    // Get the batch
    const batch = await prisma.batch.findUnique({
      where: { batchCode: code }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    // Only current owner can set retail price
    if (batch.currentOwnerId !== user.id) {
      return res.status(403).json({ error: 'Only the current owner can set retail price' })
    }

    // Update the batch with retail price
    const updatedBatch = await prisma.batch.update({
      where: { batchCode: code },
      data: {
        retailPricePerKg: parseFloat(retailPricePerKg)
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
      const blockchainTx = await recordRetailPriceSet(updatedBatch, user, parseFloat(retailPricePerKg))
      console.log('Blockchain TX:', blockchainTx)
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError)
    }

    res.status(200).json({
      success: true,
      batch: updatedBatch,
      message: `Retail price set to Rs ${retailPricePerKg}/Kg`
    })
  } catch (error) {
    console.error('Set retail price error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
