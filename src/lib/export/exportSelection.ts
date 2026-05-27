import type {
  Ability,
  BuffEvent,
  CastEvent,
  DamageTakenEvent,
  DebuffEvent,
} from '$lib/api/wclTypes';
import {
  castBlackList,
  castDict,
  offensiveSpellIds,
  spelllikeBuffs,
  spelllikeDebuffs,
} from '$lib/spellData/tracking';
import ClassUtils from '$lib/utils/ClassUtils';
import {
  toExportDamageSelection,
  toExportDefensiveSelection,
  type DefensiveSelectionRowKind,
  type ExportDamageSelection,
  type ExportDefensiveSelection,
} from './mrtNote';

export type DefensiveEvent = CastEvent | BuffEvent | DebuffEvent;

type ExportSelection = {
  key: string;
  ability: Ability;
};

export type VisibleDefensiveSelectionGroups = {
  major: ExportDefensiveSelection[];
  minor: ExportDefensiveSelection[];
  received: ExportDefensiveSelection[];
  all: ExportDefensiveSelection[];
};

export type VisibleDefensiveSelectionRows = {
  castEventsBySource: CastEvent[];
  castEventsByTarget?: CastEvent[];
  buffEvents?: BuffEvent[];
  debuffEvents?: DebuffEvent[];
  showMinor: boolean;
  showReceived: boolean;
};

export type SelectionSummary<T extends ExportSelection> = {
  ability: Ability;
  selectedCount: number;
  totalCount: number;
  state: 'all' | 'partial';
  selections: T[];
};

export type SelectionGroup<T extends ExportSelection> = {
  ability: Ability;
  count: number;
  selections: T[];
};

export type DefensiveSelectionCategory = 'major' | 'minor' | 'offensive';

export type PullDefensiveSelectionEvents = {
  castEvents: CastEvent[];
  buffEvents: BuffEvent[];
  debuffEvents: DebuffEvent[];
  showMinor: boolean;
  showReceived: boolean;
};

function sortSelection<T extends ExportSelection>(a: T, b: T) {
  return a.ability.guid - b.ability.guid || a.key.localeCompare(b.key);
}

function sortSelectionByTime<T extends ExportSelection & { timestamp: number }>(
  a: T,
  b: T,
) {
  return a.timestamp - b.timestamp || a.key.localeCompare(b.key);
}

export function uniqueSelections<T extends ExportSelection>(selections: T[]) {
  const result = new Map<string, T>();
  for (const selection of selections) {
    if (!result.has(selection.key)) result.set(selection.key, selection);
  }
  return [...result.values()];
}

export function normalizeSpellIds(spellIds: unknown) {
  if (!Array.isArray(spellIds)) return [];
  return [
    ...new Set(
      spellIds.filter(
        (spellId): spellId is number =>
          typeof spellId === 'number' &&
          Number.isInteger(spellId) &&
          spellId > 0,
      ),
    ),
  ].toSorted((a, b) => a - b);
}

export function toggleSpellId(spellIds: unknown, spellId: number) {
  const current = new Set(normalizeSpellIds(spellIds));
  if (current.has(spellId)) {
    current.delete(spellId);
  } else {
    current.add(spellId);
  }
  return [...current].toSorted((a, b) => a - b);
}

export function setSpellIdSelected(
  spellIds: unknown,
  spellId: number,
  selected: boolean,
) {
  const current = new Set(normalizeSpellIds(spellIds));
  if (selected) {
    current.add(spellId);
  } else {
    current.delete(spellId);
  }
  return [...current].toSorted((a, b) => a - b);
}

export function selectBySpellIds<T extends ExportSelection>(
  selections: T[],
  spellIds: unknown,
) {
  const selectedSpellIds = new Set(normalizeSpellIds(spellIds));
  return selections.filter((selection) =>
    selectedSpellIds.has(selection.ability.guid),
  );
}

export function buildSelectionMap<T extends ExportSelection>(selections: T[]) {
  return new Map(
    uniqueSelections(selections).map((selection) => [selection.key, selection]),
  );
}

export function buildSelectionGroups<T extends ExportSelection>(
  selections: T[],
): SelectionGroup<T>[] {
  const bySpellId = new Map<number, T[]>();
  for (const selection of uniqueSelections(selections)) {
    const groupedSelections = bySpellId.get(selection.ability.guid) ?? [];
    groupedSelections.push(selection);
    bySpellId.set(selection.ability.guid, groupedSelections);
  }

  return [...bySpellId.values()]
    .map((groupedSelections) => {
      groupedSelections.sort(sortSelection);
      return {
        ability: groupedSelections[0].ability,
        count: groupedSelections.length,
        selections: groupedSelections,
      };
    })
    .toSorted((a, b) => a.ability.guid - b.ability.guid);
}

export function buildUnselectedSelectionGroups<T extends ExportSelection>(
  selectedSelections: T[],
  candidateSelections: T[],
) {
  const selectedSpellIds = new Set(
    uniqueSelections(selectedSelections).map(
      (selection) => selection.ability.guid,
    ),
  );
  return buildSelectionGroups(candidateSelections).filter(
    (group) => !selectedSpellIds.has(group.ability.guid),
  );
}

export function buildDamageSelections(
  damageEvents: DamageTakenEvent[],
): ExportDamageSelection[] {
  return damageEvents
    .map(toExportDamageSelection)
    .toSorted(sortSelectionByTime);
}

