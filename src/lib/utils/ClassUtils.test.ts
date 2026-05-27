import { describe, expect, it } from 'vitest';
import type { UnitRaw } from '$lib/api/wclTypes';
import ClassUtils, { ORole } from './ClassUtils';

const unit = (icon: string): UnitRaw => ({
  id: 1,
  guid: 1,
  name: 'Devourer',
  type: 'DemonHunter',
  icon,
});

const player = (
  id: number,
  name: string,
  type: string,
  icon: string,
): UnitRaw => ({
  id,
  guid: id + 1000,
  name,
  type,
  icon,
});

describe('ClassUtils Devourer support', () => {
  it('recognizes Devourer Demon Hunter as DPS', () => {
    const devourer = unit('DemonHunter-Devourer');

    expect(ClassUtils.role(devourer)).toBe(ORole.dps);
    expect(ClassUtils.isDps(devourer)).toBe(true);
    expect(ClassUtils.isTank(devourer)).toBe(false);
    expect(ClassUtils.isHeal(devourer)).toBe(false);
  });
});

describe('ClassUtils player ordering', () => {
  it('sorts healer first, DPS by class abbreviation, and tank last', () => {
    const healer = player(1, 'Healer', 'Priest', 'Priest-Discipline');
    const demonHunter = player(
      2,
      'Demon Hunter',
      'DemonHunter',
      'DemonHunter-Havoc',
    );
    const deathKnight = player(
      3,
      'Death Knight',
      'DeathKnight',
      'DeathKnight-Frost',
    );
    const evoker = player(4, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const tank = player(5, 'Tank', 'Warrior', 'Warrior-Protection');

    expect(
      [tank, evoker, deathKnight, healer, demonHunter]
        .toSorted(ClassUtils.comparePlayerOrder)
        .map((sortedPlayer) => sortedPlayer.name),
    ).toEqual(['Healer', 'Demon Hunter', 'Death Knight', 'Evoker', 'Tank']);
  });
});
