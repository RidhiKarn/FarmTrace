import { getBlockchainStats, verifyBlockchain, getFullBlockchain } from '../../../../blockchain'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = await getBlockchainStats()
    const verification = await verifyBlockchain()

    res.status(200).json({
      blockchain: {
        ...stats,
        isIntact: verification.isValid,
        message: verification.isValid
          ? 'Blockchain integrity verified - no tampering detected'
          : 'WARNING: Blockchain integrity compromised!'
      }
    })
  } catch (error) {
    console.error('Blockchain stats error:', error)
    res.status(500).json({ error: 'Failed to get blockchain stats' })
  }
}
