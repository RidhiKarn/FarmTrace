import prisma from '../../../lib/prisma'
import { getUser, generateOTP, canOwnBatch, getNextRoles } from '../../../lib/auth'

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

    let transfers

    if (type === 'incoming') {
      // Transfers where this user is the recipient
      transfers = await prisma.transfer.findMany({
        where: {
          toOwnerId: user.id,
          accepted: false
        },
        include: {
          batch: true,
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
        orderBy: { createdAt: 'desc' }
      })
    } else if (type === 'transporter') {
      // Transfers where this user is the transporter
      if (user.role !== 'TRANSPORTER') {
        return res.status(403).json({ error: 'Access denied' })
      }
      transfers = await prisma.transfer.findMany({
        where: { transporterId: user.id },
        include: {
          batch: true,
          fromOwner: {
            select: { farmtraceId: true, name: true, role: true }
          },
          toOwner: {
            select: { farmtraceId: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // All transfers for a batch (regulator)
      if (user.role !== 'REGULATOR') {
        return res.status(403).json({ error: 'Access denied' })
      }
      transfers = await prisma.transfer.findMany({
        include: {
          batch: true,
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
        orderBy: { createdAt: 'desc' }
      })
    }

    res.status(200).json({ transfers })
  } catch (error) {
    console.error('Get transfers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePost(req, res) {
  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { batchId, nextOwnerEmail, transporterEmail, pickupLocation, dropoffLocation } = req.body

    if (!batchId || !nextOwnerEmail || !pickupLocation || !dropoffLocation) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get the batch
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    // Only current owner can create transfer
    if (batch.currentOwnerId !== user.id) {
      return res.status(403).json({ error: 'Only the current owner can transfer this batch' })
    }

    // Check if batch is already in transit
    if (batch.status === 'IN_TRANSIT') {
      return res.status(400).json({ error: 'Batch is already in transit' })
    }

    // Find next owner
    const nextOwner = await prisma.user.findUnique({
      where: { email: nextOwnerEmail.toLowerCase() }
    })

    if (!nextOwner) {
      return res.status(404).json({ error: 'Next owner not found with that email' })
    }

    // Validate next owner role
    if (!canOwnBatch(nextOwner.role)) {
      return res.status(400).json({ error: 'The specified user cannot own batches (Transporters and Regulators cannot own produce)' })
    }

    // Validate role progression
    const allowedNextRoles = getNextRoles(user.role)
    if (!allowedNextRoles.includes(nextOwner.role)) {
      return res.status(400).json({
        error: `Invalid transfer. ${user.role} can only transfer to: ${allowedNextRoles.join(', ')}`
      })
    }

    // Find transporter if specified
    let transporter = null
    if (transporterEmail) {
      transporter = await prisma.user.findUnique({
        where: { email: transporterEmail.toLowerCase() }
      })

      if (!transporter) {
        return res.status(404).json({ error: 'Transporter not found with that email' })
      }

      if (transporter.role !== 'TRANSPORTER') {
        return res.status(400).json({ error: 'The specified transporter user does not have TRANSPORTER role' })
      }
    }

    // Pickup OTP: sender gives this to the transporter (or the recipient
    // directly, when there's no transporter) to authorize taking the batch.
    const otp = generateOTP()

    // Dropoff OTP: a separate code, generated only when a transporter is
    // assigned, that belongs to the RECIPIENT — they hand it to the
    // transporter to confirm delivery, the way an Amazon delivery OTP works.
    const dropoffOtp = transporter ? generateOTP() : null

    // Create transfer
    const transfer = await prisma.transfer.create({
      data: {
        batchId: batch.id,
        fromOwnerId: user.id,
        toOwnerId: nextOwner.id,
        transporterId: transporter?.id || null,
        otp,
        dropoffOtp,
        pickupLocation,
        dropoffLocation
      },
      include: {
        batch: true,
        fromOwner: {
          select: { farmtraceId: true, name: true, role: true }
        },
        toOwner: {
          select: { farmtraceId: true, name: true, role: true }
        },
        transporter: {
          select: { farmtraceId: true, name: true, role: true }
        }
      }
    })

    // Update batch status to IN_TRANSIT
    await prisma.batch.update({
      where: { id: batch.id },
      data: { status: 'IN_TRANSIT' }
    })

    res.status(201).json({
      success: true,
      transfer,
      otp // In production, this would be sent securely to the recipient
    })
  } catch (error) {
    console.error('Create transfer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
