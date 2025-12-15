import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finopt</Text>
      <Text style={styles.subtitle}>Connexion / Inscription</Text>
      <Text style={styles.note}>Utilisez Supabase Auth pour l'authentification</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#3b82f6' },
  title: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#fff', marginBottom: 24 },
  note: { fontSize: 12, color: '#fff', opacity: 0.8, textAlign: 'center' },
});
