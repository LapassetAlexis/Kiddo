import { View, Image, ImageSourcePropType } from 'react-native';
import { useEffect, useState } from 'react';

// Walk strip: 832×256px — 13 cols × 4 rows × 64px
// Rows: 0=up  1=left  2=south  3=right
const COLS       = 13;
const ROWS       = 4;
const FRAME_SIZE = 64;
const FRAMES_ALL = [1, 2, 3, 4, 5, 6, 7, 8]; // full LPC walk cycle
const FRAME_MS   = 100;

const DIRECTION_ROW = { up: 0, left: 1, south: 2, right: 3 } as const;
type Direction = keyof typeof DIRECTION_ROW;

interface Props {
  source: ImageSourcePropType;
  items?: ImageSourcePropType[];
  behindItems?: ImageSourcePropType[];
  size?: number;
  direction?: Direction;
  frames?: number[];
}

export default function HeroSprite({
  source, items = [], behindItems = [], size = 64, direction = 'right', frames = FRAMES_ALL,
}: Props) {
  const [tick, setTick] = useState(0);
  const row      = DIRECTION_ROW[direction];
  const frameIdx = frames[tick % frames.length];
  const sheetW   = COLS * size;
  const sheetH   = ROWS * size;
  const sheetStyle = {
    position: 'absolute' as const,
    width:  sheetW,
    height: sheetH,
    left: -frameIdx * size,
    top:  -row * size,
    backgroundColor: 'transparent',
  };

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), FRAME_MS);
    return () => clearInterval(id);
  }, [frames]);

  return (
    <View
      collapsable={false}
      renderToHardwareTextureAndroid={false}
      style={{ width: size, height: size, overflow: 'hidden', backgroundColor: 'transparent' }}
    >
      {behindItems.map((src, i) => (
        <Image key={`b${i}`} source={src} style={sheetStyle} resizeMode="stretch" />
      ))}
      <Image source={source} style={sheetStyle} resizeMode="stretch" />
      {items.map((src, i) => (
        <Image key={i} source={src} style={sheetStyle} resizeMode="stretch" />
      ))}
    </View>
  );
}
