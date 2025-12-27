import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, addDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Obtener estadísticas del dashboard
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfWeek = startOfDay(addDays(today, -7));

    // Contar pacientes
    const totalPatients = await prisma.patient.count();

    // Contar turnos de hoy
    const appointmentsToday = await prisma.appointment.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    // Turnos confirmados de hoy
    const confirmedToday = await prisma.appointment.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: 'CONFIRMED'
      }
    });

    // Turnos completados de hoy
    const completedToday = await prisma.appointment.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: 'COMPLETED'
      }
    });

    // Ingresos de la semana
    const weekTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startOfWeek
        },
        type: 'PAYMENT',
        status: 'COMPLETED'
      }
    });

    const weekIncome = weekTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Transacciones pendientes
    const pendingTransactions = await prisma.transaction.count({
      where: {
        status: 'PENDING'
      }
    });

    // Saldo pendiente (facturas - pagos)
    const allPendingInvoices = await prisma.transaction.findMany({
      where: {
        type: 'INVOICE',
        status: 'COMPLETED'
      }
    });

    const allPayments = await prisma.transaction.findMany({
      where: {
        type: 'PAYMENT',
        status: 'COMPLETED'
      }
    });

    const totalInvoiced = allPendingInvoices.reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = allPayments.reduce((sum, t) => sum + t.amount, 0);
    const pendingBalance = totalInvoiced - totalPaid;

    res.json({
      stats: {
        totalPatients,
        appointmentsToday,
        confirmedToday,
        completedToday,
        weekIncome,
        pendingTransactions,
        pendingBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener próximos turnos
 */
export const getUpcomingAppointments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const today = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: today
        },
        status: {
          in: ['RESERVED', 'CONFIRMED']
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            coverage: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: limit
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener transacciones pendientes
 */
export const getPendingTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    });

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

