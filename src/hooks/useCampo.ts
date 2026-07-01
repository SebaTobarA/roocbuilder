import { useState, useCallback, useRef } from 'react';
import type { Player, Party, SlotLabel, Role, ImportResult } from '../types';
import { parseEntries } from '../utils/parseEntries';
import { inferRole, isLordKnight, isCreatorClass, normalizeClass } from '../utils/inferRole';

export const DEFAULT_SLOTS: SlotLabel[] = ['Tanque', 'Soporte', 'Daño', 'Daño', 'Daño'];

const SLOT_TO_ROLE: Record<SlotLabel, Role> = {
  Tanque:   'Tank',
  Soporte:  'Support',
  Daño:     'DPS',
  Flexible: 'Flexible',
};

const ROLE_ORDER: Record<Role, number> = {
  Tank: 0,
  Support: 1,
  DPS: 2,
  Flexible: 3,
};

const uidRef = { current: 0 };
function nextId(prefix: string): string {
  return `${prefix}_${++uidRef.current}`;
}

function computeQuota(slots: SlotLabel[]): Record<Role, number> {
  const quota: Record<Role, number> = { Tank: 0, DPS: 0, Support: 0, Flexible: 0 };
  slots.forEach(l => { quota[SLOT_TO_ROLE[l]]++; });
  return quota;
}

export interface UseCampoReturn {
  players: Player[];
  parties: Party[];
  compositions: SlotLabel[][];
  setCompositions: (c: SlotLabel[][]) => void;
  importPlayers: (raw: string) => ImportResult;
  organizeParties: () => boolean;
  suggestDistribution: () => void;
  assignPlayer: (playerId: string, partyId: string | null) => void;
  removePlayer: (playerId: string) => void;
  addParty: () => void;
  unassigned: Player[];
  completeCount: number;
  hasPlayers: boolean;
}

