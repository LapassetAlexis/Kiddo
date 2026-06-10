import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Pressable, Animated,
} from 'react-native';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export type ModalButton = {
  label: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type ModalConfig = {
  title: string;
  message?: string;
  icon?: string;
  buttons?: ModalButton[];
};

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useAppModal() {
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const show = useCallback((c: ModalConfig) => setConfig(c), []);
  const hide = useCallback(() => setConfig(null), []);

  return { config, show, hide };
}

// ─── Component ─────────────────────────────────────────────────────────────
type Props = {
  config: ModalConfig | null;
  onHide: () => void;
};

export default function AppModal({ config, onHide }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const visible   = config !== null;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, bounciness: 3,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  function close() {
    Animated.timing(slideAnim, {
      toValue: 300, duration: 180, useNativeDriver: true,
    }).start(() => onHide());
  }

  if (!config) return null;

  const buttons: ModalButton[] = config.buttons ?? [{ label: 'OK', style: 'default' }];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
      <Pressable style={styles.overlay} onPress={() => close()}>
        <Animated.View style={[styles.sheet, { paddingBottom: 40 + bottom, transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={() => {}}>
            <View style={styles.handle} />

            {config.icon && <Text style={styles.icon}>{config.icon}</Text>}

            <Text style={styles.title}>{config.title}</Text>
            {config.message && <Text style={styles.message}>{config.message}</Text>}

            <View style={styles.buttons}>
              {buttons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    btn.style === 'cancel'      && styles.btnCancel,
                    btn.style === 'destructive' && styles.btnDestructive,
                    btn.style === 'default'     && styles.btnDefault,
                    (!btn.style || btn.style === 'default') && styles.btnDefault,
                  ]}
                  onPress={() => { btn.onPress?.(); close(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.btnText,
                    btn.style === 'cancel'      && styles.btnTextCancel,
                    btn.style === 'destructive' && styles.btnTextDestructive,
                  ]}>
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e26',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },
  icon:    { fontSize: 44, textAlign: 'center', marginBottom: 12 },
  title:   { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  buttons: { gap: 10 },

  btn: {
    borderRadius: Radii.md, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  btnDefault: {
    backgroundColor: colors.orange,
  },
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  btnDestructive: {
    backgroundColor: 'rgba(239,83,80,0.15)',
    borderColor: 'rgba(239,83,80,0.25)',
  },

  btnText:            { fontSize: 15, fontWeight: '900', color: '#fff' },
  btnTextCancel:      { color: 'rgba(255,255,255,0.45)' },
  btnTextDestructive: { color: '#EF5350' },
});
