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
	healOnly?: boolean;
	tankOnly?: boolean;
	friendlyTargetOnly?: boolean;
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
	469270: { effect: [] }, // Doom Wind

	114050: { effect: [] }, // Ascendance (elemental)
	192249: { effect: [] }, // Storm Elemental

	// Mage
	12472: { effect: [] }, // Icy Veins
	190319: { effect: [] }, // Combustion

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

	455395: { effect: [] }, // Raise Abomination
	63560: { effect: [] }, // Dark Transformation
	207289: { effect: [] }, // Unholy Assault

	// Demon Hunter
	370965: { effect: [] }, // The Hunt
	198013: { effect: [] }, // Eye Beam
	200166: { effect: [] }, // Metamorphosis (Havoc)

	// Priest
	120644: { effect: [] }, // Halo
	34433: { effect: [] }, // Shadowfiend
	391109: { effect: [] }, // Dark Ascension
	228260: { effect: [] }, // Void Eruption

	// Monk
	123904: { effect: [] }, // Invoke Xuen, the White Tiger
	137639: { effect: [] }, // Storm, Earth, and Fire

	// Warlock
	1122: { effect: [] }, // Summon Infernal
	205180: { effect: [] }, // Summon Darkglare

	// Trinkets and cantrip effects
	// 444959: { effect: [] }, // Spymaster's Web
	// 449946: { effect: [] } // Cryptic Instruction (Treacherous Transmitter)
	// 443407: { effect: [] }, // Skarmorak Shard
	// 91374: { effect: [] }, // Battle of Prowess (Mark of Khardros)
	// 92099: { effect: [] } // Speed of Thought (Skardin's Grace)
	300142: { effect: [] }, // Hyperthread Wristwraps
	431932: { effect: [] }, // Tempered Potion
	443531: { effect: [] }, // Bolstering Light
	466681: { effect: [] }, // House of Cards
	345228: { effect: [] }, // Gladiator's Badge
	443536: { effect: [] } // Bursting Lightshard
};

