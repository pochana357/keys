import type { UnitRaw } from '$lib/api/wclTypes';
import ClassUtils, { ORole } from '$lib/utils/ClassUtils';
import type { ExportLanguage } from './spellAbbreviations';

export const targetRoleAbbreviations: Record<
  ExportLanguage,
  Partial<Record<(typeof ORole)[keyof typeof ORole], string>>
> = {
  ko: {
    [ORole.tank]: '탱',
    [ORole.heal]: '힐',
  },
  en: {
    [ORole.tank]: 'Tank',
    [ORole.heal]: 'Healer',
  },
};

export const targetSpecAbbreviations: Record<
  ExportLanguage,
  Record<string, string>
> = {
  ko: {
    'DeathKnight-Frost': '죽',
    'DeathKnight-Unholy': '죽',
    'DemonHunter-Devourer': '포식',
    'DemonHunter-Havoc': '악',
    'Druid-Balance': '조드',
    'Druid-Feral': '야드',
    Evoker: '용',
    'Evoker-Augmentation': '용',
    'Evoker-Devastation': '용',
    'Hunter-BeastMastery': '냥',
    'Hunter-Marksmanship': '냥',
    'Hunter-Survival': '냥',
    'Mage-Arcane': '법',
    'Mage-Fire': '법',
    'Mage-Frost': '법',
    'Monk-Windwalker': '풍',
    'Paladin-Retribution': '징',
    'Priest-Shadow': '암',
    'Rogue-Assassination': '도',
    'Rogue-Outlaw': '도',
    'Rogue-Subtlety': '도',
    'Shaman-Elemental': '술',
    'Shaman-Enhancement': '술',
    'Warlock-Affliction': '흑',
    'Warlock-Demonology': '흑',
    'Warlock-Destruction': '흑',
    'Warrior-Arms': '전',
    'Warrior-Fury': '전',
  },
  en: {
    'DeathKnight-Frost': 'DK',
    'DeathKnight-Unholy': 'DK',
    'DemonHunter-Devourer': 'DH',
    'DemonHunter-Havoc': 'DH',
    'Druid-Balance': 'Drd',
    'Druid-Feral': 'Drd',
    Evoker: 'Evok',
    'Evoker-Augmentation': 'Aug',
    'Evoker-Devastation': 'Evok',
    'Hunter-BeastMastery': 'BM',
    'Hunter-Marksmanship': 'MM',
    'Hunter-Survival': 'Surv',
    'Mage-Arcane': 'Mage',
    'Mage-Fire': 'Mage',
    'Mage-Frost': 'Mage',
    'Monk-Windwalker': 'WW',
    'Paladin-Retribution': 'Ret',
    'Priest-Shadow': 'Rog',
    'Rogue-Assassination': 'Rog',
    'Rogue-Outlaw': 'Rog',
    'Rogue-Subtlety': 'Sub',
    'Shaman-Elemental': 'Ele',
    'Shaman-Enhancement': 'Enh',
    'Warlock-Affliction': 'Wrlk',
    'Warlock-Demonology': 'Wrlk',
    'Warlock-Destruction': 'Wrlk',
    'Warrior-Arms': 'Warr',
    'Warrior-Fury': 'Warr',
  },
};

export function getTargetAbbreviation(
  unit: UnitRaw | null | undefined,
  language: ExportLanguage,
) {
  if (!unit) return '';

  const role = ClassUtils.role(unit);
  if (role === ORole.tank || role === ORole.heal) {
    return targetRoleAbbreviations[language][role] ?? '';
  }

  return targetSpecAbbreviations[language][unit.icon] ?? '';
}

export function isSameUnit(
  a: UnitRaw | null | undefined,
  b: UnitRaw | null | undefined,
) {
  return a !== null && a !== undefined && b !== null && b !== undefined
    ? a.id === b.id
    : false;
}
