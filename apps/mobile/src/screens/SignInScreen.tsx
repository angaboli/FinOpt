import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, LoadingSpinner } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { useAuthStore } from '../store';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const { signIn, signUp, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    try {
      setError(null);
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);

      // Message d'erreur plus explicite
      let errorMessage = 'Une erreur est survenue';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Le serveur ne répond pas. Vérifiez que le backend API est démarré ou utilisez le mode développement ci-dessous.';
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion ou utilisez le mode développement.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (err.response?.status === 409) {
        errorMessage = 'Un compte existe déjà avec cet email';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const handleDevMode = () => {
    // En mode développement, on peut bypasser l'authentification
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'dev-user',
        email: 'dev@finopt.app',
        fullName: 'Dev User',
      },
      token: 'dev-token',
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Connexion en cours..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo et titre */}
        <View style={styles.header}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.title}>Finopt</Text>
          <Text style={styles.subtitle}>Gérez vos finances intelligemment</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {isSignUp && (
            <Input
              label="Nom complet"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}

          <Input
            label="Email"
            placeholder="exemple@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title={isSignUp ? 'Créer un compte' : 'Se connecter'}
            onPress={handleAuth}
            loading={isLoading}
            fullWidth
            style={styles.primaryButton}
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>❌ Erreur</Text>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          <Button
            title={isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            variant="outline"
            fullWidth
          />
        </View>

        {/* Mode développement */}
        <View style={styles.devMode}>
          <Text style={styles.devModeTitle}>Mode Développement</Text>
          <Button
            title="🚀 Accès Rapide (Skip Auth)"
            onPress={handleDevMode}
            variant="secondary"
            size="small"
            fullWidth
          />
          <Text style={styles.devModeNote}>
            Cliquez pour accéder directement à l'app sans authentification
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.main,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.heading.h1.fontSize,
    fontWeight: typography.heading.h1.fontWeight,
    color: colors.neutral.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.neutral.white,
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  error: {
    color: colors.neutral[800],
    fontSize: typography.body.small.fontSize,
    lineHeight: typography.body.small.lineHeight * 1.4,
  },
  devMode: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  devModeTitle: {
    fontSize: typography.body.small.fontSize,
    fontWeight: '600',
    color: colors.neutral.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  devModeNote: {
    fontSize: typography.body.tiny.fontSize,
    color: colors.neutral.white,
    opacity: 0.7,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
