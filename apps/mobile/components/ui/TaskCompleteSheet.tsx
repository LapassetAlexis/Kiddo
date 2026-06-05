import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Pressable, Animated, TextInput, Keyboard, Image,
} from 'react-native';
import { useRef, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radii } from '@/constants/theme';
import { BASE_URL, getToken } from '@/lib/api-client';

interface Task { id: string; name: string; gold: number; xp: number; }

type Props = {
  task: Task | null;
  onConfirm: (taskId: string, note: string, photoUri?: string) => void;
  onClose: () => void;
};

export default function TaskCompleteSheet({ task, onConfirm, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const [note, setNote]           = useState('');
  const [photoUri, setPhotoUri]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const visible = task !== null;

  useEffect(() => {
    if (visible) {
      setNote('');
      setPhotoUri(null);
      setUploading(false);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, bounciness: 3,
      }).start();
    } else {
      slideAnim.setValue(500);
    }
  }, [visible]);

  function close() {
    Keyboard.dismiss();
    Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }).start(onClose);
  }

  async function confirm() {
    if (!task) return;
    Keyboard.dismiss();
    setUploading(true);

    let uploadedUrl: string | undefined;
    if (photoUri) {
      try {
        const token = await getToken();
        const formData = new FormData();
        formData.append('file', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
        const res = await fetch(`${BASE_URL}/uploads/photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url;
        }
      } catch {}
    }

    Animated.timing(slideAnim, { toValue: 500, duration: 180, useNativeDriver: true }).start(() => {
      onConfirm(task.id, note, uploadedUrl);
    });
    setUploading(false);
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.status !== 'granted') return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Pressable style={styles.overlay} onPress={close}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={Keyboard.dismiss}>

            {/* Handle */}
            <View style={styles.handle} />

            {/* Titre + points */}
            <View style={styles.taskHeader}>
              <View style={styles.taskIcon}>
                <Text style={styles.taskIconText}>📋</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.taskName}>{task.name}</Text>
                <View style={styles.ptsBadge}>
                  <Text style={styles.ptsBadgeText}>+{task.gold}🪙  +{task.xp}⭐</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Message pour ton gardien</Text>
              <Text style={styles.sectionHint}>Facultatif — explique ce que tu as fait</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Ex : J'ai tout rangé, même sous le bureau !"
                placeholderTextColor={Colors.textFaint}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={200}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* Photo */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Preuve en photo</Text>
              <Text style={styles.sectionHint}>Facultatif — montre que c'est vraiment fait !</Text>

              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotoUri(null)}>
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoBtnsRow}>
                  <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.7}>
                    <Text style={styles.photoBtnIcon}>📷</Text>
                    <Text style={styles.photoBtnText}>Appareil photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} activeOpacity={0.7}>
                    <Text style={styles.photoBtnIcon}>🖼️</Text>
                    <Text style={styles.photoBtnText}>Galerie</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Boutons */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.confirmBtn, uploading && { opacity: 0.6 }]} onPress={confirm} activeOpacity={0.85} disabled={uploading}>
                <Text style={styles.confirmBtnText}>{uploading ? 'Envoi en cours…' : "C'est fait ! ✓"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={close} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Pas encore…</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e26',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 12,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 24,
  },

  taskHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 20,
  },
  taskIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  taskIconText: { fontSize: 28 },
  taskName:     { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  ptsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
  },
  ptsBadgeText: { fontSize: 12, fontWeight: '800', color: Colors.gold },

  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },

  section: { marginBottom: 20, gap: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '900', color: Colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 12, fontWeight: '600', color: Colors.textFaint,
    marginTop: -4,
  },

  noteInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14,
    fontSize: 14, fontWeight: '600',
    color: Colors.textPrimary,
    minHeight: 88,
    textAlignVertical: 'top',
  },

  photoBtnsRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  photoBtnIcon: { fontSize: 20 },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textDim },

  photoPreviewWrap: { position: 'relative' },
  photoPreview: {
    width: '100%', height: 160,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
  },
  photoRemove: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 13, fontWeight: '900' },

  actions: { gap: 10 },
  confirmBtn: {
    backgroundColor: Colors.green,
    borderRadius: Radii.md,
    padding: 18, alignItems: 'center',
    shadowColor: Colors.green,
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  confirmBtnText: { fontSize: 17, fontWeight: '900', color: '#fff' },
  cancelBtn: {
    alignItems: 'center', padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textFaint },
});
