import { describe, expect, it } from 'vitest';
import type { Ability, BuffEvent, CastEvent, UnitRaw } from '$lib/api/wclTypes';
import {
  buildDefaultMajorDefensiveSpellIds,
  buildSelectionGroups,
  buildSelectionSummaries,
  buildUnselectedSelectionGroups,
  buildVisibleDefensiveSelectionGroups,
  defensiveSelectionCategory,
  selectBySpellIds,
  setSpellIdSelected,
  toggleSpellId,
} from './exportSelection';
import {
  defensiveSelectionKey,
  toExportDefensiveSelection,
  type ExportDamageSelection,
} from './mrtNote';

const ability = (guid: number, name: string): Ability => ({
  guid,
  name,
  type: 1,
  abilityIcon: 'spell.jpg',
});

const unit = (
  id: number,
  name: string,
  type: string,
  icon = type,
): UnitRaw => ({
  id,
  guid: id + 1000,
  name,
  type,
  icon,
});

const damageSelection = (
  key: string,
  spellId: number,
  name = `Damage ${spellId}`,
): ExportDamageSelection => ({
  key,
  timestamp: Number(key.replace(/\D/g, '')) || 0,
  ability: ability(spellId, name),
  target: unit(1, 'Target', 'Priest', 'Priest-Discipline'),
});

const cast = (
  timestamp: number,
  spellId: number,
  source: UnitRaw,
  target = unit(2, 'Target', 'Priest', 'Priest-Discipline'),
): CastEvent => ({
  timestamp,
  type: 'cast',
  sourceID: source.id,
  sourceIsFriendly: 1,
  targetID: target.id,
  targetIsFriendly: 1,
  ability: ability(spellId, `Spell ${spellId}`),
  source,
  target,
});

const buff = (
  timestamp: number,
  spellId: number,
  source: UnitRaw,
  target = source,
): BuffEvent => ({
  timestamp,
  type: 'applybuff',
  sourceID: source.id,
  sourceIsFriendly: 1,
  targetID: target.id,
  targetIsFriendly: 1,
  ability: ability(spellId, `Buff ${spellId}`),
  source,
  target,
});

