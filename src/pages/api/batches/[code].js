import prisma from '../../../lib/prisma'
import { getUser } from '../../../lib/auth'

export default async function handler(req, res) {
  const { code } = req.query

  if (req.method === 'GET') {
    return handleGet(req, res, code)
  } else if (req.method === 'PUT') {
    return handlePut(req, res, code)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(req, res, code) {
  try {
    // Public access - no auth required
    const batch = await prisma.batch.findUnique({
      where: { batchCode: code },
      include: {
        currentOwner: {
          select: { farmtraceId: true, name: true, role: true, village: true, state: true }
        },
        createdBy: {
          select: { farmtraceId: true, name: true, role: true, village: true, state: true }
        },
        transfers: {
          include: {
            fromOwner: {
              select: { farmtraceId: true, name: true, role: true }
            },
            toOwner: {
              select: { farmtraceId: true, name: true, role: true }
            },
            transporter: {
              select: { farmtraceId: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    res.status(200).json({ batch })
  } catch (error) {
    console.error('Get batch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePut(req, res, code) {
  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const batch = await prisma.batch.findUnique({
      where: { batchCode: code }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    // Only current owner or retailer can update
    if (batch.currentOwnerId !== user.id) {
      return res.status(403).json({ error: 'Only the current owner can update this batch' })
    }

    const { retailPricePerKg } = req.body

    // Only retailer can set retail price
    if (retailPricePerKg !== undefined && user.role !== 'RETAILER') {
      return res.status(403).json({ error: 'Only retailers can set retail price' })
    }

    const updatedBatch = await prisma.batch.update({
      where: { batchCode: code },
      data: {
        retailPricePerKg: retailPricePerKg ? parseFloat(retailPricePerKg) : undefined
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

    res.status(200).json({ success: true, batch: updatedBatch })
  } catch (error) {
    console.error('Update batch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
