// encounterID: https://wago.tools/db2/DungeonEncounter?page=1

export const bossData: { [bossId: number]: {damages: number[], debuffs: number[]} } = {
  2905: { // The Coagulation
    damages: [
      437533, // Dark Pulse
      443150, // Viscous Darkness
    ],
    debuffs: [
      442285, // Corrupted Coating
    ],
  },
  2909: { // Izo, the Grand Splicer
    damages: [
      439341, // Splice
      437700, // Tremor Slam
      439324, // Umbral Weave
    ],
    debuffs: [],
  },
};

export const blackList = {
  damages: [
    1, // Melee
    455537, // Symbiosis
    32409, // Shadow Word: Death
  ],
};

export const tickingDamages = [
  // Necrotic Wake
  

];