import React from 'react';
import { Campo } from './Campo';
import { useCampo } from '../hooks/useCampo';

export function EmperiumOverrun() {
  const campo = useCampo(undefined, { minPlayers: 20 });

  return (
    <div className="event-layout">
      <Campo
        label="Jugadores del gremio"
        campo={campo}
        showSlotsImmediately
      />
    </div>
  );
}