describe('export selection spell ids', () => {
  it('toggling a damage spell id selects and removes all current-pull damage events with that spell id', () => {
    let selectedSpellIds: number[] = [];
    const candidates = [
      damageSelection('same-1', 123),
      damageSelection('same-2', 123),
      damageSelection('other', 456),
    ];

    selectedSpellIds = toggleSpellId(selectedSpellIds, 123);

    expect(
      selectBySpellIds(candidates, selectedSpellIds).map(
        (selection) => selection.key,
      ),
    ).toEqual(['same-1', 'same-2']);

    selectedSpellIds = toggleSpellId(selectedSpellIds, 123);

    expect(selectBySpellIds(candidates, selectedSpellIds)).toEqual([]);
  });

  it('toggling a defensive spell id selects and removes all visible logical defensive casts with that spell id', () => {
    let selectedSpellIds: number[] = [];
    const source = unit(10, 'Priest', 'Priest', 'Priest-Discipline');
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [
        cast(1000, 33206, source),
        cast(2000, 33206, source),
        cast(3000, 642, source),
      ],
      showMinor: false,
      showReceived: false,
    });

    selectedSpellIds = toggleSpellId(
      selectedSpellIds,
      groups.major[0].ability.guid,
    );

    expect(selectBySpellIds(groups.all, selectedSpellIds)).toEqual([
      groups.major[0],
      groups.major[1],
    ]);

    selectedSpellIds = toggleSpellId(
      selectedSpellIds,
      groups.major[0].ability.guid,
    );

    expect(selectBySpellIds(groups.all, selectedSpellIds)).toEqual([]);
  });

  it('uses the same logical key for caster-side and received-side projections of one cast', () => {
    const source = unit(10, 'Monk', 'Monk', 'Monk-Windwalker');
    const target = unit(11, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const event = cast(1000, 116849, source, target);
    const major = toExportDefensiveSelection(event, 'major');
    const received = toExportDefensiveSelection(event, 'received');

    expect(major.key).toBe(received.key);
    expect(defensiveSelectionKey(event, 'major')).toBe(
      defensiveSelectionKey(event, 'received'),
    );
  });

  it('marks the received projection selected when the caster-side projection is selected by spell id', () => {
    const source = unit(10, 'Monk', 'Monk', 'Monk-Windwalker');
    const target = unit(11, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const event = cast(1000, 116849, source, target);
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [event],
      castEventsByTarget: [event],
      showMinor: false,
      showReceived: true,
    });
    const selected = selectBySpellIds(groups.all, [116849]);

    expect(selected).toEqual([groups.major[0]]);
    expect(groups.received[0].key).toBe(groups.major[0].key);
  });

  it('summarizes selected spell groups as all or partial', () => {
    const selected = [
      damageSelection('same-1', 123),
      damageSelection('other-1', 456),
      damageSelection('other-2', 456),
    ];
    const candidates = [
      damageSelection('same-1', 123),
      damageSelection('same-2', 123),
      damageSelection('other-1', 456),
      damageSelection('other-2', 456),
    ];

    expect(
      buildSelectionSummaries(selected, candidates).map((summary) => ({
        spellId: summary.ability.guid,
        selectedCount: summary.selectedCount,
        totalCount: summary.totalCount,
        state: summary.state,
      })),
    ).toEqual([
      { spellId: 123, selectedCount: 1, totalCount: 2, state: 'partial' },
      { spellId: 456, selectedCount: 2, totalCount: 2, state: 'all' },
    ]);
  });

  it('reconstructs selected lists from spell ids and candidates', () => {
    const candidates = [
      damageSelection('same-1', 123),
      damageSelection('same-2', 123),
      damageSelection('other', 456),
    ];

    expect(selectBySpellIds(candidates, [123])).toEqual([
      candidates[0],
      candidates[1],
    ]);
  });

  it('sets a spell id selected or unselected idempotently', () => {
    expect(setSpellIdSelected([456], 123, true)).toEqual([123, 456]);
    expect(setSpellIdSelected([123, 456], 123, true)).toEqual([123, 456]);
    expect(setSpellIdSelected([123, 456], 123, false)).toEqual([456]);
  });

  it('builds selected and unselected spell groups for the export pane', () => {
    const candidates = [
      damageSelection('same-1', 123),
      damageSelection('same-2', 123),
      damageSelection('other', 456),
    ];
    const selected = selectBySpellIds(candidates, [123]);

    expect(
      buildSelectionGroups(selected).map((group) => ({
        spellId: group.ability.guid,
        count: group.count,
      })),
    ).toEqual([{ spellId: 123, count: 2 }]);
    expect(
      buildUnselectedSelectionGroups(selected, candidates).map((group) => ({
        spellId: group.ability.guid,
        count: group.count,
      })),
    ).toEqual([{ spellId: 456, count: 1 }]);
  });

  it('keeps full damage skill names for the export pane damage subpane', () => {
    const selected = [damageSelection('dash-1', 1280067, 'Phase Dash')];

    expect(buildSelectionGroups(selected)[0].ability.name).toBe('Phase Dash');
  });

  it('dedupes caster-side and received-side projections in defensive summary counts', () => {
    const source = unit(10, 'Monk', 'Monk', 'Monk-Windwalker');
    const target = unit(11, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const first = cast(1000, 116849, source, target);
    const second = cast(2000, 116849, source, target);
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [first, second],
      castEventsByTarget: [first, second],
      showMinor: false,
      showReceived: true,
    });

    expect(groups.major).toHaveLength(2);
    expect(groups.received).toHaveLength(2);
    expect(groups.all).toHaveLength(2);
    expect(
      buildSelectionSummaries(
        [...groups.major, ...groups.received],
        [...groups.major, ...groups.received],
      ).map((summary) => ({
        spellId: summary.ability.guid,
        selectedCount: summary.selectedCount,
        totalCount: summary.totalCount,
        state: summary.state,
      })),
    ).toEqual([
      { spellId: 116849, selectedCount: 2, totalCount: 2, state: 'all' },
    ]);
  });

  it('selects unique logical defensive casts only once from selected spell ids', () => {
    const source = unit(10, 'Monk', 'Monk', 'Monk-Windwalker');
    const target = unit(11, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const first = cast(1000, 116849, source, target);
    const second = cast(2000, 116849, source, target);
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [first, second],
      castEventsByTarget: [first, second],
      showMinor: false,
      showReceived: true,
    });

    expect(selectBySpellIds(groups.all, [116849])).toEqual(groups.major);
  });
});

