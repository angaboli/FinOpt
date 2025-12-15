import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddTransactionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter Transaction</Text>
      <Text style={styles.subtitle}>Saisie manuelle d'une transaction</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});
