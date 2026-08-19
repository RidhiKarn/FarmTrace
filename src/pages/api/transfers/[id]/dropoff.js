import prisma from '../../../../lib/prisma'
import { getUser, getStatusForRole } from '../../../../lib/auth'
import { recordTransferAccepted } from '../../../../../blockchain'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only transporters can confirm dropoff
    if (user.role !== 'TRANSPORTER') {
      return res.status(403).json({ error: 'Only transporters can confirm dropoff' })
    }

    const { id } = req.query
    const { otp } = req.body

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' })
    }

    // Get the transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { toOwner: true }
    })

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' })
    }

    // Only assigned transporter can confirm dropoff
    if (transfer.transporterId !== user.id) {
      return res.status(403).json({ error: 'You are not assigned to this transfer' })
    }

    // Check if already dropped off
    if (transfer.dropoffTime) {
      return res.status(400).json({ error: 'Dropoff already confirmed' })
    }

    // The recipient's own dropoff OTP (separate from the sender's pickup OTP)
    // — they hand it to the transporter to confirm delivery, before taking the produce
    if (!transfer.dropoffOtp || transfer.dropoffOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    const newStatus = getStatusForRole(transfer.toOwner.role)

    // Confirming dropoff with the recipient's OTP IS the delivery confirmation —
    // no separate manual "Accept" step needed, the same way an Amazon delivery
    // OTP both confirms the handoff and completes the order.
    await prisma.$transaction([
      prisma.transfer.update({
        where: { id },
        data: { dropoffTime: new Date(), accepted: true }
      }),
      prisma.batch.update({
        where: { id: transfer.batchId },
        data: {
          currentOwnerId: transfer.toOwnerId,
          status: newStatus
        }
      })
    ])

    const updatedTransfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            currentOwner: {
              select: { farmtraceId: true, name: true, role: true }
            }
          }
        },
        fromOwner: {
          select: { farmtraceId: true, name: true, role: true }
        },
        toOwner: {
          select: { farmtraceId: true, name: true, role: true }
        }
      }
    })

    // Record on blockchain
    try {
      const blockchainTx = await recordTransferAccepted(updatedTransfer, updatedTransfer.batch, updatedTransfer.toOwner)
      console.log('Transfer recorded on blockchain:', blockchainTx.blockHash)
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError)
      // Continue even if blockchain fails - data is in DB
    }

    res.status(200).json({ success: true, transfer: updatedTransfer })
  } catch (error) {
    console.error('Dropoff error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
