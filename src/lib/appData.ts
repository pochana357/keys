type EffectBuff = {
	type: 'buff';
	buffId: number;
	isStackable?: boolean;
};
type EffectNonbuff = {
	type: 'extended';
	duration: number; // in milliseconds
};
type DefensiveEffect = EffectBuff | EffectNonbuff;
type DefensiveSpell = {
	selfCastOnly?: boolean;
	dpsOnly?: boolean;
	effect: DefensiveEffect[];
	minor?: boolean;
};
const defensiveBuff = (buffId: number, isStackable: boolean = false): EffectBuff => ({
	type: 'buff',
	buffId,
	isStackable
});
const defensiveExtended = (duration: number): EffectNonbuff => ({
	type: 'extended',
	duration
});
type SpellDict = { [id: number]: DefensiveSpell };

const offensiveSpells: SpellDict = {
	// The buffs procced by offensive spells are not tracked.
	// Shaman
	114051: { effect: [] }, // Ascendance (enhancement)
	114050: { effect: [] }, // Ascendance (elemental)

	// Mage
	12472: { effect: [] }, // Icy Veins

	// Paladin
	454373: { effect: [] }, // Crusade

	// Druid
	102560: { effect: [] }, // Incarnation: Chosen of Elune

	// Rogue
	385627: { effect: [] }, // Kingsbane
	360194: { effect: [] }, // Deathmark

	// Death Knight
	152279: { effect: [] }, // Breath of Sindragosa
	51271: { effect: [] }, // Pillar of Frost
	63560: { effect: [] }, // Dark Transformation
	455395: { effect: [] }, // Raise Abomination

	// Trinkets
	444959: { effect: [] }, // Spymaster's Web
	449946: { effect: [] } // Cryptic Instruction (Treacherous Transmitter)
	// 443407: { effect: [] }, // Skarmorak Shard
	// 91374: { effect: [] }, // Battle of Prowess (Mark of Khardros)
	// 92099: { effect: [] } // Speed of Thought (Skardin's Grace)
};

