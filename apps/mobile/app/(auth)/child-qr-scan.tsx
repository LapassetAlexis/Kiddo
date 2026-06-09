import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ChildQrScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const { loginChildQr }                = useAuth();

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleBarcode({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setError(null);
    try {
      await loginChildQr(data);
      router.replace('/(child)/home');
    } catch {
      setError('QR invalide ou expiré. Demande un nouveau QR à tes parents.');
      setScanned(false);
    }
  }

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Accès caméra requis</Text>
        <Text style={styles.sub}>Pour scanner le QR code de tes parents</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Scanner le QR de tes parents</Text>
      <Text style={styles.sub}>Demande à un parent d'ouvrir le QR code dans son app</Text>

      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcode}
        />
        <View style={styles.overlay}>
          <View style={styles.frame} />
        </View>
        {scanned && !error && (
          <View style={styles.scanning}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.scanningText}>Connexion en cours…</Text>
          </View>
        )}
      </View>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const FRAME = 240;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 80,
  },
  sub: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDim,
    textAlign: 'center',
    marginTop: -8,
  },
  cameraWrap: {
    width: FRAME + 40,
    height: FRAME + 40,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 24,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME,
    height: FRAME,
    borderWidth: 3,
    borderColor: colors.gold,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanning: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanningText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: '#EF5350',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  btn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  back: {
    padding: 16,
    marginTop: 'auto',
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDim,
  },
});
