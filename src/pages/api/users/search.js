import prisma from '../../../lib/prisma'
import { getUser } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { farmtraceId, batchCode } = req.query

    // Only regulator can search
    if (user.role !== 'REGULATOR') {
      return res.status(403).json({ error: 'Only regulators can search' })
    }

    let result = {}

    if (farmtraceId) {
      const foundUser = await prisma.user.findUnique({
        where: { farmtraceId },
        select: {
          farmtraceId: true,
          name: true,
          role: true,
          village: true,
          state: true,
          createdAt: true
        }
      })

      if (foundUser) {
        // Get batches related to this user
        const createdBatches = await prisma.batch.findMany({
          where: { createdById: foundUser.farmtraceId ? undefined : undefined },
          include: {
            currentOwner: {
              select: { farmtraceId: true, name: true, role: true }
            }
          }
        })

        result.user = foundUser
      }
    }

    if (batchCode) {
      const batch = await prisma.batch.findUnique({
        where: { batchCode },
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

      result.batch = batch
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
