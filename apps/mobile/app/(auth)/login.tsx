import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api-client';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { loginParent } = useAuth();

  async function handleParentLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginParent(email.trim().toLowerCase(), password);
      router.replace('/(parent)/dashboard');
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.status === 401 ? 'Email ou mot de passe incorrect.' : err.message)
        : 'Impossible de se connecter. Vérifie ta connexion.';
      Alert.alert('Connexion échouée', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>⭐</Text>
          <Text style={styles.logoTitle}>KidPoints</Text>
          <Text style={styles.logoSub}>Espace parents</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={Colors.textFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleParentLogin}
          />
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleParentLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* Inscription */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.8}
        >
          <Text style={styles.registerText}>
            Pas encore de compte ?{' '}
            <Text style={{ color: Colors.gold, fontWeight: '900' }}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    justifyContent: 'center',
    gap: 32,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 8,
  },
  logoEmoji: {
    fontSize: 56,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDim,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#1a1000',
    fontSize: 16,
    fontWeight: '900',
  },
  forgotBtn:  { alignItems: 'center', paddingTop: 8 },
  forgotText: { fontSize: 13, fontWeight: '700', color: Colors.textFaint },

  registerBtn:  { alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border },
  registerText: { fontSize: 14, fontWeight: '600', color: Colors.textDim },

});
