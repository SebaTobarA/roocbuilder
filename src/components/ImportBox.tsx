import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import type { ImportResult } from '../types';

const PLACEHOLDERS = [
  'Nick1,Crusader;Nick2,Wizard',
  'Nick1,Sniper;Nick2,HighPriest',
  'Nick1,Paladin;Nick2,HighWizard',
];

interface ImportBoxProps {
  onImport: (raw: string) => ImportResult;
}

export function ImportBox({ onImport }: ImportBoxProps) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const placeholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

  function handleImport() {
    const raw = value.trim();
    if (!raw) return;

    const result = onImport(raw);
    setValue('');

    if (result.added > 0 && result.skipped.length === 0) {
      setMessage({ text: `${result.added} jugador(es) importado(s).`, type: 'success' });
    } else if (result.added > 0) {
      setMessage({
        text: `${result.added} importado(s). Omitidos: ${result.skipped.join(', ')}`,
        type: 'error',
      });
    } else {
      setMessage({ text: `Sin resultados. Omitidos: ${result.skipped.join(', ')}`, type: 'error' });
    }

    setTimeout(() => setMessage(null), 4000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleImport();
  }

  return (
    <div className="import-box">
      <p className="import-hint">
        Pega tu lista desde Excel o escribe:{' '}
        <code>Nick,Clase;Nick,Clase</code>
      </p>
      <textarea
        className="import-textarea"
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="import-actions">
        <button className="btn btn-primary" onClick={handleImport}>
          <Upload size={14} />
          Importar
        </button>
      </div>
      {message && (
        <p className={`import-message ${message.type}`}>{message.text}</p>
      )}
    </div>
  );
}
