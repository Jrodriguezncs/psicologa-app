import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todos los honorarios
 */
export const getAllFees = async (req, res, next) => {
  try {
    const { coverageId, isGlobal } = req.query;
    const where = {};
    
    if (coverageId) where.coverageId = coverageId;
    if (isGlobal !== undefined) where.isGlobal = isGlobal === 'true';

    const fees = await prisma.fee.findMany({
      where,
      include: {
        coverage: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ fees });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener honorario global
 */
export const getGlobalFee = async (req, res, next) => {
  try {
    const fee = await prisma.fee.findFirst({
      where: { isGlobal: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!fee) {
      return res.json({ fee: null });
    }

    res.json({ fee });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener honorario por ID
 */
export const getFeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        coverage: true
      }
    });

    if (!fee) {
      return res.status(404).json({ message: 'Honorario no encontrado' });
    }

    res.json({ fee });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo honorario
 */
export const createFee = async (req, res, next) => {
  try {
    const { amount, description, coverageId, isGlobal } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: 'El monto es requerido'
      });
    }

    // Si es global, verificar que no exista otro global
    if (isGlobal) {
      const existingGlobal = await prisma.fee.findFirst({
        where: { isGlobal: true }
      });
      
      if (existingGlobal) {
        return res.status(400).json({
          message: 'Ya existe un honorario global. Actualízalo en lugar de crear uno nuevo.'
        });
      }
    }

    const fee = await prisma.fee.create({
      data: {
        amount: parseFloat(amount),
        description,
        coverageId,
        isGlobal: isGlobal || false
      },
      include: {
        coverage: true
      }
    });

    res.status(201).json({
      message: 'Honorario creado exitosamente',
      fee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar honorario
 */
export const updateFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, description, coverageId, isGlobal } = req.body;

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (coverageId !== undefined) updateData.coverageId = coverageId;
    if (isGlobal !== undefined) updateData.isGlobal = isGlobal;

    const fee = await prisma.fee.update({
      where: { id },
      data: updateData,
      include: {
        coverage: true
      }
    });

    res.json({
      message: 'Honorario actualizado exitosamente',
      fee
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Honorario no encontrado' });
    }
    next(error);
  }
};

/**
 * Eliminar honorario
 */
export const deleteFee = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.fee.delete({
      where: { id }
    });

    res.json({ message: 'Honorario eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Honorario no encontrado' });
    }
    next(error);
  }
};

