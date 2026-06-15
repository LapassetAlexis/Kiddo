// Sprite layer order (bottom to top)
export const LAYER_ORDER = ['shadow', 'backhair', 'bottom', 'top', 'head', 'hair', 'hat', 'weapon'] as const;
export type LayerKey = typeof LAYER_ORDER[number];

// Spritesheet layout: 1104×192 per layer, 4 rows × 23 cols, 48×48px per frame
// Rows: 0=South, 1=West, 2=East, 3=North
// Walk cols 0-2, Stand col 3, Attack cols 12-14
export const FRAME_W = 48;
export const FRAME_H = 48;
export const DIRECTIONS = { south: 0, west: 1, east: 2, north: 3 } as const;
export type Direction = keyof typeof DIRECTIONS;

export const ANIMATIONS = {
  idle:   { startCol: 3, frames: 1 },
  walk:   { startCol: 0, frames: 3 },
  attack: { startCol: 12, frames: 3 },
} as const;
export type AnimationKey = keyof typeof ANIMATIONS;

export type ChildPath = 'warrior' | 'rogue' | 'archer' | 'mage';

export const CLASS_DEFAULTS: Record<ChildPath, {
  label: string;
  emoji: string;
  color: string;
  description: string;
  head: string;
  hair: string;
  backhair: string;
  hat: string | null;
  top: string;
  bottom: string;
  weapon: string | null;
  shadow: string;
}> = {
  warrior: {
    label: 'Guerrier',      emoji: '⚔️',  color: '#EF5350',
    description: 'Fort et courageux. Bonus XP sur les défis physiques.',
    head: 'head1', hair: 'hair1', backhair: 'backhair1',
    hat: 'hat1', top: 'top1', bottom: 'bottom1', weapon: 'sword1', shadow: 'shadow',
  },
  rogue: {
    label: 'Voleur',        emoji: '🗡️',  color: '#7E57C2',
    description: 'Rapide et discret. Bonus XP sur les tâches variées.',
    head: 'head2', hair: 'hair2', backhair: 'backhair1',
    hat: null, top: 'top3', bottom: 'bottom2', weapon: 'sword1_c2', shadow: 'shadow',
  },
  archer: {
    label: 'Archer',        emoji: '🏹',  color: '#66BB6A',
    description: 'Précis et patient. Bonus XP sur les tâches régulières.',
    head: 'head1', hair: 'hair3', backhair: 'backhair2',
    hat: 'hat3', top: 'top6', bottom: 'bottom3', weapon: 'bow1arrow1', shadow: 'shadow',
  },
  mage: {
    label: 'Mage',          emoji: '🧙',  color: '#42A5F5',
    description: 'Sage et curieux. Bonus XP sur les tâches scolaires.',
    head: 'head1', hair: 'hair4', backhair: 'backhair1',
    hat: 'hat5', top: 'top2', bottom: 'bottom1', weapon: 'spear1', shadow: 'shadow',
  },
};

export function getSpriteAsset(layer: LayerKey, key: string): number | undefined {
  return (SPRITE_ASSETS[layer] as Record<string, number>)[key];
}

