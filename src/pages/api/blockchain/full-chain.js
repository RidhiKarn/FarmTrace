import { getUser } from '../../../lib/auth'
import { getFullBlockchain, verifyBlockchain } from '../../../../blockchain'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)

    // Only regulators can view full blockchain
    if (!user || user.role !== 'REGULATOR') {
      return res.status(403).json({ error: 'Only regulators can view full blockchain' })
    }

    const chain = await getFullBlockchain()
    const verification = await verifyBlockchain()

    res.status(200).json({
      chain,
      verification,
      totalBlocks: chain.length,
      message: 'Full blockchain retrieved for audit'
    })
  } catch (error) {
    console.error('Full blockchain error:', error)
    res.status(500).json({ error: 'Failed to get full blockchain' })
  }
}
