import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BudgetsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budgets</Text>
      <Text style={styles.subtitle}>Gérer vos budgets et suivre les dépenses</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
});
