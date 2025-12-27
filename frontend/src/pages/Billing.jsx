import { useEffect, useState } from 'react';
import { billingService, patientsService } from '../services/api';
import { format } from 'date-fns';
import './Billing.css';

const Billing = () => {
  const [transactions, setTransactions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    patientId: '',
    type: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [transactionsData, patientsData] = await Promise.all([
        billingService.getAll(filters),
        patientsService.getAll({ limit: 100 })
      ]);

      setTransactions(transactionsData.transactions || []);
      setPatients(patientsData.patients || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      PAYMENT: 'Pago',
      INVOICE: 'Factura',
      ADJUSTMENT: 'Ajuste'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const totalInvoiced = transactions
    .filter((t) => t.type === 'INVOICE' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = transactions
    .filter((t) => t.type === 'PAYMENT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingBalance = totalInvoiced - totalPaid;

  return (
    <div className="billing-page">
      <h1>Facturación</h1>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Facturado</h3>
          <p className="stat-value">${totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Cobrado</h3>
          <p className="stat-value">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Saldo Pendiente</h3>
          <p className={`stat-value ${pendingBalance > 0 ? 'negative' : 'positive'}`}>
            ${Math.abs(pendingBalance).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Transacciones</h2>
        </div>

        <div className="filters">
          <select
            className="form-select"
            value={filters.patientId}
            onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
          >
            <option value="">Todos los pacientes</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Todos los tipos</option>
            <option value="PAYMENT">Pago</option>
            <option value="INVOICE">Factura</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </select>

          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="COMPLETED">Completado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        {transactions.length === 0 ? (
          <p>No se encontraron transacciones</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                    <td>
                      {tx.patient?.firstName} {tx.patient?.lastName}
                    </td>
                    <td>{getTransactionTypeLabel(tx.type)}</td>
                    <td
                      className={
                        tx.type === 'PAYMENT' ? 'amount-positive' : 'amount-negative'
                      }
                    >
                      {tx.type === 'PAYMENT' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          tx.status === 'COMPLETED' ? 'success' : 'warning'
                        }`}
                      >
                        {tx.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>{tx.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;

