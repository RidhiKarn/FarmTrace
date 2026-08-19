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

    const { id } = req.query
    const { otp } = req.body

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' })
    }

    // Get the transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { batch: true }
    })

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' })
    }

    // Only the recipient can accept
    if (transfer.toOwnerId !== user.id) {
      return res.status(403).json({ error: 'Only the designated recipient can accept this transfer' })
    }

    // Check if already accepted
    if (transfer.accepted) {
      return res.status(400).json({ error: 'Transfer already accepted' })
    }

    // Verify OTP
    if (transfer.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    // Get the new status based on recipient role
    const newStatus = getStatusForRole(user.role)

    // Accept transfer and update batch
    await prisma.$transaction([
      prisma.transfer.update({
        where: { id },
        data: { accepted: true }
      }),
      prisma.batch.update({
        where: { id: transfer.batchId },
        data: {
          currentOwnerId: user.id,
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
      const blockchainTx = await recordTransferAccepted(updatedTransfer.batch, updatedTransfer.fromOwner, updatedTransfer.toOwner)
      console.log('Transfer recorded on blockchain:', blockchainTx.blockHash)
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError)
      // Continue even if blockchain fails - data is in DB
    }

    res.status(200).json({ success: true, transfer: updatedTransfer })
  } catch (error) {
    console.error('Accept transfer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
