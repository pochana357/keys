import type {
  Ability,
  CastEvent,
  DamageTakenEvent,
  UnitRaw,
} from '$lib/api/wclTypes';
import ClassUtils from '$lib/utils/ClassUtils';
import {
  defaultExportLanguage,
  getSpellAbbreviation,
  type ExportLanguage,
} from './spellAbbreviations';
import { getTargetAbbreviation, isSameUnit } from './unitAbbreviations';

export const defaultAttachWindowMs = 10000;

export type DefensiveSelectionRowKind = 'major' | 'minor' | 'received';

export type ExportDamageSelection = {
  key: string;
  timestamp: number;
  ability: Ability;
  target: UnitRaw | null;
};

export type ExportDefensiveSelection = {
  key: string;
  timestamp: number;
  ability: Ability;
  source: UnitRaw | null;
  target: UnitRaw | null;
  rowKind: DefensiveSelectionRowKind;
};

export type BuildMrtNoteOptions = {
  referenceTime: number;
  attachWindowMs?: number;
  language?: ExportLanguage;
  damageGroupIntervalMs?: number;
  encounterId?: number;
};

export type AttachedDamageSelection = {
  damage: ExportDamageSelection;
  defensives: ExportDefensiveSelection[];
};

export type AttachedDefensives = {
  damageGroups: AttachedDamageSelection[];
  unassignedDefensives: ExportDefensiveSelection[];
};

export type MrtNoteRow = {
  key: string;
  timestamp: number;
  damage: ExportDamageSelection | null;
  damageEventNumber: number | null;
  defensives: ExportDefensiveSelection[];
};

export type MrtNoteModel = AttachedDefensives & {
  rows: MrtNoteRow[];
  encounterId?: number;
};

type DefensiveEventLike = Pick<
  CastEvent,
  'timestamp' | 'ability' | 'source' | 'target'
>;

function unitKey(unit: UnitRaw | null | undefined) {
  return unit?.id ?? 'none';
}

export function damageSelectionKey(event: DamageTakenEvent) {
  return [event.timestamp, unitKey(event.target), event.ability.guid].join(':');
}

export function defensiveSelectionKey(
  event: DefensiveEventLike,
  _rowKind?: DefensiveSelectionRowKind,
) {
  return [
    event.timestamp,
    unitKey(event.source),
    unitKey(event.target),
    event.ability.guid,
  ].join(':');
}

export function toExportDamageSelection(
  event: DamageTakenEvent,
): ExportDamageSelection {
  return {
    key: damageSelectionKey(event),
    timestamp: event.timestamp,
    ability: event.ability,
    target: event.target,
  };
}

export function toExportDefensiveSelection(
  event: DefensiveEventLike,
  rowKind: DefensiveSelectionRowKind,
): ExportDefensiveSelection {
  return {
    key: defensiveSelectionKey(event, rowKind),
    timestamp: event.timestamp,
    ability: event.ability,
    source: event.source,
    target: event.target,
    rowKind,
  };
}

