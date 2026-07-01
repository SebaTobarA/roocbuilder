import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { EventType } from './types';
import { EventSelector } from './components/EventSelector';
import { GuildLeague } from './components/GuildLeague';
import { EmperiumOverrun } from './components/EmperiumOverrun';

const EVENT_LABEL: Record<NonNullable<EventType>, string> = {
  guild: 'Guild League',
  emperium: 'Emperium Overrun',
};

export default function App() {
  const [event, setEvent] = useState<EventType>(null);

  if (!event) {
    return (
      <div className="app-shell">
        <EventSelector onSelect={setEvent} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setEvent(null)}
          aria-label="Cambiar evento"
        >
          <ArrowLeft size={14} />
          Cambiar evento
        </button>
        <span className="app-header-title">{EVENT_LABEL[event]}</span>
      </header>

      <main className="app-main">
        {event === 'guild' && <GuildLeague />}
        {event === 'emperium' && <EmperiumOverrun />}
      </main>
    </div>
  );
}
