import { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {
  FRAME_W, FRAME_H, ANIMATIONS, DIRECTIONS,
  getSpriteAsset, CLASS_DEFAULTS,
  type AnimationKey, type Direction, type ChildPath,
} from '@/constants/sprites';

export type AvatarConfig = {
  head?: string;
  hair?: string;
  backhair?: string;
  hat?: string | null;
  top?: string;
  bottom?: string;
  weapon?: string | null;
  shadow?: string;
  skinTone?: string; // e.g. 'tone1', 'green', 'blue' — applied to all skin-bearing layers
};

type Props = {
  path: ChildPath;
  avatarConfig?: AvatarConfig | null;
  animation?: AnimationKey;
  direction?: Direction;
  size?: number;
  fps?: number;
  bare?: boolean; // skip class defaults — show only what's in avatarConfig
};

const LAYER_ORDER = ['shadow', 'backhair', 'bottom', 'top', 'head', 'hair', 'hat', 'weapon'] as const;
// Full spritesheet dimensions per layer
const SHEET_W = 1104;
const SHEET_H = 192;

export default function SpriteCharacter({
  path,
  avatarConfig,
  animation = 'idle',
  direction = 'south',
  size = 96,
  fps = 6,
  bare = false,
}: Props) {
  const defaults = CLASS_DEFAULTS[path];
  const cfg: AvatarConfig = bare ? (avatarConfig ?? {}) : { ...defaults, ...avatarConfig };

  const anim     = ANIMATIONS[animation];
  const rowIndex = DIRECTIONS[direction];
  const scale    = size / FRAME_H;
  const frameW   = Math.round(FRAME_W * scale);
  const frameH   = Math.round(FRAME_H * scale);
  const sheetW   = Math.round(SHEET_W * scale);
  const sheetH   = Math.round(SHEET_H * scale);

  const [col, setCol] = useState<number>(anim.startCol);

  useEffect(() => {
    setCol(anim.startCol);
    if (anim.frames <= 1) return;
    const id = setInterval(() => {
      setCol(c => {
        const next = c + 1;
        return next >= anim.startCol + anim.frames ? anim.startCol : next;
      });
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [animation, fps, anim.startCol, anim.frames]);

  const layerKeys: (string | null | undefined)[] = [
    cfg.shadow,
    cfg.backhair,
    cfg.bottom,
    cfg.top,
    cfg.head,
    cfg.hair,
    cfg.hat,
    cfg.weapon,
  ];

  const offsetX = -col * Math.round(FRAME_W * scale);
  const offsetY = -rowIndex * Math.round(FRAME_H * scale);

  const skinTone = cfg.skinTone;

  return (
    <View style={[styles.clip, { width: frameW, height: frameH }]}>
      {LAYER_ORDER.map((layer, i) => {
        const key = layerKeys[i];
        if (!key) return null;
        const tonedKey = skinTone ? `${key}_${skinTone}` : key;
        const src = getSpriteAsset(layer, tonedKey) ?? getSpriteAsset(layer, key);
        if (src === undefined) return null;
        return (
          <Image
            key={layer}
            source={src}
            style={[styles.sheet, { width: sheetW, height: sheetH, left: offsetX, top: offsetY }]}
            resizeMode="stretch"
            fadeDuration={0}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    position: 'relative',
  },
  sheet: {
    position: 'absolute',
  },
});
