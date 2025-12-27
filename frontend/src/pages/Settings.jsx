import { useEffect, useState } from 'react';
import { coveragesService, feesService } from '../services/api';
import './Settings.css';

const Settings = () => {
  const [coverages, setCoverages] = useState([]);
  const [fees, setFees] = useState([]);
  const [globalFee, setGlobalFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fees');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coveragesData, feesData, globalFeeData] = await Promise.all([
        coveragesService.getAll(),
        feesService.getAll(),
        feesService.getGlobal()
      ]);

      setCoverages(coveragesData.coverages || []);
      setFees(feesData.fees || []);
      setGlobalFee(globalFeeData.fee);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="settings-page">
      <h1>Configuración</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          Honorarios
        </button>
        <button
          className={`tab ${activeTab === 'coverages' ? 'active' : ''}`}
          onClick={() => setActiveTab('coverages')}
        >
          Coberturas
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'fees' && (
          <div className="card">
            <h2>Configuración de Honorarios</h2>
            
            <div className="setting-section">
              <h3>Honorario Global</h3>
              {globalFee ? (
                <div className="fee-display">
                  <p>
                    <strong>Monto:</strong> ${globalFee.amount.toLocaleString()}
                  </p>
                  {globalFee.description && (
                    <p>
                      <strong>Descripción:</strong> {globalFee.description}
                    </p>
                  )}
                </div>
              ) : (
                <p>No hay honorario global configurado</p>
              )}
            </div>

            <div className="setting-section">
              <h3>Honorarios por Cobertura</h3>
              {fees.filter((f) => !f.isGlobal && f.coverage).length === 0 ? (
                <p>No hay honorarios configurados por cobertura</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Cobertura</th>
                        <th>Monto</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees
                        .filter((f) => !f.isGlobal && f.coverage)
                        .map((fee) => (
                          <tr key={fee.id}>
                            <td>{fee.coverage?.name}</td>
                            <td>${fee.amount.toLocaleString()}</td>
                            <td>{fee.description || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'coverages' && (
          <div className="card">
            <h2>Coberturas</h2>
            {coverages.length === 0 ? (
              <p>No hay coberturas registradas</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Pacientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverages.map((coverage) => (
                      <tr key={coverage.id}>
                        <td>{coverage.name}</td>
                        <td>
                          {coverage.type === 'SOCIAL_SECURITY' && 'Obra Social'}
                          {coverage.type === 'PREPAID' && 'Prepaga'}
                          {coverage.type === 'PRIVATE' && 'Particular'}
                        </td>
                        <td>{coverage.description || '-'}</td>
                        <td>{coverage._count?.patients || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

