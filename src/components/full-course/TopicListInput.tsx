import React, { useState, useEffect } from 'react';
import { FiList, FiInfo, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

interface TopicListInputProps {
  totalDays: number;
  dates: string[];
  onComplete: (topics: string[]) => void;
  onBack: () => void;
}

/**
 * Component for inputting custom topics for each day of the course.
 * Users can enter one topic per line in a textarea.
 */
export const TopicListInput: React.FC<TopicListInputProps> = ({
  totalDays,
  dates,
  onComplete,
  onBack,
}) => {
  const [topicsText, setTopicsText] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Parse topics from textarea (one per line)
  useEffect(() => {
    const lines = topicsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    setTopics(lines);

    // Validate topic count
    if (lines.length > 0 && lines.length !== totalDays) {
      setError(`Attenzione: hai inserito ${lines.length} argomenti ma il corso ha ${totalDays} giorni`);
    } else {
      setError('');
    }
  }, [topicsText, totalDays]);

  const handleContinue = () => {
    if (topics.length === 0) {
      setError('Inserisci almeno un argomento');
      return;
    }

    if (topics.length !== totalDays) {
      setError(`Devi inserire esattamente ${totalDays} argomenti (uno per ogni giorno del corso)`);
      return;
    }

    onComplete(topics);
  };

  const handleSkip = () => {
    // Skip and use default topics from CSV
    onComplete([]);
  };

  return (
    <div className="topic-list-input">
      <div className="content-header">
        <h2>
          <FiList /> Lista Argomenti per Giorno
        </h2>
        <p>Inserisci un argomento per ogni giorno del corso (uno per riga)</p>
      </div>

      <div className="info-banner">
        <FiInfo />
        <div>
          <strong>Importante:</strong> Devi inserire esattamente {totalDays} argomenti, uno per ogni giorno del corso.
          Gli argomenti verranno assegnati ai giorni in ordine cronologico.
        </div>
      </div>

      <div className="dates-preview">
        <h3>Date del corso ({dates.length} giorni):</h3>
        <div className="dates-list">
          {dates.map((date, index) => (
            <span key={date} className="date-badge">
              {index + 1}. {date}
            </span>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="topics-textarea">
          Argomenti (uno per riga)
          <span className="topic-count">
            {topics.length} / {totalDays}
          </span>
        </label>
        <textarea
          id="topics-textarea"
          value={topicsText}
          onChange={(e) => setTopicsText(e.target.value)}
          placeholder={`Esempio:\nIntroduzione al corso\nConcetti base\nEsercitazioni pratiche\n...`}
          rows={Math.max(10, totalDays + 2)}
          className={error ? 'error' : ''}
        />
        {error && <div className="error-message">{error}</div>}
      </div>

      {topics.length > 0 && (
        <div className="topics-preview">
          <h3>Anteprima assegnazione argomenti:</h3>
          <div className="preview-list">
            {dates.map((date, index) => (
              <div key={date} className="preview-item">
                <span className="preview-date">{date}</span>
                <span className="preview-arrow">→</span>
                <span className={`preview-topic ${!topics[index] ? 'missing' : ''}`}>
                  {topics[index] || '(mancante)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button onClick={onBack} className="btn btn-secondary">
          <FiArrowLeft /> Indietro
        </button>

        <div className="right-buttons">
          <button onClick={handleSkip} className="btn btn-outline">
            Salta (usa argomenti da CSV)
          </button>
          <button
            onClick={handleContinue}
            className="btn btn-primary"
            disabled={topics.length !== totalDays}
          >
            Continua <FiArrowRight />
          </button>
        </div>
      </div>

      <style>{`
        .topic-list-input {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .content-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .content-header p {
          color: #666;
          margin-bottom: 1.5rem;
        }

        .info-banner {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .info-banner svg {
          flex-shrink: 0;
          color: #2196f3;
          margin-top: 2px;
        }

        .dates-preview {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .dates-preview h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          color: #555;
        }

        .dates-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .date-badge {
          background: white;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.85rem;
          border: 1px solid #ddd;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .topic-count {
          font-size: 0.9rem;
          color: #666;
          font-weight: normal;
        }

        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.95rem;
          resize: vertical;
          transition: border-color 0.2s;
        }

        .form-group textarea:focus {
          outline: none;
          border-color: #2196f3;
        }

        .form-group textarea.error {
          border-color: #f44336;
        }

        .error-message {
          color: #f44336;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .topics-preview {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .topics-preview h3 {
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
          color: #555;
        }

        .preview-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .preview-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .preview-date {
          font-weight: 600;
          color: #555;
          min-width: 100px;
        }

        .preview-arrow {
          color: #999;
        }

        .preview-topic {
          flex: 1;
          color: #333;
        }

        .preview-topic.missing {
          color: #f44336;
          font-style: italic;
        }

        .action-buttons {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #ddd;
        }

        .right-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2196f3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1976d2;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .btn-outline {
          background: white;
          color: #666;
          border: 2px solid #ddd;
        }

        .btn-outline:hover {
          border-color: #999;
          color: #333;
        }
      `}</style>
    </div>
  );
};
