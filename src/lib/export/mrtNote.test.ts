import { describe, expect, it } from 'vitest';
import {
  castDict,
  spelllikeBuffs,
  spelllikeDebuffs,
} from '$lib/spellData/tracking';
import type { Ability, UnitRaw } from '$lib/api/wclTypes';
import {
  attachDefensivesToDamage,
  buildMrtNote,
  buildMrtNoteModel,
  reduceDamageSelections,
  type DefensiveSelectionRowKind,
  type ExportDamageSelection,
  type ExportDefensiveSelection,
} from './mrtNote';
import { getSpellAbbreviation, spellAbbreviations } from './spellAbbreviations';

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

const damage = (
  key: string,
  timestamp: number,
  spellId = 123456,
  name = 'Massive Hit',
): ExportDamageSelection => ({
  key,
  timestamp,
  ability: ability(spellId, name),
  target: unit(1, 'Target', 'Priest', 'Priest-Discipline'),
});

const defensive = (
  key: string,
  timestamp: number,
  spellId: number,
  name: string,
  className: string,
  rowKind: DefensiveSelectionRowKind = 'major',
  target?: UnitRaw | null,
): ExportDefensiveSelection => ({
  key,
  timestamp,
  ability: ability(spellId, name),
  source: unit(2, 'Source', className),
  target: target === undefined ? unit(2, 'Source', className) : target,
  rowKind,
});

