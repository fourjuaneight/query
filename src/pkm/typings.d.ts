// TCGdex API response types
// DOCS: https://tcgdex.dev/reference/card

export interface TCGdexSetBrief {
  cardCount: {
    official: number;
    total: number;
  };
  id: string;
  logo?: string;
  name: string;
  symbol?: string;
}

export interface TCGdexVariants {
  firstEdition: boolean;
  holo: boolean;
  normal: boolean;
  reverse: boolean;
  wPromo: boolean;
}

export interface TCGdexAttack {
  cost: string[];
  name: string;
  effect?: string;
  damage?: number | string;
}

export interface TCGdexAbility {
  type: string;
  name: string;
  effect: string;
}

export interface TCGdexWeakness {
  type: string;
  value: string;
}

export interface TCGdexResistance {
  type: string;
  value: string;
}

export interface TCGdexLegal {
  standard: boolean;
  expanded: boolean;
}

export interface TCGdexCardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

export interface TCGdexCard {
  // Common properties
  id: string;
  localId: string;
  name: string;
  image?: string;
  category: 'Pokemon' | 'Trainer' | 'Energy';
  illustrator?: string;
  rarity?: string;
  set: TCGdexSetBrief;
  variants: TCGdexVariants;
  regulationMark?: string;
  legal?: TCGdexLegal;
  updated: string;

  // Pokemon card properties
  dexId?: number[];
  hp?: number;
  types?: string[];
  evolveFrom?: string;
  description?: string;
  level?: string;
  stage?: string;
  suffix?: string;
  attacks?: TCGdexAttack[];
  abilities?: TCGdexAbility[];
  weaknesses?: TCGdexWeakness[];
  resistances?: TCGdexResistance[];
  retreat?: number;

  // Trainer card properties
  effect?: string;
  trainerType?: string;

  // Energy card properties
  energyType?: string;
}

// Normalized output types

export interface RequestQuery {
  name: string;
  set?: string;
}

export interface PKMItem {
  name: string;
  category: string;
  hp: number | null;
  types: string[] | null;
  stage: string | null;
  evolveFrom: string | null;
  attacks: TCGdexAttack[] | null;
  weaknesses: TCGdexWeakness[] | null;
  retreat: number | null;
  rarity: string | null;
  set: string;
  set_name: string;
  description: string | null;
  illustrator: string | null;
  image: string;
}
