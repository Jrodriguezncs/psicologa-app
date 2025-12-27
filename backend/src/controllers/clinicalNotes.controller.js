import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las notas clínicas
 */
export const getAllClinicalNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.clinicalNote.findMany({
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
      prisma.clinicalNote.count()
    ]);

    res.json({
      notes,
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
 * Obtener notas clínicas de un paciente
 */
export const getPatientClinicalNotes = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId },
      include: {
        appointment: {
          select: {
            id: true,
            date: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ notes });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener nota clínica por ID
 */
export const getClinicalNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const note = await prisma.clinicalNote.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        appointment: true
      }
    });

    if (!note) {
      return res.status(404).json({ message: 'Nota clínica no encontrada' });
    }

    res.json({ note });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nueva nota clínica
 */
export const createClinicalNote = async (req, res, next) => {
  try {
    const { patientId, content, date, appointmentId } = req.body;

    if (!patientId || !content) {
      return res.status(400).json({
        message: 'patientId y content son requeridos'
      });
    }

    const note = await prisma.clinicalNote.create({
      data: {
        patientId,
        content,
        date: date ? new Date(date) : new Date(),
        appointmentId
      },
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

    res.status(201).json({
      message: 'Nota clínica creada exitosamente',
      note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar nota clínica
 */
export const updateClinicalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, date } = req.body;

    const updateData = {};
    if (content) updateData.content = content;
    if (date) updateData.date = new Date(date);

    const note = await prisma.clinicalNote.update({
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
      message: 'Nota clínica actualizada exitosamente',
      note
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Nota clínica no encontrada' });
    }
    next(error);
  }
};

/**
 * Eliminar nota clínica
 */
export const deleteClinicalNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.clinicalNote.delete({
      where: { id }
    });

    res.json({ message: 'Nota clínica eliminada exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Nota clínica no encontrada' });
    }
    next(error);
  }
};

