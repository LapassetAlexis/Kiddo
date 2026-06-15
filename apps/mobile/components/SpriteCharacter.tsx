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
};

type Props = {
  path: ChildPath;
  avatarConfig?: AvatarConfig | null;
  animation?: AnimationKey;
  direction?: Direction;
  size?: number;
  fps?: number;
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
}: Props) {
  const defaults = CLASS_DEFAULTS[path];
  const cfg: AvatarConfig = { ...defaults, ...avatarConfig };

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

  return (
    <View style={[styles.clip, { width: frameW, height: frameH }]}>
      {LAYER_ORDER.map((layer, i) => {
        const key = layerKeys[i];
        if (!key) return null;
        const src = getSpriteAsset(layer, key);
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
