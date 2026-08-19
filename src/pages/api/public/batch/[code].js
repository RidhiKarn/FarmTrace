import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.query

    const batch = await prisma.batch.findUnique({
      where: { batchCode: code },
      include: {
        createdBy: {
          select: {
            farmtraceId: true,
            name: true,
            role: true,
            village: true,
            state: true
          }
        },
        currentOwner: {
          select: {
            farmtraceId: true,
            name: true,
            role: true
          }
        },
        transfers: {
          include: {
            fromOwner: {
              select: {
                farmtraceId: true,
                name: true,
                role: true
              }
            },
            toOwner: {
              select: {
                farmtraceId: true,
                name: true,
                role: true
              }
            },
            transporter: {
              select: {
                farmtraceId: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    res.status(200).json({
      batch,
      message: 'Batch details retrieved successfully'
    })
  } catch (error) {
    console.error('Public batch fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch batch details' })
  }
}
