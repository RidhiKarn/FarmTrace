import { getBatchBlockchainHistory } from '../../../../../blockchain'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.query
    const history = await getBatchBlockchainHistory(code)

    res.status(200).json({
      batchCode: code,
      blockchainRecords: history,
      totalRecords: history.length,
      message: history.length > 0
        ? 'Blockchain history retrieved successfully'
        : 'No blockchain records found for this batch'
    })
  } catch (error) {
    console.error('Blockchain history error:', error)
    res.status(500).json({ error: 'Failed to get blockchain history' })
  }
}
