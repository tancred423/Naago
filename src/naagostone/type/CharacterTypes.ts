export interface Bio {
  html: string;
  markdown: string;
}

export interface Characteristics {
  race: string;
  tribe: string;
  gender: string;
}

export interface Server {
  world: string;
  dc: string;
}

export interface GuardianDeity {
  name: string;
  icon: string;
}

export interface Town {
  name: string;
  icon: string;
}

export interface ActiveClassJob {
  icon: string;
  name: string;
  level: number;
}

export interface GrandCompany {
  name: string;
  rank: string;
  icon: string;
}

export interface FreeCompany {
  id: number;
  name: string;
  icon_layer_0: string;
  icon_layer_1: string;
  icon_layer_2: string;
  tag: string | null;
}

export interface ClassJob {
  icon: string;
  level: number;
  unlockstate: string;
  current_exp: string;
  max_exp: string;
}

export interface Bozja {
  level: number;
  mettle: string;
  name: string;
}

export interface Eureka {
  current_exp: string;
  max_exp: string;
  level: number;
  name: string;
}

export interface Attributes {
  strength: number | null;
  dexterity: number | null;
  vitality: number | null;
  intelligence: number | null;
  mind: number | null;
  critical_hit_rate: number | null;
  determination: number | null;
  direct_hit_rate: number | null;
  defense: number | null;
  magic_defense: number | null;
  attack_power: number | null;
  skill_speed: number | null;
  attack_magic_potency: number | null;
  healing_magic_potency: number | null;
  spell_speed: number | null;
  tenacity: number | null;
  piety: number | null;
  hp: number | null;
  mp_gp_cp: number | null;
  mp_gp_cp_parameter_name: string | null;
  craftsmanship: number | null;
  control: number | null;
  gathering: number | null;
  perception: number | null;
}

export interface Equipment {
  name: string;
  icon: string;
  mirage_name: string | null;
  mirage_icon: string | null;
  rarity: string | null;
  color_code: string | null;
  color_name: string | null;
  color_code2: string | null;
  color_name2: string | null;
  amount_dye_slots: number | null;
  materia_1: string | null;
  materia_1_stats: string | null;
  materia_1_is_overmeld: boolean | null;
  materia_2: string | null;
  materia_2_stats: string | null;
  materia_2_is_overmeld: boolean | null;
  materia_3: string | null;
  materia_3_stats: string | null;
  materia_3_is_overmeld: boolean | null;
  materia_4: string | null;
  materia_4_stats: string | null;
  materia_4_is_overmeld: boolean | null;
  materia_5: string | null;
  materia_5_stats: string | null;
  materia_5_is_overmeld: boolean | null;
  type: string | null;
  item_level: string | null;
}

export interface RaidClear {
  cleared: boolean;
  date: number | null;
  week: number | null;
}

export interface UltimateProgression {
  ucob: RaidClear;
  uwu: RaidClear;
  tea: RaidClear;
  dsr: RaidClear;
  top: RaidClear;
  fru: RaidClear;
  ultimate_count: number;
}

export interface SavageExpansion {
  [key: string]: RaidClear;
}

export interface SavageProgression {
  arr: SavageExpansion;
  hw: SavageExpansion;
  sb: SavageExpansion;
  shb: SavageExpansion;
  ew: SavageExpansion;
  dt: SavageExpansion;
}

export interface RaidProgression {
  ultimates: UltimateProgression;
  savage: SavageProgression;
}

export interface Character {
  id: number;
  bio: Bio;
  name: string;
  title: string;
  avatar: string;
  portrait: string;
  characteristics: Characteristics | null;
  server: Server;
  nameday: string;
  guardian_deity: GuardianDeity;
  town: Town;
  started: string;
  ap: number;
  amount_achievements: string;
  amount_mounts: number;
  amount_minions: number;
  active_classjob: ActiveClassJob;
  grand_company: GrandCompany | null;
  free_company: FreeCompany | null;
  pvp_team: string | null;
  attributes: Attributes;
  bozja: Bozja | null;
  eureka: Eureka | null;
  paladin: ClassJob;
  warrior: ClassJob;
  darkknight: ClassJob;
  gunbreaker: ClassJob;
  whitemage: ClassJob;
  scholar: ClassJob;
  astrologian: ClassJob;
  sage: ClassJob;
  monk: ClassJob;
  dragoon: ClassJob;
  ninja: ClassJob;
  samurai: ClassJob;
  reaper: ClassJob;
  viper: ClassJob;
  bard: ClassJob;
  machinist: ClassJob;
  dancer: ClassJob;
  blackmage: ClassJob;
  summoner: ClassJob;
  redmage: ClassJob;
  pictomancer: ClassJob;
  bluemage: ClassJob;
  carpenter: ClassJob;
  blacksmith: ClassJob;
  armorer: ClassJob;
  goldsmith: ClassJob;
  leatherworker: ClassJob;
  weaver: ClassJob;
  alchemist: ClassJob;
  culinarian: ClassJob;
  miner: ClassJob;
  botanist: ClassJob;
  fisher: ClassJob;
  mainhand: Equipment | null;
  offhand: Equipment | null;
  head: Equipment | null;
  body: Equipment | null;
  hands: Equipment | null;
  legs: Equipment | null;
  feet: Equipment | null;
  earrings: Equipment | null;
  necklace: Equipment | null;
  bracelets: Equipment | null;
  ring1: Equipment | null;
  ring2: Equipment | null;
  soulcrystal: Equipment | null;
  facewear: Equipment | null;
  item_level: string;
  raid_progression: RaidProgression | null;
}

export interface CharacterResponse {
  character: Character;
}
