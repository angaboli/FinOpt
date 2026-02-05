/**
 * Privacy Policy Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';

export default function PrivacyScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confidentialité</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : Février 2026</Text>

        <Text style={styles.sectionTitle}>1. Collecte des données</Text>
        <Text style={styles.paragraph}>
          Finopt collecte uniquement les données nécessaires au fonctionnement du service : votre adresse email, votre nom, et les données financières que vous saisissez (comptes, transactions, budgets, objectifs).
        </Text>

        <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
        <Text style={styles.paragraph}>
          Vos données sont utilisées exclusivement pour vous fournir les fonctionnalités de l'application : suivi des dépenses, gestion budgétaire, analyse par intelligence artificielle et notifications personnalisées.
        </Text>

        <Text style={styles.sectionTitle}>3. Stockage et sécurité</Text>
        <Text style={styles.paragraph}>
          Vos données sont stockées de manière sécurisée sur des serveurs PostgreSQL avec chiffrement au repos. Les communications sont protégées par HTTPS/TLS. L'accès aux données est isolé par utilisateur grâce aux politiques Row-Level Security (RLS).
        </Text>

        <Text style={styles.sectionTitle}>4. Intelligence artificielle</Text>
        <Text style={styles.paragraph}>
          Les insights IA sont générés en envoyant vos données de transactions anonymisées à l'API Claude d'Anthropic. Ces données ne sont pas conservées par le fournisseur d'IA au-delà du traitement de la requête.
        </Text>

        <Text style={styles.sectionTitle}>5. Partage des données</Text>
        <Text style={styles.paragraph}>
          Finopt ne vend, ne loue et ne partage jamais vos données personnelles ou financières avec des tiers à des fins commerciales.
        </Text>

        <Text style={styles.sectionTitle}>6. Vos droits</Text>
        <Text style={styles.paragraph}>
          Vous pouvez à tout moment : consulter vos données, les modifier, les exporter ou supprimer votre compte et toutes les données associées depuis les paramètres de l'application.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question relative à la confidentialité, contactez-nous à : privacy@finopt.app
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    fontSize: typography.body.regular.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  placeholder: {
    width: 50,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  lastUpdated: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[700],
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
