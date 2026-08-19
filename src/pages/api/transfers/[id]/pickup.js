import prisma from '../../../../lib/prisma'
import { getUser } from '../../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only transporters can confirm pickup
    if (user.role !== 'TRANSPORTER') {
      return res.status(403).json({ error: 'Only transporters can confirm pickup' })
    }

    const { id } = req.query
    const { otp } = req.body

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' })
    }

    // Get the transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id }
    })

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' })
    }

    // Only assigned transporter can confirm pickup
    if (transfer.transporterId !== user.id) {
      return res.status(403).json({ error: 'You are not assigned to this transfer' })
    }

    // Check if already picked up
    if (transfer.pickupTime) {
      return res.status(400).json({ error: 'Pickup already confirmed' })
    }

    // The sender must hand this OTP to the transporter at pickup
    if (transfer.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    // Update pickup time
    const updatedTransfer = await prisma.transfer.update({
      where: { id },
      data: { pickupTime: new Date() },
      include: {
        batch: true,
        fromOwner: {
          select: { farmtraceId: true, name: true, role: true }
        },
        toOwner: {
          select: { farmtraceId: true, name: true, role: true }
        }
      }
    })

    res.status(200).json({ success: true, transfer: updatedTransfer })
  } catch (error) {
    console.error('Pickup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