export function isMinorDefensiveCast(event: CastEvent) {
  return castDict[event.ability.guid]?.minor ?? false;
}

export function isMajorDefensiveCast(event: CastEvent) {
  return !isMinorDefensiveCast(event);
}

export function isReceivedDefensiveCast(event: CastEvent) {
  return !castBlackList.AoEHeals.includes(event.ability.guid);
}

export function defensiveSelectionCategory(
  selection: ExportDefensiveSelection,
): DefensiveSelectionCategory {
  if (offensiveSpellIds.has(selection.ability.guid)) return 'offensive';
  if (
    selection.rowKind === 'minor' ||
    (castDict[selection.ability.guid]?.minor ?? false)
  ) {
    return 'minor';
  }
  return 'major';
}

export function isSpelllikeBuffEvent(event: BuffEvent) {
  return (
    spelllikeBuffs[event.ability.guid] !== undefined &&
    ['applybuff', 'applybuffstack', 'refreshbuff'].includes(event.type)
  );
}

export function isSpelllikeDebuffEvent(event: DebuffEvent) {
  return (
    spelllikeDebuffs[event.ability.guid] !== undefined &&
    ['applydebuff', 'applydebuffstack', 'refreshdebuff'].includes(event.type)
  );
}

function buildDefensiveSelections<T extends DefensiveEvent>(
  events: T[],
  rowKind: DefensiveSelectionRowKind,
) {
  return events.map((event) => toExportDefensiveSelection(event, rowKind));
}

export function buildVisibleDefensiveSelectionGroups({
  castEventsBySource,
  castEventsByTarget = [],
  buffEvents = [],
  debuffEvents = [],
  showMinor,
  showReceived,
}: VisibleDefensiveSelectionRows): VisibleDefensiveSelectionGroups {
  const major = buildDefensiveSelections(
    castEventsBySource.filter(isMajorDefensiveCast),
    'major',
  ).toSorted(sortSelectionByTime);
  const minor = showMinor
    ? buildDefensiveSelections(
        [
          ...castEventsBySource.filter(isMinorDefensiveCast),
          ...buffEvents.filter(isSpelllikeBuffEvent),
          ...debuffEvents.filter(isSpelllikeDebuffEvent),
        ],
        'minor',
      ).toSorted(sortSelectionByTime)
    : [];
  const received = showReceived
    ? buildDefensiveSelections(
        castEventsByTarget.filter(isReceivedDefensiveCast),
        'received',
      ).toSorted(sortSelectionByTime)
    : [];

  return {
    major,
    minor,
    received,
    all: uniqueSelections([...major, ...minor, ...received]).toSorted(
      sortSelectionByTime,
    ),
  };
}

export function buildVisibleDefensiveSelectionGroupsForPull({
  castEvents,
  buffEvents,
  debuffEvents,
  showMinor,
  showReceived,
}: PullDefensiveSelectionEvents): VisibleDefensiveSelectionGroups {
  return buildVisibleDefensiveSelectionGroups({
    castEventsBySource: castEvents.filter(
      (event) => event.source && ClassUtils.isPlayer(event.source),
    ),
    castEventsByTarget: castEvents.filter(
      (event) => event.target && ClassUtils.isPlayer(event.target),
    ),
    buffEvents: buffEvents.filter(
      (event) => event.source && ClassUtils.isPlayer(event.source),
    ),
    debuffEvents: debuffEvents.filter(
      (event) => event.source && ClassUtils.isPlayer(event.source),
    ),
    showMinor,
    showReceived,
  });
}

export function buildDefaultMajorDefensiveSelections(
  majorSelections: ExportDefensiveSelection[],
) {
  return majorSelections.filter(
    (selection) =>
      selection.source !== null && !ClassUtils.isTank(selection.source),
  );
}

export function buildDefaultMajorDefensiveSpellIds(
  majorSelections: ExportDefensiveSelection[],
) {
  return normalizeSpellIds(
    buildDefaultMajorDefensiveSelections(majorSelections).map(
      (selection) => selection.ability.guid,
    ),
  );
}

export function buildSelectionSummaries<T extends ExportSelection>(
  selectedSelections: T[],
  candidateSelections: T[],
): SelectionSummary<T>[] {
  const totalCounts = new Map<number, number>();
  const selectedBySpellId = new Map<number, T[]>();
  const uniqueSelectedSelections = uniqueSelections(selectedSelections);
  const uniqueCandidateSelections = uniqueSelections(candidateSelections);

  for (const selection of uniqueCandidateSelections) {
    totalCounts.set(
      selection.ability.guid,
      (totalCounts.get(selection.ability.guid) ?? 0) + 1,
    );
  }

  for (const selection of uniqueSelectedSelections) {
    const selections = selectedBySpellId.get(selection.ability.guid) ?? [];
    selections.push(selection);
    selectedBySpellId.set(selection.ability.guid, selections);
    if (!totalCounts.has(selection.ability.guid)) {
      totalCounts.set(selection.ability.guid, selections.length);
    }
  }

  return [...selectedBySpellId.entries()]
    .map(([_spellId, selections]) => {
      selections.sort(sortSelection);
      const ability = selections[0].ability;
      const totalCount = totalCounts.get(ability.guid) ?? selections.length;
      const state: 'all' | 'partial' =
        selections.length === totalCount ? 'all' : 'partial';
      return {
        ability,
        selectedCount: selections.length,
        totalCount,
        state,
        selections,
      };
    })
    .toSorted((a, b) => a.ability.guid - b.ability.guid);
}