describe('MRT note export', () => {
  it('uses the Korean abbreviation for Pain Suppression', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'pain-suppression',
          83200,
          33206,
          'Pain Suppression',
          'Priest',
        ),
      ],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cffFFFFFF고억|r {spell:33206}',
    );
  });

  it('uses the Korean abbreviation for Divine Shield', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [defensive('divine-shield', 83100, 642, 'Divine Shield', 'Paladin')],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cffF48CBA무적|r {spell:642}',
    );
  });

  it('uses the Korean abbreviation for Blur', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [defensive('blur', 83100, 198589, 'Blur', 'DemonHunter')],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cffA330C9흐릿|r {spell:198589}',
    );
  });

  it('falls back to the Warcraft Logs name when no abbreviation is configured', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [defensive('unknown', 83100, 999999, 'Unknown Defensive', 'Warrior')],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cffC69B6DUnknown Defensive|r {spell:999999}',
    );
  });

  it('weaves defensives beyond the attach window as empty damage rows', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'pain-suppression',
          95001,
          33206,
          'Pain Suppression',
          'Priest',
        ),
      ],
      { referenceTime: 0, attachWindowMs: 10000 },
    );

    expect(note).toBe(
      [
        '{time:01:23} Hit#1 {spell:123456}',
        '{time:01:35} - |cffFFFFFF고억|r {spell:33206}',
      ].join('\n'),
    );
  });

  it('sorts unassigned defensive rows into the same chronological list', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'early-pain-suppression',
          70000,
          33206,
          'Pain Suppression',
          'Priest',
        ),
        defensive('blur', 83100, 198589, 'Blur', 'DemonHunter'),
      ],
      { referenceTime: 0, attachWindowMs: 10000 },
    );

    expect(note).toBe(
      [
        '{time:01:10} - |cffFFFFFF고억|r {spell:33206}',
        '{time:01:23} Hit#1 {spell:123456} - |cffA330C9흐릿|r {spell:198589}',
      ].join('\n'),
    );
  });

  it('sorts multiple attached defensives by timestamp', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive('divine-shield', 84000, 642, 'Divine Shield', 'Paladin'),
        defensive(
          'pain-suppression',
          83100,
          33206,
          'Pain Suppression',
          'Priest',
        ),
      ],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cffFFFFFF고억|r {spell:33206} |cffF48CBA무적|r {spell:642}',
    );
  });

  it('renders Life Cocoon target role labels for healer and tank targets', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'cocoon-healer',
          83100,
          116849,
          'Life Cocoon',
          'Monk',
          'major',
          unit(10, 'Healer', 'Priest', 'Priest-Discipline'),
        ),
        defensive(
          'cocoon-tank',
          83200,
          116849,
          'Life Cocoon',
          'Monk',
          'major',
          unit(11, 'Tank', 'Warrior', 'Warrior-Protection'),
        ),
      ],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cff00FF98고치▶힐|r {spell:116849} |cff00FF98고치▶탱|r {spell:116849}',
    );
  });

  it('renders Life Cocoon target spec labels for configured DPS specs', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'cocoon-evoker',
          83100,
          116849,
          'Life Cocoon',
          'Monk',
          'major',
          unit(10, 'Evoker', 'Evoker', 'Evoker-Augmentation'),
        ),
      ],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cff00FF98고치▶용|r {spell:116849}',
    );
  });

  it('omits the Life Cocoon target label when no target abbreviation exists', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'cocoon-unknown',
          83100,
          116849,
          'Life Cocoon',
          'Monk',
          'major',
          unit(10, 'Unknown', 'Mage', 'Mage-Unknown'),
        ),
      ],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cff00FF98고치|r {spell:116849}',
    );
  });

  it('omits the Life Cocoon target label for self-casts', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [defensive('cocoon-self', 83100, 116849, 'Life Cocoon', 'Monk')],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cff00FF98고치|r {spell:116849}',
    );
  });

  it('uses English abbreviations when requested', () => {
    const note = buildMrtNote(
      [damage('damage', 83000)],
      [
        defensive(
          'pain-suppression',
          83100,
          33206,
          'Pain Suppression',
          'Priest',
        ),
        defensive('divine-shield', 83200, 642, 'Divine Shield', 'Paladin'),
        defensive('blur', 83300, 198589, 'Blur', 'DemonHunter'),
      ],
      { referenceTime: 0, language: 'en' },
    );

    expect(note).toBe(
      '{time:01:23} Hit#1 {spell:123456} - |cffFFFFFFPS|r {spell:33206} |cffF48CBABubble|r {spell:642} |cffA330C9Blur|r {spell:198589}',
    );
  });

  it('wraps boss pull notes with an encounter marker', () => {
    const note = buildMrtNote([damage('damage', 83000)], [], {
      referenceTime: 0,
      encounterId: 3009,
    });

    expect(note).toBe(
      ['{e:3009}', '{time:01:23} Hit#1 {spell:123456}', '{/e}'].join('\n'),
    );
  });

  it('numbers exported damage events by spell in chronological order', () => {
    const note = buildMrtNote(
      [
        damage('dash-1', 26000, 1280067, 'Phase Dash'),
        damage('overload-1', 36000, 1263523, 'Overload'),
        damage('dash-2', 64000, 1280067, 'Dash'),
        damage('overload-2', 112000, 1263523, 'Overload'),
        damage('dash-3', 140000, 1280067, 'Dash'),
      ],
      [],
      { referenceTime: 0 },
    );

    expect(note).toBe(
      [
        '{time:00:26} Dash#1 {spell:1280067}',
        '{time:00:36} Overload#1 {spell:1263523}',
        '{time:01:04} Dash#2 {spell:1280067}',
        '{time:01:52} Overload#2 {spell:1263523}',
        '{time:02:20} Dash#3 {spell:1280067}',
      ].join('\n'),
    );
  });

  it('attaches Saprish AMS before 1:14 Overload to the closer Overload row', () => {
    const note = buildMrtNote(
      [
        damage('dash-2', 2672369, 1280067, 'Phase Dash'),
        damage('overload-2', 2682298, 1263523, 'Overload'),
      ],
      [defensive('ams-2', 2679914, 48707, 'Anti-Magic Shell', 'DeathKnight')],
      { referenceTime: 2608263 },
    );

    expect(note).toBe(
      [
        '{time:01:04} Dash#1 {spell:1280067}',
        '{time:01:14} Overload#1 {spell:1263523} - |cffC41E3A대마보|r {spell:48707}',
      ].join('\n'),
    );
  });

  it('exports close repeated damage groups at the first instance only', () => {
    const damages = [
      damage('pulse-1', 1308000, 1263000, 'Festering Pulse'),
      damage('pulse-2', 1308100, 1263000, 'Festering Pulse'),
      damage('pulse-3', 1310000, 1263000, 'Festering Pulse'),
      damage('pulse-4', 1312000, 1263000, 'Festering Pulse'),
    ];

    expect(
      reduceDamageSelections(damages, 3000).map((selection) => selection.key),
    ).toEqual(['pulse-1']);
    expect(
      buildMrtNote(damages, [], {
        referenceTime: 0,
        damageGroupIntervalMs: 3000,
      }),
    ).toBe('{time:21:48} Pulse#1 {spell:1263000}');
  });

  it('keeps the note model reproducible from selected icon sets and config', () => {
    const damages = [
      damage('pulse-1', 1308000, 1263000, 'Festering Pulse'),
      damage('pulse-2', 1310000, 1263000, 'Festering Pulse'),
    ];
    const defensives = [
      defensive(
        'pain-suppression',
        1308500,
        33206,
        'Pain Suppression',
        'Priest',
      ),
    ];
    const config = {
      referenceTime: 0,
      attachWindowMs: 10000,
      damageGroupIntervalMs: 3000,
      language: 'ko' as const,
      encounterId: 3009,
    };

    expect(buildMrtNoteModel(damages, defensives, config)).toEqual(
      buildMrtNoteModel(damages, defensives, config),
    );
    expect(buildMrtNote(damages, defensives, config)).toBe(
      [
        '{e:3009}',
        '{time:21:48} Pulse#1 {spell:1263000} - |cffFFFFFF고억|r {spell:33206}',
        '{/e}',
      ].join('\n'),
    );
  });
});