export const SPRITE_ASSETS: Record<LayerKey, Record<string, number>> = {
  shadow: {
    shadow: require('@/assets/sprites/shadow/shadow.png'),
  },
  head: {
    head1: require('@/assets/sprites/head/head1.png'),
    head2: require('@/assets/sprites/head/head2.png'),
    head3: require('@/assets/sprites/head/head3.png'),
    head4: require('@/assets/sprites/head/head4.png'),
    head5: require('@/assets/sprites/head/head5.png'),
    head6: require('@/assets/sprites/head/head6.png'),
    head7: require('@/assets/sprites/head/head7.png'),
    head8: require('@/assets/sprites/head/head8.png'),
  },
  hair: {
    hair1:  require('@/assets/sprites/hair/hair1.png'),
    hair2:  require('@/assets/sprites/hair/hair2.png'),
    hair3:  require('@/assets/sprites/hair/hair3.png'),
    hair4:  require('@/assets/sprites/hair/hair4.png'),
    hair5:  require('@/assets/sprites/hair/hair5.png'),
    hair6:  require('@/assets/sprites/hair/hair6.png'),
    hair7:  require('@/assets/sprites/hair/hair7.png'),
    hair8:  require('@/assets/sprites/hair/hair8.png'),
    hair9:  require('@/assets/sprites/hair/hair9.png'),
    hair10: require('@/assets/sprites/hair/hair10.png'),
    hair11: require('@/assets/sprites/hair/hair11.png'),
    hair12: require('@/assets/sprites/hair/hair12.png'),
  },
  backhair: {
    backhair1: require('@/assets/sprites/backhair/backhair1.png'),
    backhair2: require('@/assets/sprites/backhair/backhair2.png'),
    backhair3: require('@/assets/sprites/backhair/backhair3.png'),
    backhair4: require('@/assets/sprites/backhair/backhair4.png'),
    backhair5: require('@/assets/sprites/backhair/backhair5.png'),
  },
  hat: {
    hat1:    require('@/assets/sprites/hat/hat1.png'),
    hat1_c1: require('@/assets/sprites/hat/hat1_c1.png'),
    hat1_c2: require('@/assets/sprites/hat/hat1_c2.png'),
    hat1_c3: require('@/assets/sprites/hat/hat1_c3.png'),
    hat2:    require('@/assets/sprites/hat/hat2.png'),
    hat2_c1: require('@/assets/sprites/hat/hat2_c1.png'),
    hat3:    require('@/assets/sprites/hat/hat3.png'),
    hat3_c1: require('@/assets/sprites/hat/hat3_c1.png'),
    hat4:    require('@/assets/sprites/hat/hat4.png'),
    hat5:    require('@/assets/sprites/hat/hat5.png'),
    hat5_c1: require('@/assets/sprites/hat/hat5_c1.png'),
    hat5_c2: require('@/assets/sprites/hat/hat5_c2.png'),
    hat6:    require('@/assets/sprites/hat/hat6.png'),
    hat6_c1: require('@/assets/sprites/hat/hat6_c1.png'),
  },
  top: {
    top0:  require('@/assets/sprites/top/top0.png'),
    top1:  require('@/assets/sprites/top/top1.png'),
    top2:  require('@/assets/sprites/top/top2.png'),
    top3:  require('@/assets/sprites/top/top3.png'),
    top4:  require('@/assets/sprites/top/top4.png'),
    top5:  require('@/assets/sprites/top/top5.png'),
    top6:  require('@/assets/sprites/top/top6.png'),
    top7:  require('@/assets/sprites/top/top7.png'),
    top8:  require('@/assets/sprites/top/top8.png'),
    top9:  require('@/assets/sprites/top/top9.png'),
    top10: require('@/assets/sprites/top/top10.png'),
    top11: require('@/assets/sprites/top/top11.png'),
    top12: require('@/assets/sprites/top/top12.png'),
  },
  bottom: {
    bottom0: require('@/assets/sprites/bottom/bottom0.png'),
    bottom1: require('@/assets/sprites/bottom/bottom1.png'),
    bottom2: require('@/assets/sprites/bottom/bottom2.png'),
    bottom3: require('@/assets/sprites/bottom/bottom3.png'),
    bottom4: require('@/assets/sprites/bottom/bottom4.png'),
    bottom5: require('@/assets/sprites/bottom/bottom5.png'),
    bottom6: require('@/assets/sprites/bottom/bottom6.png'),
    bottom7: require('@/assets/sprites/bottom/bottom7.png'),
    bottom8: require('@/assets/sprites/bottom/bottom8.png'),
  },
  weapon: {
    sword1:     require('@/assets/sprites/weapon/sword1.png'),
    sword1_c2:  require('@/assets/sprites/weapon/sword1_c2.png'),
    sword1_c3:  require('@/assets/sprites/weapon/sword1_c3.png'),
    bow1:       require('@/assets/sprites/weapon/bow1.png'),
    bow1arrow1: require('@/assets/sprites/weapon/bow1arrow1.png'),
    spear1:     require('@/assets/sprites/weapon/spear1.png'),
    spear1_c2:  require('@/assets/sprites/weapon/spear1_c2.png'),
    pickaxe1:   require('@/assets/sprites/weapon/pickaxe1.png'),
    shield1L:   require('@/assets/sprites/weapon/shield1L.png'),
    shield1R:   require('@/assets/sprites/weapon/shield1R.png'),
  },
};
