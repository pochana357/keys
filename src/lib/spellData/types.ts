export type EffectBuff = {
  type: 'buff';
  buffId: number;
  isStackable?: boolean;
};

export type EffectNonbuff = {
  type: 'extended';
  duration: number; // in milliseconds
};

export type DefensiveEffect = EffectBuff | EffectNonbuff;

export type DefensiveSpell = {
  selfCastOnly?: boolean;
  dpsOnly?: boolean;
  healOnly?: boolean;
  tankOnly?: boolean;
  nonTankOnly?: boolean;
  friendlyTargetOnly?: boolean;
  effect: DefensiveEffect[];
  minor?: boolean;
};

export type SpellDict = { [id: number]: DefensiveSpell };

export const defensiveBuff = (
  buffId: number,
  isStackable: boolean = false,
): EffectBuff => ({
  type: 'buff',
  buffId,
  isStackable,
});

export const defensiveExtended = (duration: number): EffectNonbuff => ({
  type: 'extended',
  duration,
});
