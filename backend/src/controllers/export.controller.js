import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Exportar cuentas corrientes a Excel
 */
export const exportAccountStatementExcel = async (req, res, next) => {
  try {
    const { patientId, startDate, endDate, coverageType, paymentStatus } = req.query;

    // Construir filtros
    const where = {};
    if (patientId) where.patientId = patientId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (paymentStatus) where.status = paymentStatus;

    // Obtener transacciones
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        patient: {
          include: {
            coverage: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Filtrar por tipo de cobertura si se especifica
    let filteredTransactions = transactions;
    if (coverageType) {
      filteredTransactions = transactions.filter(t => {
        const coverage = t.patient.coverage;
        return coverage && coverage.type === coverageType;
      });
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cuentas Corrientes');

    // Encabezados
    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Paciente', key: 'patient', width: 30 },
      { header: 'Cobertura', key: 'coverage', width: 20 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Descripción', key: 'description', width: 40 }
    ];

    // Estilo de encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar datos
    let balance = 0;
    filteredTransactions.forEach((tx) => {
      const row = worksheet.addRow({
        date: format(new Date(tx.date), 'dd/MM/yyyy'),
        patient: `${tx.patient.firstName} ${tx.patient.lastName}`,
        coverage: tx.patient.coverage?.name || 'Particular',
        type: getTransactionTypeLabel(tx.type),
        amount: tx.amount,
        status: getStatusLabel(tx.status),
        description: tx.description || '-'
      });

      // Calcular balance
      if (tx.type === 'INVOICE') balance += tx.amount;
      else if (tx.type === 'PAYMENT') balance -= tx.amount;

      // Color según tipo
      if (tx.type === 'PAYMENT') {
        row.getCell('amount').font = { color: { argb: 'FF00AA00' } };
      } else {
        row.getCell('amount').font = { color: { argb: 'FFFF0000' } };
      }
    });

    // Agregar totales
    worksheet.addRow({});
    const totalRow = worksheet.addRow({
      date: 'TOTAL',
      amount: balance
    });
    totalRow.getCell('date').font = { bold: true };
    totalRow.getCell('amount').font = { bold: true };

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cuentas-corrientes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    );
    res.send(buffer);

    logger.info('Account statement exported to Excel', {
      count: filteredTransactions.length,
      filters: { patientId, startDate, endDate, coverageType, paymentStatus }
    });
  } catch (error) {
    logger.error('Error exporting account statement', { error: error.message });
    next(error);
  }
};

/**
 * Exportar cuentas corrientes a PDF
 */
export const exportAccountStatementPDF = async (req, res, next) => {
  try {
    const { patientId, startDate, endDate, coverageType, paymentStatus } = req.query;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (paymentStatus) where.status = paymentStatus;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        patient: {
          include: {
            coverage: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    let filteredTransactions = transactions;
    if (coverageType) {
      filteredTransactions = transactions.filter(t => {
        const coverage = t.patient.coverage;
        return coverage && coverage.type === coverageType;
      });
    }

    // Crear PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cuentas-corrientes-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    );
    
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Cuentas Corrientes', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Tabla
    let y = doc.y;
    let balance = 0;

    // Encabezados de tabla
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Fecha', 50, y);
    doc.text('Paciente', 120, y);
    doc.text('Tipo', 280, y);
    doc.text('Monto', 350, y);
    doc.text('Estado', 420, y);
    doc.moveDown();

    // Línea
    doc.moveTo(50, doc.y - 5).lineTo(550, doc.y - 5).stroke();
    y = doc.y;

    // Filas
    doc.font('Helvetica').fontSize(9);
    filteredTransactions.forEach((tx) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      const date = format(new Date(tx.date), 'dd/MM/yyyy');
      const patient = `${tx.patient.firstName} ${tx.patient.lastName}`.substring(0, 25);
      const type = getTransactionTypeLabel(tx.type);
      const amount = `$${tx.amount.toLocaleString()}`;
      const status = getStatusLabel(tx.status);

      doc.text(date, 50, y);
      doc.text(patient, 120, y, { width: 150, ellipsis: true });
      doc.text(type, 280, y);
      doc.text(amount, 350, y);
      doc.text(status, 420, y);

      if (tx.type === 'INVOICE') balance += tx.amount;
      else if (tx.type === 'PAYMENT') balance -= tx.amount;

      y += 20;
      doc.y = y;
    });

    // Total
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`SALDO PENDIENTE: $${balance.toLocaleString()}`, 350, doc.y);

    doc.end();

    logger.info('Account statement exported to PDF', {
      count: filteredTransactions.length
    });
  } catch (error) {
    logger.error('Error exporting account statement to PDF', { error: error.message });
    next(error);
  }
};

/**
 * Exportar sesiones de paciente a Excel
 */
export const exportSessionsExcel = async (req, res, next) => {
  try {
    const { patientId, startDate, endDate, status } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: 'patientId es requerido' });
    }

    const where = { patientId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            coverage: true
          }
        },
        transaction: true
      },
      orderBy: { date: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sesiones');

    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Hora', key: 'time', width: 15 },
      { header: 'Duración (min)', key: 'duration', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Facturado', key: 'billed', width: 15 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Notas', key: 'notes', width: 40 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    let totalBilled = 0;
    appointments.forEach((apt) => {
      const aptDate = new Date(apt.date);
      worksheet.addRow({
        date: format(aptDate, 'dd/MM/yyyy'),
        time: format(aptDate, 'HH:mm'),
        duration: apt.duration,
        status: getStatusLabel(apt.status),
        billed: apt.transaction ? 'Sí' : 'No',
        amount: apt.transaction ? `$${apt.transaction.amount.toLocaleString()}` : '-',
        notes: apt.notes || '-'
      });

      if (apt.transaction) {
        totalBilled += apt.transaction.amount;
      }
    });

    worksheet.addRow({});
    const totalRow = worksheet.addRow({
      date: 'TOTAL FACTURADO',
      amount: `$${totalBilled.toLocaleString()}`
    });
    totalRow.getCell('date').font = { bold: true };
    totalRow.getCell('amount').font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sesiones-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    );
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting sessions', { error: error.message });
    next(error);
  }
};

// Helpers
const getTransactionTypeLabel = (type) => {
  const labels = {
    PAYMENT: 'Pago',
    INVOICE: 'Factura',
    ADJUSTMENT: 'Ajuste'
  };
  return labels[type] || type;
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    RESERVED: 'Reservado',
    CONFIRMED: 'Confirmado',
    ABSENT: 'Ausente'
  };
  return labels[status] || status;
};

