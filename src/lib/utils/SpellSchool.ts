export class SpellSchool {
	static readonly Physical = 1;
	static readonly Holy = 2;
	static readonly Fire = 4;
	static readonly Nature = 8;
	static readonly Frost = 16;
	static readonly Arcane = 32;
	static readonly Shadow = 64;
	static readonly Chaos5 =
		SpellSchool.Shadow |
		SpellSchool.Arcane |
		SpellSchool.Frost |
		SpellSchool.Nature |
		SpellSchool.Fire; // 124

	static isPhysical(school: number) {
		return school & SpellSchool.Physical;
	}
	static isHoly(school: number) {
		return school & SpellSchool.Holy;
	}
	static isFire(school: number) {
		return school & SpellSchool.Fire;
	}
	static isNature(school: number) {
		return school & SpellSchool.Nature;
	}
	static isFrost(school: number) {
		return school & SpellSchool.Frost;
	}
	static isArcane(school: number) {
		return school & SpellSchool.Arcane;
	}
	static isShadow(school: number) {
		return school & SpellSchool.Shadow;
	}

	static isChaos5(school: number) {
		return (
			SpellSchool.isShadow(school) &&
			SpellSchool.isArcane(school) &&
			SpellSchool.isFrost(school) &&
			SpellSchool.isNature(school) &&
			SpellSchool.isFire(school)
		);
	}

	static getColor(school: number) {
		if (SpellSchool.isChaos5(school)) return '#A330C9';
		if (SpellSchool.isShadow(school)) return '#8FF2FF';
		if (SpellSchool.isArcane(school)) return '#B8A8F0';
		if (SpellSchool.isFrost(school)) return '#4A80FF';
		if (SpellSchool.isNature(school)) return '#D1FA99';
		if (SpellSchool.isFire(school)) return '#EB4561';
		if (SpellSchool.isHoly(school)) return '#FFFF8F';
		if (SpellSchool.isPhysical(school)) return '#E5CC80';
		return null;
	}
}
