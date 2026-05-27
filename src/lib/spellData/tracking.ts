import {
  defensiveSpelllikeBuffs,
  defensiveSpells,
  offensiveSpelllikeBuffs,
  offensiveSpells,
  spelllikeDebuffs,
} from './registries';
import type { SpellDict } from './types';

export { defensiveSpelllikeBuffs, offensiveSpelllikeBuffs, spelllikeDebuffs };

export const castDict: SpellDict = { ...defensiveSpells };
for (const [id, val] of Object.entries(offensiveSpells)) {
  // All offensive spells are treated as if they were minor defensive spells.
  castDict[Number(id)] = { ...val, minor: true };
}

export const spelllikeBuffs: SpellDict = {
  ...defensiveSpelllikeBuffs,
  ...offensiveSpelllikeBuffs,
};

export const offensiveSpellIds = new Set(
  [
    ...Object.keys(offensiveSpells),
    ...Object.keys(offensiveSpelllikeBuffs),
  ].map((id) => Number(id)),
);

const castsTracked = new Set<number>(
  Object.keys(castDict).map((id) => Number(id)),
);
const buffsTracked = new Set<number>(
  Object.keys(spelllikeBuffs).map((id) => Number(id)),
);
for (const val of Object.values(castDict)) {
  for (const effect of val.effect) {
    if (effect.type === 'buff') buffsTracked.add(effect.buffId);
  }
}
const debuffsTracked = new Set<number>(
  Object.keys(spelllikeDebuffs).map((id) => Number(id)),
);

export const trackedIds = { castsTracked, buffsTracked, debuffsTracked };

export const castBlackList = {
  // Damage taken effects listed here are not tracked.
  damages: [
    1, // Melee
    455537, // Symbiosis
    32409, // Shadow Word: Death
  ],
  // The AoE heal casts *are* tracked, but their targets are not displayed.
  AoEHeals: [
    194509, // Power Word: Radiance
  ],
};
