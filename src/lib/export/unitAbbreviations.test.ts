import { describe, expect, it } from 'vitest';
import type { UnitRaw } from '$lib/api/wclTypes';
import { getTargetAbbreviation } from './unitAbbreviations';

const unit = (icon: string): UnitRaw => ({
  id: 1,
  guid: 1,
  name: 'Devourer',
  type: 'DemonHunter',
  icon,
});

describe('target abbreviations', () => {
  it('labels Devourer Demon Hunter targets', () => {
    const devourer = unit('DemonHunter-Devourer');

    expect(getTargetAbbreviation(devourer, 'ko')).toBe('포식');
    expect(getTargetAbbreviation(devourer, 'en')).toBe('DH');
  });
});
