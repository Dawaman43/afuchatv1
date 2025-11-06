export type EmotionType = 'smile' | 'neutral' | 'serious' | 'sleepy';
export type BackgroundType = 'light' | 'gradient' | 'transparent';
export type AccessoryType = 'hat' | 'glasses' | 'scarf' | 'mask' | 'crown' | 'badge';

export interface OwlAvatarConfig {
  color: string; // Body color
  eyes: 'normal' | 'sleepy' | 'wide';
  emotion: EmotionType;
  background: BackgroundType;
  accessories: AccessoryType[];
  featherColor?: string; // Optional, defaults to darker shade of body color
  eyeColor?: string; // Optional, defaults to dark
}

export const DEFAULT_AVATAR_CONFIG: OwlAvatarConfig = {
  color: '#7456E8',
  eyes: 'normal',
  emotion: 'smile',
  background: 'light',
  accessories: [],
  eyeColor: '#1a1a1a',
};
