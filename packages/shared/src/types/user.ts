export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  strength: number;
  intelligence: number;
  charisma: number;
  avatarConfig: AvatarConfig;
  timezone: string;
  currency: string;
  language: string;
  relationshipStatus: RelationshipStatus;
  onboardingCompleted: boolean;
  birthDate: string | null;
  currentStreak: number;
  longestStreak: number;
  gymPlaylistUrl?: string | null;
  equippedHat?: string | null;
  equippedAura?: string | null;
  equippedFrame?: string | null;
  equippedTheme?: string | null;
  createdAt: string;
}

export type HairStyle = 'short' | 'medium' | 'long' | 'shaved' | 'copete' | 'afro' | 'recogido' | 'trenzas' | 'ondulado';
export type Accessory = 'none' | 'glasses' | 'cap' | 'headband' | 'earrings' | 'scarf';
export type Expression = 'normal' | 'smile' | 'serious' | 'determined';

export interface AvatarConfig {
  bodyType?: 'male' | 'female';
  hairStyle: HairStyle;
  hairColor: string;
  skinColor: string;
  shirtColor: string;
  pants: string;
  accessory: Accessory;
  expression: Expression;
  pet: string | null;
}

export type RelationshipStatus =
  | 'SINGLE'
  | 'IN_RELATIONSHIP'
  | 'COMPLICATED'
  | 'PREFER_NOT_TO_SAY';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  gender?: 'male' | 'female';
}