const defensiveSpells: SpellDict = {
	// Priest
	8092: { effect: [defensiveBuff(450193)] }, // Mind Blast (Entropic Rift)
	19236: { effect: [defensiveBuff(19236)] }, // Desperate Player
	586: { effect: [defensiveBuff(586)], minor: true }, // Fade
	62618: { effect: [defensiveBuff(81782)] }, // Power Word: Barrier
	33206: { effect: [defensiveBuff(33206)] }, // Pain Suppression
	451235: { effect: [defensiveBuff(322105)] }, // Voidwrath (Shadow Covenant)
	47536: { effect: [defensiveBuff(47536, true)] }, // Rature (ApplyBuff & RemoveBuffStack events)
	17: { effect: [defensiveBuff(17)], minor: true }, // Power Word: Shield
	2061: { effect: [defensiveBuff(193065)], minor: true }, // Flash Heal (Protective Light)
	194509: { effect: [] }, // Power Word: Radiance
	32375: { effect: [] }, // Mass Dispel

	// Shaman
	108281: { effect: [defensiveBuff(108281)] }, // Ancestral Guidance
	108271: { effect: [defensiveBuff(108271)] }, // Astral Shift

	108270: { effect: [defensiveBuff(114893)] }, // Stone Bulwark Totem (Stone Bulwark)
	// 114893 is the initial big shield and 462844 is small shields generated periodically.

	198103: { effect: [defensiveBuff(381755)] }, // Earth Elemental (Earth Elemental); there is also a buff named Primordial Bond (381761)
	2645: { effect: [defensiveBuff(260881, true)] }, // Ghost Wolf (SpiritWolf)
	8004: { dpsOnly: true, effect: [] }, // Healing Surge
	57994: {
		dpsOnly: true,
		effect: [355702, 355703, 355704, 355705, 355706, 355634].map((id) => defensiveBuff(id, true)),
		minor: true
	}, // Wind Shear (Seasoned Winds)
	// 355702: Fire
	// 355703: Holy
	// 355704: Nature
	// 355705: Shadow
	// 355706: Arcane
	// 355634: Frost
	// 355704, 355705: https://www.warcraftlogs.com/reports/4KxdFT6pVYLfy7r2#fight=2&type=auras&source=1

	108280: { effect: [defensiveBuff(108280)] }, // Healing Tide Totem
	98008: { effect: [defensiveBuff(325174)] }, // Spirit Link Totem
	114052: { effect: [defensiveBuff(114052)] }, // Ascendance (restoration shaman); the enhancement version is 114051 and the elemental 114050.
	5394: { effect: [defensiveExtended(15000)] }, // Healing Stream Totem

	// Evoker
	374227: { effect: [defensiveBuff(374227)] }, // Zephyr
	370665: { effect: [defensiveBuff(370889)] }, // Rescue (Twin Guardian)
	406732: { effect: [defensiveBuff(406732), defensiveBuff(406789)] }, // Spatial Paradox (separate buffs for the source and the target)
	363916: { effect: [defensiveBuff(363916)] }, // Obsidian Scale
	374348: { effect: [defensiveBuff(374348)] }, // Renewing Blaze
	374251: { effect: [] }, // Cauterizing Flame
	442204: { effect: [defensiveBuff(409678)], minor: true }, // Breath of Eons (Chrono Ward)

	// Death Knight
	48707: { effect: [defensiveBuff(48707)] }, // Anti-Magic Shell
	49039: { effect: [defensiveBuff(49039)] }, // Lichborne
	48792: { effect: [defensiveBuff(48792)] }, // Icebound Fortitude
	51052: { effect: [defensiveBuff(145629)] }, // Anti-Magic Zone

	// Rogue
	1966: { effect: [defensiveBuff(1966)] }, // Feint
	5277: { effect: [defensiveBuff(5277)] }, // Evasion
	31224: { effect: [defensiveBuff(31224)] }, // Cloak of Shadows
	185311: { effect: [defensiveBuff(185311)] }, // Crimson Vial

	// Mage
	342245: { effect: [defensiveBuff(342246)] }, // Alter Time
	55342: { effect: [defensiveBuff(55342)] }, // Mirror Image

	110960: { effect: [defensiveBuff(113862)] }, // Greater Invisibility
	// The buff 110960 tracks the stealth; 113862 tracks the DR part (during the stealth & 3s afterward).

	45438: { effect: [defensiveBuff(45438)] }, // Ice Block
	414658: { effect: [defensiveBuff(414658)] }, // Ice cold
	414660: { effect: [defensiveBuff(11426)] }, // Mass Barrier (Ice Barrier); the buff for the mass barrier is the same as the normal one.
	11426: { effect: [defensiveBuff(11426)] }, // Ice Barrier

	// Paladin
	204018: { effect: [defensiveBuff(204018)] }, // Blessing of Spellwarding
	6940: { effect: [defensiveBuff(6940)] }, // Blessing of Sacrifice
	1022: { effect: [defensiveBuff(1022)] }, // Blessing of Protection

	432459: { effect: [defensiveBuff(432496), defensiveBuff(432607)] }, // Holy Bulwark
	// (432496 is the 20s buff merely showing that the buff is up and
	// 432607 is the shield buff that constantly refreshes every 2 seconds and fades if the shield is consumed.)

	432472: { effect: [defensiveBuff(432502)] }, // Sacred Weapon; not a defensive per se but it triggers Tempered in Battle
	642: { effect: [defensiveBuff(642)] }, // Divine Shield
	387174: { effect: [defensiveExtended(6000)] }, // Eye of Tyr
	86659: { effect: [defensiveBuff(86659)] }, // Guardian of Ancient Kings
	31850: { effect: [defensiveBuff(31850)] }, // Ardent Defender
	31884: { effect: [defensiveBuff(31884)] }, // Avenging Wrath
	471195: { effect: [defensiveBuff(387792)] }, // Lay on Hands (Empyreal Ward)
	375576: { effect: [] }, // Divine Toll

	403876: { effect: [defensiveBuff(403876)] }, // Divine Protection
	184662: { effect: [defensiveBuff(184662)] }, // Shield of Vengeance
	85673: { dpsOnly: true, effect: [] }, // Word of Glory

	// Druid
	5487: { effect: [defensiveBuff(5487)] }, // Bear Form
	22812: { effect: [defensiveBuff(22812)] }, // Barkskin
	108238: { effect: [] }, // Renewal
	124974: { effect: [defensiveBuff(124974)] }, // Nature's Vigil
	12: { selfCastOnly: true, effect: [defensiveBuff(400126)] }, // Regrowth (Forestwalk)

	// General
	431416: { effect: [] }, // Algari Healing Potion
	452767: { effect: [] }, // Heartseeking Health Injector

	// Trinkets
	444301: { effect: [defensiveBuff(444301)] }, // Ravenous Swarm (444301 is the 3s buff; 447134 is the buff that tracks the shield amount)

	// Necrotic Wake
	328404: { effect: [defensiveExtended(8000)] }, // Discharged Anima; the spell 328406 is the perodic casts every 1 second when the anima is used.
	328050: { effect: [defensiveBuff(328050)] } // Discarded Shield
};
export const castDict: SpellDict = { ...defensiveSpells };
for (const [id, val] of Object.entries(offensiveSpells)) {
	// All offensive spells are treated as if they were minor defensive spells.
	castDict[Number(id)] = { ...val, minor: true };
}

export const spelllikeBuffs = {
	457533: { effect: [defensiveBuff(457533)] }, // Evasive Maneuvers (Cloak proc)
	65116: { effect: [defensiveBuff(65116)] } // Stoneform; its casts are missing in the logs.
};
export const spelllikeDebuffs = {
	// Paladin
	393879: { effect: [defensiveBuff(86659)] } // Gift of the Golden Val'kyr
};

const castsTracked = new Set<number>(Object.keys(castDict).map((id) => Number(id)));
const buffsTracked = new Set<number>(Object.keys(spelllikeBuffs).map((id) => Number(id)));
for (const val of Object.values(castDict)) {
	for (const effect of val.effect) {
		if (effect.type === 'buff') buffsTracked.add(effect.buffId);
	}
}
const debuffsTracked = new Set<number>(Object.keys(spelllikeDebuffs).map((id) => Number(id)));

export const trackedIds = { castsTracked, buffsTracked, debuffsTracked };

export const castBlackList = {
	// Damage taken effects listed here are not tracked.
	damages: [
		1, // Melee
		455537, // Symbiosis
		32409 // Shadow Word: Death
	],
	// The AoE heal casts *are* tracked, but their targets are not displayed.
	AoEHeals: [
		194509 // Power Word: Radiance
	]
};

// encounterID: https://wago.tools/db2/DungeonEncounter?page=1
