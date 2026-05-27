import { describe, expect, it } from 'vitest';
import type { Ability, DamageTakenEvent, UnitRaw } from './wclTypes';
import EventsLumped from './EventsLumped.svelte';

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

const enemy = unit(100, 'Enemy', 'NPC', 'NPC');

const damageTaken = (timestamp: number, target: UnitRaw): DamageTakenEvent => ({
  timestamp,
  type: 'damage',
  sourceID: enemy.id,
  sourceIsFriendly: 0,
  targetID: target.id,
  targetIsFriendly: 1,
  ability: ability(123456, 'Hit'),
  buffs: '',
  hitType: 1,
  amount: 1,
  absorbed: 0,
  versatility: 0,
  avoidance: 0,
  source: enemy,
  target,
});

describe('EventsLumped player ordering', () => {
  it('orders timeline players healer, DPS by class abbreviation, then tank', () => {
    const healer = unit(1, 'Healer', 'Priest', 'Priest-Discipline');
    const demonHunter = unit(
      2,
      'Demon Hunter',
      'DemonHunter',
      'DemonHunter-Havoc',
    );
    const deathKnight = unit(
      3,
      'Death Knight',
      'DeathKnight',
      'DeathKnight-Frost',
    );
    const evoker = unit(4, 'Evoker', 'Evoker', 'Evoker-Augmentation');
    const tank = unit(5, 'Tank', 'Warrior', 'Warrior-Protection');

    const events = new EventsLumped([
      damageTaken(1000, tank),
      damageTaken(2000, evoker),
      damageTaken(3000, deathKnight),
      damageTaken(4000, healer),
      damageTaken(5000, demonHunter),
    ]);

    expect(events.players.map((player) => player.name)).toEqual([
      'Healer',
      'Demon Hunter',
      'Death Knight',
      'Evoker',
      'Tank',
    ]);
  });
});