const defensiveSpells: SpellDict = {
	// Priest
	8092: { effect: [defensiveBuff(450193)], healOnly: true }, // Mind Blast (Entropic Rift)
	19236: { effect: [defensiveBuff(19236)] }, // Desperate Player
	586: { effect: [defensiveBuff(586)], minor: true }, // Fade
	62618: { effect: [defensiveBuff(81782)] }, // Power Word: Barrier
	33206: { effect: [defensiveBuff(33206)] }, // Pain Suppression
	451235: { effect: [defensiveBuff(322105)] }, // Voidwrath (Shadow Covenant)
	47536: { effect: [defensiveBuff(47536, true)] }, // Rature (ApplyBuff & RemoveBuffStack events)
	17: { effect: [defensiveBuff(17)], minor: true }, // Power Word: Shield
	2061: { effect: [defensiveBuff(193065)], minor: true }, // Flash Heal (Protective Light)
	194509: { effect: [], minor: true }, // Power Word: Radiance
	32375: { effect: [] }, // Mass Dispel
	428933: { effect: [] }, // Premonition of Insight
	428930: { effect: [] }, // Premonition of Piety
	428934: { effect: [defensiveBuff(443526)] }, // Premonition of Solace (Premonition of Solace)
	440725: { effect: [defensiveBuff(443526)] }, // Premonition of Clairvoyane (Premonition of Solace)
	421453: { effect: [defensiveBuff(421453)] }, // Ultimate Penitence
	47540: { effect: [], friendlyTargetOnly: true, minor: true }, // Penance

	15286: { effect: [] }, // Vampiric Embrace
	47585: { effect: [defensiveBuff(47585)] }, // Dispersion

	// Shaman
	108281: { effect: [defensiveBuff(108281)] }, // Ancestral Guidance
	108271: { effect: [defensiveBuff(108271)] }, // Astral Shift

	108270: { effect: [defensiveBuff(114893)] }, // Stone Bulwark Totem (Stone Bulwark)
	// 114893 is the initial big shield and 462844 is small shields generated periodically.

	198103: { effect: [defensiveBuff(381755)] }, // Earth Elemental (Earth Elemental); there is also a buff named Primordial Bond (381761)
	2645: { effect: [defensiveBuff(260881, true)] }, // Ghost Wolf (SpiritWolf)
	8004: { dpsOnly: true, effect: [] }, // Healing Surge
	57994: {
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
	358267: { effect: [defensiveBuff(358267)], minor: true }, // Hover

	// Demon Hunter
	203720: { effect: [defensiveBuff(203819)], minor: true }, // Demon Spikes
	212084: { effect: [defensiveBuff(187827)] }, // Fel Devastation
	204021: { effect: [] }, // Fiery Brand
	187827: { effect: [defensiveBuff(187827)] }, // Metamorphosis (Vengeance)

	198589: { effect: [defensiveBuff(212800)] }, // Blur
	196555: { effect: [defensiveBuff(196555)] }, // Netherwalk

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
	212653: { effect: [defensiveBuff(382290)], minor: true }, // Shimmer (Tempest Barrier)

	110960: { effect: [defensiveBuff(113862)] }, // Greater Invisibility
	// The buff 110960 tracks the stealth; 113862 tracks the DR part (during the stealth & 3s afterward).

	45438: { effect: [defensiveBuff(45438)] }, // Ice Block
	414658: { effect: [defensiveBuff(414658)] }, // Ice cold

	414660: { effect: [defensiveBuff(11426), defensiveBuff(414662)] }, // Mass Barrier (Ice Barrier, Blazing Barrier)
	235313: { effect: [defensiveBuff(235313)] }, // Blazing Barrier
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
	5487: { effect: [defensiveBuff(5487), defensiveBuff(393903)] }, // Bear Form (Bear Form, Ursine Vigor)
	22812: { effect: [defensiveBuff(22812)] }, // Barkskin
	108238: { effect: [] }, // Renewal
	124974: { effect: [defensiveBuff(124974)] }, // Nature's Vigil
	12: { selfCastOnly: true, effect: [defensiveBuff(400126), defensiveBuff(433749)] }, // Regrowth (Forestwalk, Protective Growth)

	// Monk
	122783: { effect: [defensiveBuff(122783)] }, // Diffuse Magic
	115203: { effect: [defensiveBuff(120954)] }, // Fortifying Brew
	115310: { effect: [] }, // Revival
	116680: { effect: [] }, // Thunder Focus Tea
	116849: { effect: [defensiveBuff(116849)] }, // Life Cocoon
	117952: { effect: [] }, // Crackling Jade Lightning
	325197: { effect: [defensiveBuff(406220)] }, // Invoke Chi-Ji, the Red Crane (Chi Cocoon)
	443028: { effect: [] }, // Celestial Conduit
	443591: { effect: [] }, // Unity Within
	116670: { dpsOnly: true, selfCastOnly: true, effect: [] }, // Vivify

	122470: { effect: [defensiveBuff(122470)] }, // Touch of Karma

	// Warlock
	104773: { effect: [defensiveBuff(104773)] }, // Unending Resolve
	6789: { effect: [], minor: true }, // Mortal Coil
	108416: { effect: [defensiveBuff(108416)] }, // Dark Pact
	119905: { effect: [], minor: true }, // Singe Magic

	// General
	431416: { effect: [] }, // Algari Healing Potion
	431418: { effect: [] }, // Algari Mana Potion
	431419: { effect: [] }, // Caveweller's Delight
	452767: { effect: [] }, // Heartseeking Health Injector
	58984: { effect: [] }, // Shadowmeld
	6262: { effect: [] }, // Healthstone

	// Defensive trinkets
	444301: { effect: [defensiveBuff(444301)] }, // Ravenous Swarm (444301 is a 3s buff; 447134 is a buff tracking the shield amount)
	466810: { effect: [defensiveBuff(466810)] }, // Chromebustible Bomb Suit
	1219102: { effect: [defensiveBuff(1219102)] }, // Mudborne
	443529: { effect: [defensiveBuff(451924)] }, // Burin of the Candle King (Wax Ward)

	// Necrotic Wake
	// 328404: { effect: [defensiveExtended(8000)] }, // Discharged Anima; the spell 328406 is the perodic casts every 1 second when the anima is used.
	// 328050: { effect: [defensiveBuff(328050)] } // Discarded Shield

	// Cinderbrew Meadery
	431895: { effect: [] } // Carrying Cinderbrew
};
export const castDict: SpellDict = { ...defensiveSpells };
for (const [id, val] of Object.entries(offensiveSpells)) {
	// All offensive spells are treated as if they were minor defensive spells.
	castDict[Number(id)] = { ...val, minor: true };
}

export const spelllikeBuffs: SpellDict = {
	457533: { effect: [defensiveBuff(457533)] }, // Evasive Maneuvers (Cloak proc)
	65116: { effect: [defensiveBuff(65116)] } // Stoneform; its casts are missing in the logs.
};
export const spelllikeDebuffs: SpellDict = {
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
