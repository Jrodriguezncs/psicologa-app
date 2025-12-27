import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las coberturas
 */
export const getAllCoverages = async (req, res, next) => {
  try {
    const coverages = await prisma.coverage.findMany({
      include: {
        _count: {
          select: { patients: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ coverages });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener cobertura por ID
 */
export const getCoverageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coverage = await prisma.coverage.findUnique({
      where: { id },
      include: {
        patients: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        fees: true
      }
    });

    if (!coverage) {
      return res.status(404).json({ message: 'Cobertura no encontrada' });
    }

    res.json({ coverage });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nueva cobertura
 */
export const createCoverage = async (req, res, next) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message: 'Nombre y tipo son requeridos'
      });
    }

    const coverage = await prisma.coverage.create({
      data: {
        name,
        type,
        description
      }
    });

    res.status(201).json({
      message: 'Cobertura creada exitosamente',
      coverage
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: 'Ya existe una cobertura con ese nombre'
      });
    }
    next(error);
  }
};

/**
 * Actualizar cobertura
 */
export const updateCoverage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;

    const coverage = await prisma.coverage.update({
      where: { id },
      data: {
        name,
        type,
        description
      }
    });

    res.json({
      message: 'Cobertura actualizada exitosamente',
      coverage
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cobertura no encontrada' });
    }
    next(error);
  }
};

/**
 * Eliminar cobertura
 */
export const deleteCoverage = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.coverage.delete({
      where: { id }
    });

    res.json({ message: 'Cobertura eliminada exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cobertura no encontrada' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'No se puede eliminar la cobertura porque tiene pacientes asociados'
      });
    }
    next(error);
  }
};

