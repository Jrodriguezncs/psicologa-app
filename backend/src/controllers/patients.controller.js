import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todos los pacientes con paginación
 */
export const getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { dni: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          coverage: true,
          customFee: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);

    res.json({
      patients,
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
 * Obtener paciente por ID
 */
export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        coverage: true,
        customFee: true,
        appointments: {
          orderBy: { date: 'desc' },
          take: 10
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json({ patient });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo paciente
 */
export const createPatient = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      dni,
      email,
      phone,
      address,
      birthDate,
      emergencyContact,
      emergencyPhone,
      notes,
      coverageId,
      customFee
    } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        message: 'Nombre, apellido y teléfono son requeridos'
      });
    }

    // Si se proporciona un customFee, crearlo primero
    let customFeeId = null;
    if (customFee && customFee.amount) {
      const createdFee = await prisma.customFee.create({
        data: {
          amount: customFee.amount,
          description: customFee.description
        }
      });
      customFeeId = createdFee.id;
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        dni,
        email,
        phone,
        address,
        birthDate: birthDate ? new Date(birthDate) : null,
        emergencyContact,
        emergencyPhone,
        notes,
        coverageId,
        customFeeId
      },
      include: {
        coverage: true,
        customFee: true
      }
    });

    res.status(201).json({
      message: 'Paciente creado exitosamente',
      patient
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: 'Ya existe un paciente con ese DNI'
      });
    }
    next(error);
  }
};

/**
 * Actualizar paciente
 */
export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dni,
      email,
      phone,
      address,
      birthDate,
      emergencyContact,
      emergencyPhone,
      notes,
      coverageId,
      customFee
    } = req.body;

    // Si se actualiza el customFee
    const patientData = { ...req.body };
    delete patientData.customFee;

    if (customFee) {
      const existingPatient = await prisma.patient.findUnique({
        where: { id },
        include: { customFee: true }
      });

      if (existingPatient?.customFee) {
        // Actualizar honorario existente
        await prisma.customFee.update({
          where: { id: existingPatient.customFee.id },
          data: {
            amount: customFee.amount,
            description: customFee.description
          }
        });
      } else if (customFee.amount) {
        // Crear nuevo honorario
        const createdFee = await prisma.customFee.create({
          data: {
            amount: customFee.amount,
            description: customFee.description
          }
        });
        patientData.customFeeId = createdFee.id;
      }
    }

    if (birthDate) {
      patientData.birthDate = new Date(birthDate);
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: patientData,
      include: {
        coverage: true,
        customFee: true
      }
    });

    res.json({
      message: 'Paciente actualizado exitosamente',
      patient
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    next(error);
  }
};

/**
 * Eliminar paciente
 */
export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: { id }
    });

    res.json({ message: 'Paciente eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    next(error);
  }
};

/**
 * Obtener turnos de un paciente
 */
export const getPatientAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointments = await prisma.appointment.findMany({
      where: { patientId: id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener transacciones de un paciente
 */
export const getPatientTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: { patientId: id },
      orderBy: { date: 'desc' }
    });

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

