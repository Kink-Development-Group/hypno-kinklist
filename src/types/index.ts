export interface Kink {
  name: string;
  selections: Record<string, string>; // field -> level
}

export interface KinkCategory {
  name: string;
  fields: string[];
  kinks: string[];
}

export interface LevelDefinition {
  name: string;
  color: string;
  class: string;
}

export type KinksData = Record<string, KinkCategory>;
export type LevelsData = Record<string, LevelDefinition>;

export interface Selection {
  category: string;
  kink: string;
  field: string;
  value: string;
  $choices?: any;
  showField: boolean;
}