export function formatMrtTime(timestamp: number, referenceTime: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor((timestamp - referenceTime) / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `{time:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}}`;
}

function sortDamage(a: ExportDamageSelection, b: ExportDamageSelection) {
  return a.timestamp - b.timestamp || a.key.localeCompare(b.key);
}

function sortDefensiveByTime(
  a: ExportDefensiveSelection,
  b: ExportDefensiveSelection,
) {
  return a.timestamp - b.timestamp || a.key.localeCompare(b.key);
}

function sortDefensiveForList(
  a: ExportDefensiveSelection,
  b: ExportDefensiveSelection,
) {
  return (
    ClassUtils.comparePlayerOrder(a.source, b.source) ||
    a.timestamp - b.timestamp ||
    a.key.localeCompare(b.key)
  );
}

export function reduceDamageSelections(
  damages: ExportDamageSelection[],
  damageGroupIntervalMs = 3000,
) {
  const intervalMs =
    Number.isFinite(damageGroupIntervalMs) && damageGroupIntervalMs >= 0
      ? damageGroupIntervalMs
      : 3000;
  const lastTimestamps = new Map<number, number>();
  const result: ExportDamageSelection[] = [];

  for (const damage of damages.toSorted(sortDamage)) {
    const lastTimestamp = lastTimestamps.get(damage.ability.guid);
    if (
      lastTimestamp !== undefined &&
      damage.timestamp - lastTimestamp < intervalMs
    ) {
      lastTimestamps.set(damage.ability.guid, damage.timestamp);
    } else {
      result.push(damage);
      lastTimestamps.set(damage.ability.guid, damage.timestamp);
    }
  }

  return result;
}

export function attachDefensivesToDamage(
  damages: ExportDamageSelection[],
  defensives: ExportDefensiveSelection[],
  options: { attachWindowMs?: number } = {},
): AttachedDefensives {
  const attachWindowMs =
    options.attachWindowMs !== undefined &&
    Number.isFinite(options.attachWindowMs)
      ? Math.max(0, options.attachWindowMs)
      : defaultAttachWindowMs;
  const damageGroups: AttachedDamageSelection[] = damages
    .toSorted(sortDamage)
    .map((damage) => ({ damage, defensives: [] }));
  const unassignedDefensives: ExportDefensiveSelection[] = [];

  for (const defensive of defensives.toSorted(sortDefensiveByTime)) {
    let bestGroup: AttachedDamageSelection | null = null;
    let bestDistance = Infinity;
    for (const group of damageGroups) {
      const distance = Math.abs(defensive.timestamp - group.damage.timestamp);
      if (distance > attachWindowMs) continue;
      if (
        distance < bestDistance ||
        (distance === bestDistance &&
          bestGroup &&
          sortDamage(group.damage, bestGroup.damage) < 0) ||
        (distance === bestDistance && !bestGroup)
      ) {
        bestGroup = group;
        bestDistance = distance;
      }
    }

    if (bestGroup) {
      bestGroup.defensives.push(defensive);
    } else {
      unassignedDefensives.push(defensive);
    }
  }

  for (const group of damageGroups) {
    group.defensives.sort(sortDefensiveForList);
  }
  unassignedDefensives.sort(sortDefensiveByTime);

  return { damageGroups, unassignedDefensives };
}

export function defensiveClassColor(defensive: ExportDefensiveSelection) {
  return ClassUtils.classColorHex(defensive.source?.type ?? '')
    .replace('#', '')
    .toUpperCase();
}

export function defensiveToken(
  defensive: ExportDefensiveSelection,
  language: ExportLanguage,
) {
  return `|cff${defensiveClassColor(defensive)}${defensiveLabel(
    defensive,
    language,
  )}|r {spell:${defensive.ability.guid}}`;
}

export function defensiveLabel(
  defensive: ExportDefensiveSelection,
  language: ExportLanguage,
) {
  const spellLabel = getSpellAbbreviation(defensive.ability, language);
  if (isSameUnit(defensive.source, defensive.target)) return spellLabel;

  const targetLabel = getTargetAbbreviation(defensive.target, language);
  return targetLabel ? `${spellLabel}▶${targetLabel}` : spellLabel;
}

export function formatDamageEventName(damage: ExportDamageSelection) {
  return damage.ability.name.trim().split(/\s+/).at(-1) ?? damage.ability.name;
}

export function formatDamageLabel(
  damage: ExportDamageSelection,
  eventNumber: number,
) {
  return `${formatDamageEventName(damage)}#${eventNumber}`;
}

function sortMrtNoteRows(a: MrtNoteRow, b: MrtNoteRow) {
  return (
    a.timestamp - b.timestamp ||
    Number(a.damage === null) - Number(b.damage === null) ||
    a.key.localeCompare(b.key)
  );
}

export function buildMrtNoteRows(attached: AttachedDefensives) {
  const damageEventCounts = new Map<number, number>();
  const damageRows = attached.damageGroups.map(({ damage, defensives }) => {
    const eventNumber = (damageEventCounts.get(damage.ability.guid) ?? 0) + 1;
    damageEventCounts.set(damage.ability.guid, eventNumber);
    return {
      key: `damage:${damage.key}`,
      timestamp: damage.timestamp,
      damage,
      damageEventNumber: eventNumber,
      defensives,
    };
  });

  return [
    ...damageRows,
    ...attached.unassignedDefensives.map((defensive) => ({
      key: `defensive:${defensive.key}`,
      timestamp: defensive.timestamp,
      damage: null,
      damageEventNumber: null,
      defensives: [defensive],
    })),
  ].toSorted(sortMrtNoteRows);
}

export function buildMrtNoteModel(
  damages: ExportDamageSelection[],
  defensives: ExportDefensiveSelection[],
  options: BuildMrtNoteOptions,
): MrtNoteModel {
  const reducedDamages = reduceDamageSelections(
    damages,
    options.damageGroupIntervalMs,
  );
  const attached = attachDefensivesToDamage(reducedDamages, defensives, {
    attachWindowMs: options.attachWindowMs,
  });
  return {
    ...attached,
    rows: buildMrtNoteRows(attached),
    encounterId: options.encounterId,
  };
}

export function buildMrtNote(
  damages: ExportDamageSelection[],
  defensives: ExportDefensiveSelection[],
  options: BuildMrtNoteOptions,
) {
  const language = options.language ?? defaultExportLanguage;
  const model = buildMrtNoteModel(damages, defensives, options);
  const lines = model.rows.map((row) => {
    const defensiveTokens = row.defensives.map((defensive) =>
      defensiveToken(defensive, language),
    );
    if (!row.damage) {
      return [
        formatMrtTime(row.timestamp, options.referenceTime),
        '-',
        ...defensiveTokens,
      ].join(' ');
    }

    const damageTokens = [
      formatMrtTime(row.damage.timestamp, options.referenceTime),
      formatDamageLabel(row.damage, row.damageEventNumber ?? 1),
      `{spell:${row.damage.ability.guid}}`,
    ];
    return row.defensives.length > 0
      ? [...damageTokens, '-', ...defensiveTokens].join(' ')
      : damageTokens.join(' ');
  });

  if (model.encounterId) {
    return [`{e:${model.encounterId}}`, ...lines, '{/e}'].join('\n');
  }

  return lines.join('\n');
}
