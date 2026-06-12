import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import PixelText from '@/components/ui/PixelText';
import { useState, useEffect, useRef, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Radii } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api-client';
import { authApi } from '@/lib/api/auth';
import QRCode from 'react-native-qrcode-svg';

const QR_TTL = 30;

export default function ChildPinScreen() {
  const { name, childId, fromParent } = useLocalSearchParams<{ name: string; childId?: string; fromParent?: string }>();
  const [pin, setPin]           = useState('');
  const [error, setError]       = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { loginChild }  = useAuth();

  const [qrToken,      setQrToken]      = useState<string | null>(null);
  const [qrSeconds,    setQrSeconds]    = useState(QR_TTL);
  const [qrLoading,    setQrLoading]    = useState(false);
  const [showQrModal,  setShowQrModal]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function openQrModal() {
    setShowQrModal(true);
    setQrLoading(true);
    try {
      const { token } = await authApi.generateQr(childId ?? '');
      setQrToken(token);
      setQrSeconds(QR_TTL);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQrSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setQrToken(null); return QR_TTL; }
          return s - 1;
        });
      }, 1000);
    } catch {
      setShowQrModal(false);
    } finally {
      setQrLoading(false);
    }
  }

  function closeQrModal() {
    if (timerRef.current) clearInterval(timerRef.current);
    setQrToken(null);
    setQrSeconds(QR_TTL);
    setShowQrModal(false);
  }

  async function refreshQr() {
    setQrLoading(true);
    try {
      const { token } = await authApi.generateQr(childId ?? '');
      setQrToken(token);
      setQrSeconds(QR_TTL);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQrSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setQrToken(null); return QR_TTL; }
          return s - 1;
        });
      }, 1000);
    } finally {
      setQrLoading(false);
    }
  }

  function pressDigit(d: string) {
    if (pin.length >= 4 || isValidating) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) validatePin(next);
  }

  function pressDelete() {
    if (isValidating) return;
    setPin(p => p.slice(0, -1));
    setError(false);
  }

  async function validatePin(p: string) {
    setIsValidating(true);
    try {
      await loginChild(childId ?? '', p);
      router.replace({ pathname: '/(child)/home', params: { fromParent } });
    } catch (err) {
      setPin('');
      setError(true);
      setIsValidating(false);
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={styles.root}>
      <PixelText style={styles.greeting}>Bonjour, {name} ! 👋</PixelText>
      <PixelText style={styles.sub}>Tape ton code secret</PixelText>

      {/* Dots */}
      <View style={styles.dots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled, error && styles.dotError, isValidating && styles.dotValidating]} />
        ))}
      </View>
      {isValidating
        ? <ActivityIndicator size="small" color={colors.gold} style={styles.spinner} />
        : error
          ? <PixelText style={styles.errorText}>Code incorrect — réessaie</PixelText>
          : <View style={styles.errorPlaceholder} />
      }

      {/* Numpad */}
      <View style={[styles.numpad, isValidating && styles.numpadDisabled]}>
        {KEYS.map((k, i) => k === '' ? (
          <View key={i} style={styles.keyEmpty} />
        ) : (
          <TouchableOpacity
            key={i}
            style={[styles.key, k === '⌫' && styles.keyDelete]}
            onPress={() => k === '⌫' ? pressDelete() : pressDigit(k)}
            activeOpacity={0.7}
            disabled={isValidating}
          >
            <PixelText style={[styles.keyText, k === '⌫' && styles.keyDeleteText]}>{k}</PixelText>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <PixelText style={styles.backText}>← Changer d'enfant</PixelText>
      </TouchableOpacity>

      {fromParent === 'true' && (
        <TouchableOpacity style={styles.qrBtn} onPress={openQrModal}>
          <PixelText style={styles.qrBtnText}>📱 Connecter le téléphone de {name}</PixelText>
        </TouchableOpacity>
      )}

      {/* Modal QR code */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={closeQrModal}>
        <TouchableOpacity style={styles.qrOverlay} activeOpacity={1} onPress={closeQrModal}>
          <TouchableOpacity activeOpacity={1} style={styles.qrSheet} onPress={() => {}}>
            <PixelText style={styles.qrTitle}>QR code de {name}</PixelText>
            <PixelText style={styles.qrSub}>Demande à {name} de le scanner depuis son téléphone</PixelText>
            {qrToken && (
              <View style={styles.qrBox}>
                <QRCode value={qrToken} size={200} backgroundColor="#fff" color="#000" />
              </View>
            )}
            {!qrToken && qrLoading && <ActivityIndicator size="large" color={colors.gold} />}
            <View style={styles.qrTimer}>
              <PixelText style={[styles.qrTimerText, qrSeconds <= 5 && { color: '#EF5350' }]}>
                Expire dans {qrSeconds}s
              </PixelText>
            </View>
            <TouchableOpacity style={styles.qrRefreshBtn} onPress={refreshQr} disabled={qrLoading}>
              <PixelText style={styles.qrRefreshText}>{qrLoading ? 'Génération…' : '🔄 Nouveau QR'}</PixelText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrCloseBtn} onPress={closeQrModal}>
              <PixelText style={styles.qrCloseBtnText}>Fermer</PixelText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 26,
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 15,
    color: colors.textDim,
    marginTop: -16,
  },
  dots: {
    flexDirection: 'row',
    gap: 18,
    marginVertical: 8,
  },
  dot: {
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textFaint,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dotError: {
    borderColor: '#EF5350',
    backgroundColor: '#EF5350',
  },
  dotValidating: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    opacity: 0.5,
  },
  errorText: {
    color: '#EF5350',
    fontSize: 13,
    marginTop: -12,
  },
  errorPlaceholder: {
    height: 18,
    marginTop: -12,
  },
  spinner: {
    marginTop: -12,
  },
  numpadDisabled: {
    opacity: 0.4,
  },
  numpad: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 84, height: 84,
    borderRadius: Radii.hero,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 84, height: 84,
  },
  keyDelete: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 26,
    color: colors.textPrimary,
  },
  keyDeleteText: {
    fontSize: 22,
    color: colors.textDim,
  },
  back: {
    padding: 16,
  },
  backText: {
    fontSize: 14,
    color: colors.textDim,
  },
  qrBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.25)',
    marginTop: -8,
  },
  qrBtnText: {
    fontSize: 13,
    color: colors.gold,
  },
  qrOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  qrSheet:       { backgroundColor: colors.bgCard, borderRadius: 28, padding: 28, alignItems: 'center', gap: 16, marginHorizontal: 24, width: 320 },
  qrTitle:       { fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  qrSub:         { fontSize: 13, color: colors.textDim, textAlign: 'center', marginTop: -8 },
  qrBox:         { backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  qrTimer:       { alignItems: 'center' },
  qrTimerText:   { fontSize: 14, color: colors.textDim },
  qrRefreshBtn:  { backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  qrRefreshText: { fontSize: 14, color: colors.gold },
  qrCloseBtn:    { paddingVertical: 8 },
  qrCloseBtnText:{ fontSize: 14, color: colors.textFaint },
});
