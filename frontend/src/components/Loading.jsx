import './Loading.css';

const Loading = ({ message = 'Cargando...', fullScreen = false }) => {
  const content = (
    <div className={`loading ${fullScreen ? 'loading-fullscreen' : ''}`}>
      <div className="loading-spinner" aria-hidden="true">
        <div className="spinner-circle"></div>
      </div>
      {message && (
        <p className="loading-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );

  return content;
};

export default Loading;

