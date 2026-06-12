import { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { Radii } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const PAD = 10;
const OVERLAY = 'rgba(0,0,0,0.82)';

export interface TourStep {
  ref: React.RefObject<any>;
  title: string;
  body: string;
}

interface MeasuredRect { x: number; y: number; w: number; h: number; }

interface Props {
  steps: TourStep[];
  visible: boolean;
  onFinish: () => void;
}

export default function SpotlightTour({ steps, visible, onFinish }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<MeasuredRect | null>(null);
  const [containerH, setContainerH] = useState(900);
  const containerRef = useRef<View>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    if (!visible) { setIndex(0); setSpot(null); return; }
    measureTarget(index);
  }, [visible, index]);

  function measureTarget(i: number) {
    setSpot(null);
    const node = steps[i]?.ref?.current;
    if (!node) return;
    setTimeout(() => {
      const sbH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) {
          setSpot({
            x: x - PAD,
            y: y + sbH - PAD,
            w: w + PAD * 2,
            h: h + PAD * 2,
          });
        }
      });
    }, 200);
  }

  function next() {
    if (isLast) onFinish();
    else setIndex(i => i + 1);
  }

  if (!visible || !step) return null;

  const sx = spot?.x ?? 0;
  const sy = spot?.y ?? 0;
  const sw = spot?.w ?? 0;
  const sh = spot?.h ?? 0;
  const showBelow = !spot || sy < containerH * 0.55;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onFinish}>
      <View
        ref={containerRef}
        style={StyleSheet.absoluteFill}
        onLayout={e => setContainerH(e.nativeEvent.layout.height)}
      >
        {/* 4-piece overlay */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={{ position: 'absolute', top: 0,       left: 0, right: 0,            height: Math.max(0, sy),  backgroundColor: OVERLAY }} />
          <View style={{ position: 'absolute', top: sy + sh, left: 0, right: 0, bottom: 0,                           backgroundColor: OVERLAY }} />
          <View style={{ position: 'absolute', top: sy,      left: 0, width: Math.max(0, sx), height: sh,            backgroundColor: OVERLAY }} />
          <View style={{ position: 'absolute', top: sy,      left: sx + sw, right: 0,        height: sh,             backgroundColor: OVERLAY }} />
          {spot && (
            <View style={{
              position: 'absolute', top: sy, left: sx, width: sw, height: sh,
              borderRadius: 12, borderWidth: 2, borderColor: colors.gold,
            }} />
          )}
        </View>

        {/* Tooltip */}
        <View style={[styles.tooltip, showBelow ? { top: sy + sh + 16 } : { bottom: containerH - sy + 16 }]}>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <PixelText style={styles.title}>{step.title}</PixelText>
          <PixelText style={styles.body}>{step.body}</PixelText>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onFinish} activeOpacity={0.7}>
              <PixelText style={styles.skipText}>Passer</PixelText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
              <PixelText style={styles.nextText}>{isLast ? 'Terminer ✓' : 'Suivant →'}</PixelText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  tooltip: {
    position: 'absolute',
    left: 20, right: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 30,
  },
  dots: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: { width: 18, backgroundColor: colors.gold },
  title: {
    fontSize: 17,
    color: colors.textPrimary, marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.textDim, lineHeight: 20,
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1, alignItems: 'center', padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: colors.border,
  },
  skipText: { fontSize: 13, color: colors.textFaint },
  nextBtn: {
    flex: 2, alignItems: 'center', padding: 12,
    borderRadius: Radii.md,
    backgroundColor: colors.gold,
  },
  nextText: { fontSize: 14, color: '#000' },
});
