import prisma from '../../../lib/prisma'
import { getUser, generateBatchCode } from '../../../lib/auth'
import { recordBatchCreation } from '../../../../blockchain'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(req, res) {
  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { type } = req.query

    let batches

    if (type === 'created') {
      // Batches created by this user (for farmers)
      batches = await prisma.batch.findMany({
        where: { createdById: user.id },
        include: {
          currentOwner: {
            select: { farmtraceId: true, name: true, role: true }
          },
          createdBy: {
            select: { farmtraceId: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (type === 'owned') {
      // Batches currently owned by this user
      batches = await prisma.batch.findMany({
        where: { currentOwnerId: user.id },
        include: {
          currentOwner: {
            select: { farmtraceId: true, name: true, role: true }
          },
          createdBy: {
            select: { farmtraceId: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // All batches for regulator
      if (user.role !== 'REGULATOR') {
        return res.status(403).json({ error: 'Access denied' })
      }
      batches = await prisma.batch.findMany({
        include: {
          currentOwner: {
            select: { farmtraceId: true, name: true, role: true }
          },
          createdBy: {
            select: { farmtraceId: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    res.status(200).json({ batches })
  } catch (error) {
    console.error('Get batches error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePost(req, res) {
  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only farmers can create batches
    if (user.role !== 'FARMER') {
      return res.status(403).json({ error: 'Only farmers can create batches' })
    }

    const { crop, quantityKg, basePricePerKg } = req.body

    if (!crop || !quantityKg || !basePricePerKg) {
      return res.status(400).json({ error: 'Crop, quantity, and price are required' })
    }

    // Base the next batch code on the highest one actually in use, not a
    // row count — count() drifts out of sync (and collides) once any batch
    // has ever been deleted.
    const lastBatch = await prisma.batch.findFirst({
      orderBy: { batchCode: 'desc' }
    })
    const lastNum = lastBatch ? parseInt(lastBatch.batchCode.split('-').pop(), 10) || 0 : 0
    const batchCode = generateBatchCode(lastNum)

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        batchCode,
        crop,
        quantityKg: parseFloat(quantityKg),
        basePricePerKg: parseFloat(basePricePerKg),
        originVillage: user.village,
        originState: user.state,
        status: 'CREATED',
        createdById: user.id,
        currentOwnerId: user.id
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
      const blockchainTx = await recordBatchCreation(batch, user)
      console.log('Batch recorded on blockchain:', blockchainTx.blockHash)
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError)
      // Continue even if blockchain fails - data is in DB
    }

    res.status(201).json({ success: true, batch })
  } catch (error) {
    console.error('Create batch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
