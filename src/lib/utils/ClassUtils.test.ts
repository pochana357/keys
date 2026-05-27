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

describe('ClassUtils Devourer support', () => {
  it('recognizes Devourer Demon Hunter as DPS', () => {
    const devourer = unit('DemonHunter-Devourer');

    expect(ClassUtils.role(devourer)).toBe(ORole.dps);
    expect(ClassUtils.isDps(devourer)).toBe(true);
    expect(ClassUtils.isTank(devourer)).toBe(false);
    expect(ClassUtils.isHeal(devourer)).toBe(false);
  });
});