describe('defensive attachment', () => {
  it('attaches to the nearest selected damage event', () => {
    const attached = attachDefensivesToDamage(
      [damage('early', 80000), damage('late', 90000)],
      [defensive('blur', 87500, 198589, 'Blur', 'DemonHunter')],
      { attachWindowMs: 10000 },
    );

    expect(attached.damageGroups[0].defensives).toHaveLength(0);
    expect(
      attached.damageGroups[1].defensives.map((event) => event.key),
    ).toEqual(['blur']);
  });

  it('honors the max-distance cutoff', () => {
    const attached = attachDefensivesToDamage(
      [damage('damage', 80000)],
      [defensive('blur', 91000, 198589, 'Blur', 'DemonHunter')],
      { attachWindowMs: 10000 },
    );

    expect(attached.damageGroups[0].defensives).toHaveLength(0);
    expect(attached.unassignedDefensives.map((event) => event.key)).toEqual([
      'blur',
    ]);
  });

  it('breaks equal-distance ties by earlier damage timestamp', () => {
    const attached = attachDefensivesToDamage(
      [damage('early', 10000), damage('late', 12000)],
      [defensive('blur', 11000, 198589, 'Blur', 'DemonHunter')],
      { attachWindowMs: 10000 },
    );

    expect(attached.damageGroups[0].damage.key).toBe('early');
    expect(
      attached.damageGroups[0].defensives.map((event) => event.key),
    ).toEqual(['blur']);
    expect(attached.damageGroups[1].defensives).toHaveLength(0);
  });
});

describe('Korean defensive abbreviations', () => {
  it('keeps configured abbreviations non-empty and trimmed', () => {
    for (const abbreviation of Object.values(spellAbbreviations.ko)) {
      expect(abbreviation).toBe(abbreviation.trim());
      expect(abbreviation.length).toBeGreaterThan(0);
    }
  });

  it('uses the requested Korean defensive labels', () => {
    expect(spellAbbreviations.ko[48707]).toBe('대마보');
    expect(spellAbbreviations.ko[51052]).toBe('대마지');
    expect(spellAbbreviations.ko[108271]).toBe('영혼이동');
    expect(spellAbbreviations.ko[108280]).toBe('치해토');
    expect(spellAbbreviations.ko[108285]).toBe('토귀');
    expect(spellAbbreviations.ko[115203]).toBe('강화주');
    expect(spellAbbreviations.ko[1234768]).toBe('HP물약');
    expect(spellAbbreviations.ko[1236648]).toBe('마나물약');
    expect(spellAbbreviations.ko[1239479]).toBe('마나물약');
    expect(spellAbbreviations.ko[185311]).toBe('약병');
    expect(spellAbbreviations.ko[198103]).toBe('대정');
    expect(spellAbbreviations.ko[202168]).toBe('예승');
    expect(spellAbbreviations.ko[204018]).toBe('주수축');
    expect(spellAbbreviations.ko[212084]).toBe('황폐');
    expect(spellAbbreviations.ko[235313]).toBe('보막');
    expect(spellAbbreviations.ko[272679]).toBe('곰인');
    expect(spellAbbreviations.ko[363916]).toBe('비늘');
    expect(spellAbbreviations.ko[374227]).toBe('미풍');
    expect(spellAbbreviations.ko[375576]).toBe('천종');
  });
});

describe('defensive abbreviations', () => {
  it('looks up seeded English abbreviations', () => {
    expect(getSpellAbbreviation(ability(33206, 'Pain Suppression'), 'en')).toBe(
      'PS',
    );
    expect(getSpellAbbreviation(ability(642, 'Divine Shield'), 'en')).toBe(
      'Bubble',
    );
    expect(getSpellAbbreviation(ability(198589, 'Blur'), 'en')).toBe('Blur');
  });

  it('falls back to the Warcraft Logs name when no abbreviation exists', () => {
    expect(
      getSpellAbbreviation(ability(999999, 'Unknown Defensive'), 'ko'),
    ).toBe('Unknown Defensive');
  });

  it('has draft abbreviations for all tracked major spells', () => {
    const majorSpellIds = [
      ...Object.entries(castDict)
        .filter(([_id, spell]) => !spell.minor)
        .map(([id]) => Number(id)),
      ...Object.keys(spelllikeBuffs).map(Number),
      ...Object.keys(spelllikeDebuffs).map(Number),
    ];

    expect(majorSpellIds.filter((id) => !spellAbbreviations.ko[id])).toEqual(
      [],
    );
    expect(majorSpellIds.filter((id) => !spellAbbreviations.en[id])).toEqual(
      [],
    );
  });
});
