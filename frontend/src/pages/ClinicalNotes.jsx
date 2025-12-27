import { useEffect, useState } from 'react';
import { clinicalNotesService, patientsService } from '../services/api';
import { format } from 'date-fns';
import './ClinicalNotes.css';

const ClinicalNotes = () => {
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notesData, patientsData] = await Promise.all([
        clinicalNotesService.getAll(),
        patientsService.getAll({ limit: 100 })
      ]);

      setNotes(notesData.notes || []);
      setPatients(patientsData.patients || []);
    } catch (error) {
      console.error('Error cargando notas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="clinical-notes-page">
      <div className="page-header">
        <h1>Notas Clínicas</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          ➕ Nueva Nota
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="card">
          <p>No hay notas clínicas registradas</p>
        </div>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="card note-card">
              <div className="note-header">
                <div>
                  <h3>
                    {note.patient.firstName} {note.patient.lastName}
                  </h3>
                  <p className="note-date">
                    {format(new Date(note.date), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div className="note-content">
                <p>{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalNotes;

