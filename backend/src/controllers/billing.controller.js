import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las transacciones
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    const { patientId, type, status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          appointment: {
            select: {
              id: true,
              date: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener transacción por ID
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        patient: true,
        appointment: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nueva transacción
 */
export const createTransaction = async (req, res, next) => {
  try {
    const {
      patientId,
      amount,
      type,
      description,
      appointmentId,
      status
    } = req.body;

    if (!patientId || !amount || !type) {
      return res.status(400).json({
        message: 'patientId, amount y type son requeridos'
      });
    }

    // Si es una facturación de turno, calcular el monto según cobertura/honorario
    let finalAmount = amount;
    if (type === 'INVOICE' && appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            include: {
              coverage: {
                include: {
                  fees: true
                }
              },
              customFee: true
            }
          }
        }
      });

      if (appointment) {
        // Prioridad: honorario personalizado > honorario de cobertura > honorario global
        if (appointment.patient.customFee) {
          finalAmount = appointment.patient.customFee.amount;
        } else if (appointment.patient.coverage?.fees?.[0]) {
          finalAmount = appointment.patient.coverage.fees[0].amount;
        } else {
          const globalFee = await prisma.fee.findFirst({
            where: { isGlobal: true }
          });
          if (globalFee) {
            finalAmount = globalFee.amount;
          }
        }
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        patientId,
        amount: finalAmount,
        type,
        description,
        appointmentId,
        status: status || 'PENDING'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        appointment: {
          select: {
            id: true,
            date: true
          }
        }
      }
    });

    // Si la transacción es una facturación, vincularla al turno
    if (type === 'INVOICE' && appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { transactionId: transaction.id }
      });
    }

    res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar transacción
 */
export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, type, status, description } = req.body;

    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      message: 'Transacción actualizada exitosamente',
      transaction
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    next(error);
  }
};

/**
 * Eliminar transacción
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.transaction.delete({
      where: { id }
    });

    res.json({ message: 'Transacción eliminada exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    next(error);
  }
};

/**
 * Obtener balance de cuenta corriente de un paciente
 */
export const getPatientBalance = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: {
        patientId,
        status: 'COMPLETED'
      },
      orderBy: { date: 'asc' }
    });

    let balance = 0;
    const balanceHistory = transactions.map(t => {
      if (t.type === 'PAYMENT') {
        balance -= t.amount; // Los pagos reducen la deuda
      } else if (t.type === 'INVOICE') {
        balance += t.amount; // Las facturas aumentan la deuda
      } else if (t.type === 'ADJUSTMENT') {
        balance += t.amount; // Los ajustes pueden ser positivos o negativos
      }

      return {
        transaction: t,
        balanceAfter: balance
      };
    });

    res.json({
      patientId,
      currentBalance: balance,
      balanceHistory
    });
  } catch (error) {
    next(error);
  }
};

