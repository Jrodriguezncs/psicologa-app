import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, addHours, addMinutes, isBefore } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Obtener todos los turnos con filtros
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const { status, patientId, date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (date) {
      const startDate = startOfDay(new Date(date));
      const endDate = endOfDay(new Date(date));
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
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
        skip,
        take: limit
      }),
      prisma.appointment.count({ where })
    ]);

    res.json({
      appointments,
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
 * Obtener turnos por rango de fechas
 */
export const getAppointmentsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'startDate y endDate son requeridos'
      });
    }

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: start,
          lte: end
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
      orderBy: { date: 'asc' }
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener turno por ID
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            coverage: true,
            customFee: true
          }
        },
        transaction: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo turno
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { patientId, date, duration, notes } = req.body;

    if (!patientId || !date) {
      return res.status(400).json({
        message: 'patientId y date son requeridos'
      });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        date: new Date(date),
        duration: duration || 50,
        notes,
        status: 'RESERVED'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Turno creado exitosamente',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar turno
 */
export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, duration, notes, patientId } = req.body;

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (duration) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;
    if (patientId) updateData.patientId = patientId;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Turno actualizado exitosamente',
      appointment
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    next(error);
  }
};

/**
 * Actualizar estado del turno
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'RESERVED',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
      'ABSENT'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`
      });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
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
      message: 'Estado del turno actualizado exitosamente',
      appointment
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    next(error);
  }
};

/**
 * Eliminar turno
 */
export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id }
    });

    res.json({ message: 'Turno eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    next(error);
  }
};