export function useCampo(initialSlots?: SlotLabel[]): UseCampoReturn {
  const [players, setPlayers] = useState<Player[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [compositions, setCompositionsState] = useState<SlotLabel[][]>([
    initialSlots ?? [...DEFAULT_SLOTS],
  ]);

  const playersRef = useRef<Player[]>(players);
  const partiesRef = useRef<Party[]>(parties);
  const compositionsRef = useRef<SlotLabel[][]>(compositions);
  playersRef.current = players;
  partiesRef.current = parties;
  compositionsRef.current = compositions;

  const unassigned = players.filter(p => !p.partyId);
  const hasPlayers = players.length > 0;

  const completeCount = parties.filter(party => {
    const members = players.filter(p => p.partyId === party.id);
    return (
      members.length > 0 &&
      members.some(m => m.rol === 'Tank') &&
      members.some(m => m.rol === 'Support')
    );
  }).length;

  const setCompositions = useCallback((c: SlotLabel[][]) => {
    setCompositionsState(c.length > 0 ? c : [[...DEFAULT_SLOTS]]);
  }, []);

  const importPlayers = useCallback((raw: string): ImportResult => {
    const entries = parseEntries(raw);
    const added: Player[] = [];
    const skipped: string[] = [];
    const existing = playersRef.current;

    for (const entry of entries) {
      const parts = entry.split(',').map(s => s.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        skipped.push(entry || '(vacío)');
        continue;
      }
      const [nick, rawClase] = parts;
      const clase = normalizeClass(rawClase);
      const isDuplicate =
        added.some(a => a.nickname.toLowerCase() === nick.toLowerCase()) ||
        existing.some(p => p.nickname.toLowerCase() === nick.toLowerCase());

      if (isDuplicate) {
        skipped.push(`${nick} (duplicado)`);
        continue;
      }

      added.push({
        id: nextId('player'),
        nickname: nick,
        clase,
        rol: inferRole(clase),
        partyId: null,
      });
    }

    if (added.length > 0) {
      setPlayers(prev => [...prev, ...added]);
    }

    return { added: added.length, skipped };
  }, []);

  // Cicla entre composiciones. Lord Knights son DPS primario; si faltan Tanks
  // (Paladines), se usan LKs como tanques de emergencia (cambia su color a azul).
  const organizeParties = useCallback((): boolean => {
    const comps = compositionsRef.current;
    const all = playersRef.current;

    // Separar LKs del resto del pool DPS
    const lordKnights = all.filter(p => p.rol === 'DPS' && isLordKnight(p.clase)).slice();
    // Soporte prioritario: Bard/Gypsy/HP — Creator solo como último recurso
    const prioritySupport = all.filter(p => p.rol === 'Support' && !isCreatorClass(p.clase)).slice();
    const creatorPool     = all.filter(p => p.rol === 'Support' &&  isCreatorClass(p.clase)).slice();
    const byRole: Record<Role, Player[]> = {
      Tank:     all.filter(p => p.rol === 'Tank').slice(),
      DPS:      all.filter(p => p.rol === 'DPS' && !isLordKnight(p.clase)).slice(),
      Support:  prioritySupport, // alias — se llena primero con prioridad
      Flexible: all.filter(p => p.rol === 'Flexible').slice(),
    };

    const newParties: Party[] = [];
    const assignments: Record<string, string> = {};
    const roleOverrides: Record<string, Role> = {};
    let index = 0;

    while (true) {
      const currentSlots = comps[index % comps.length];
      const quota = computeQuota(currentSlots);
      const partySize = currentSlots.length;

      // LKs disponibles para Tank sólo si no alcanzan los Tanques reales
      const lksNeededAsTank = Math.max(0, quota.Tank - byRole.Tank.length);
      const lksForDPS = lordKnights.length - lksNeededAsTank;

      const canFillTank    = byRole.Tank.length + lordKnights.length >= quota.Tank;
      const canFillSupport = prioritySupport.length + creatorPool.length >= quota.Support;
      const canFillDPS     = byRole.DPS.length + Math.max(0, lksForDPS) >= quota.DPS;

      const remaining =
        byRole.Tank.length + byRole.DPS.length + lordKnights.length +
        prioritySupport.length + creatorPool.length + byRole.Flexible.length;

      if (!canFillTank || !canFillSupport || !canFillDPS || remaining < partySize) break;

      index++;
      const party: Party = {
        id: nextId('party'),
        name: `Party ${index}`,
        capacity: partySize,
      };

      // Tank: Paladines primero, LKs de emergencia
      for (let i = 0; i < quota.Tank; i++) {
        const real = byRole.Tank.shift();
        if (real) {
          assignments[real.id] = party.id;
        } else {
          const lk = lordKnights.shift();
          if (lk) {
            assignments[lk.id] = party.id;
            roleOverrides[lk.id] = 'Tank'; // muestra azul en el chip
          }
        }
      }

      // Soporte: Bard/Gypsy/HP primero, Creator solo si no hay prioridad
      for (let i = 0; i < quota.Support; i++) {
        const p = prioritySupport.shift() ?? creatorPool.shift();
        if (p) assignments[p.id] = party.id;
      }

      // DPS: regulares primero, LKs restantes
      for (let i = 0; i < quota.DPS; i++) {
        const p = byRole.DPS.shift() ?? lordKnights.shift();
        if (p) assignments[p.id] = party.id;
      }

      // Flexible: Creators primero como flex, luego el resto
      for (let i = 0; i < quota.Flexible; i++) {
        const p =
          byRole.Flexible.shift() ??
          creatorPool.shift() ??
          byRole.DPS.shift() ??
          lordKnights.shift() ??
          prioritySupport.shift() ??
          byRole.Tank.shift();
        if (p) assignments[p.id] = party.id;
      }

      newParties.push(party);
    }

    if (newParties.length === 0) return false;

    setParties(newParties);
    setPlayers(prev =>
      prev.map(p => ({
        ...p,
        partyId: assignments[p.id] ?? null,
        ...(roleOverrides[p.id] ? { rol: roleOverrides[p.id] } : {}),
      }))
    );
    return true;
  }, []);

  const suggestDistribution = useCallback(() => {
    const unassignedPlayers = playersRef.current.filter(p => !p.partyId);
    if (!unassignedPlayers.length) return;

    const targetSize = Math.max(1, compositionsRef.current[0].length);
    const numGroups = Math.ceil(unassignedPlayers.length / targetSize);
    const sorted = [...unassignedPlayers].sort(
      (a, b) => ROLE_ORDER[a.rol] - ROLE_ORDER[b.rol]
    );

    const groups: Player[][] = Array.from({ length: numGroups }, () => []);
    sorted.forEach((p, i) => groups[i % numGroups].push(p));

    const newParties: Party[] = [];
    const assignments: Record<string, string> = {};
    const existingCount = partiesRef.current.length;

    groups.forEach((group, gi) => {
      if (!group.length) return;
      const party: Party = {
        id: nextId('party'),
        name: `Party ${existingCount + gi + 1} (sugerida)`,
        capacity: targetSize,
      };
      newParties.push(party);
      group.forEach(p => { assignments[p.id] = party.id; });
    });

    setParties(prev => [...prev, ...newParties]);
    setPlayers(prev =>
      prev.map(p => ({ ...p, partyId: assignments[p.id] ?? p.partyId }))
    );
  }, []);

  const assignPlayer = useCallback((playerId: string, partyId: string | null) => {
    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, partyId } : p))
    );
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  }, []);

  const addParty = useCallback(() => {
    setParties(prev => [
      ...prev,
      { id: nextId('party'), name: `Party ${prev.length + 1}`, capacity: 12 },
    ]);
  }, []);

  return {
    players,
    parties,
    compositions,
    setCompositions,
    importPlayers,
    organizeParties,
    suggestDistribution,
    assignPlayer,
    removePlayer,
    addParty,
    unassigned,
    completeCount,
    hasPlayers,
  };
}