describe('default defensive selections', () => {
  it('builds default spell ids from non-tank major defensives and excludes tank-only major defensives', () => {
    const nonTank = unit(10, 'Ret', 'Paladin', 'Paladin-Retribution');
    const tank = unit(11, 'Prot', 'Paladin', 'Paladin-Protection');
    const tankOnly = unit(12, 'Guardian', 'Druid', 'Druid-Guardian');
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [
        cast(1000, 642, nonTank),
        cast(2000, 642, tank),
        cast(3000, 22812, tankOnly),
      ],
      showMinor: false,
      showReceived: false,
    });

    expect(buildDefaultMajorDefensiveSpellIds(groups.major)).toEqual([642]);
  });

  it('reset defensive defaults use the same default major defensive spell-id set', () => {
    const nonTank = unit(10, 'Monk', 'Monk', 'Monk-Windwalker');
    const target = unit(11, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const event = cast(1000, 116849, nonTank, target);
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [event],
      castEventsByTarget: [event],
      showMinor: false,
      showReceived: true,
    });

    expect(buildDefaultMajorDefensiveSpellIds(groups.major)).toEqual([116849]);
    expect(selectBySpellIds(groups.all, [116849])).toHaveLength(1);
  });
});

describe('defensive selection categories', () => {
  it('labels cast defensive groups as major, minor, or offensive', () => {
    const source = unit(10, 'Priest', 'Priest', 'Priest-Discipline');
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [
        cast(1000, 33206, source),
        cast(2000, 586, source),
        cast(3000, 114051, source),
      ],
      showMinor: true,
      showReceived: false,
    });

    expect(defensiveSelectionCategory(groups.major[0])).toBe('major');
    expect(
      defensiveSelectionCategory(
        groups.minor.find((selection) => selection.ability.guid === 586)!,
      ),
    ).toBe('minor');
    expect(
      defensiveSelectionCategory(
        groups.minor.find((selection) => selection.ability.guid === 114051)!,
      ),
    ).toBe('offensive');
  });

  it('labels Void Metamorphosis spelllike buffs as offensive', () => {
    const source = unit(10, 'Devourer', 'DemonHunter', 'DemonHunter-Devourer');
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [],
      buffEvents: [buff(1000, 1217607, source)],
      showMinor: true,
      showReceived: false,
    });

    expect(groups.minor).toHaveLength(1);
    expect(defensiveSelectionCategory(groups.minor[0])).toBe('offensive');
  });

  it('does not label defensive spelllike buffs as offensive', () => {
    const source = unit(10, 'Dwarf', 'Paladin', 'Paladin-Retribution');
    const groups = buildVisibleDefensiveSelectionGroups({
      castEventsBySource: [],
      buffEvents: [buff(1000, 65116, source)],
      showMinor: true,
      showReceived: false,
    });

    expect(groups.minor).toHaveLength(1);
    expect(defensiveSelectionCategory(groups.minor[0])).toBe('minor');
  });
});
