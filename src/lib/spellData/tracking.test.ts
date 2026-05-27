import { describe, expect, it } from 'vitest';
import {
  castDict,
  defensiveSpelllikeBuffs,
  offensiveSpellIds,
  offensiveSpelllikeBuffs,
  spelllikeBuffs,
  trackedIds,
} from './tracking';

describe('spell data tracking exports', () => {
  it('includes offensive casts in castDict as minor spells', () => {
    expect(castDict[114051]?.minor).toBe(true);
    expect(castDict[114051]?.effect).toEqual([]);
  });

  it('merges defensive and offensive spelllike buffs', () => {
    expect(spelllikeBuffs[65116]).toBe(defensiveSpelllikeBuffs[65116]);
    expect(spelllikeBuffs[1217607]).toBe(offensiveSpelllikeBuffs[1217607]);
  });

  it('classifies offensive spell ids from casts and spelllike buffs', () => {
    expect(offensiveSpellIds.has(114051)).toBe(true);
    expect(offensiveSpellIds.has(1217607)).toBe(true);
    expect(offensiveSpellIds.has(65116)).toBe(false);
  });

  it('tracks spelllike buffs and buff effects from casts', () => {
    expect(trackedIds.buffsTracked.has(1217607)).toBe(true);
    expect(trackedIds.buffsTracked.has(65116)).toBe(true);
    expect(trackedIds.buffsTracked.has(33206)).toBe(true);
  });
});
