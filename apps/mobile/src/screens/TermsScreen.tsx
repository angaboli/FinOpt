/**
 * Terms of Service Screen
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

export default function TermsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : Février 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
        <Text style={styles.paragraph}>
          En utilisant l'application Finopt, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
        </Text>

        <Text style={styles.sectionTitle}>2. Description du service</Text>
        <Text style={styles.paragraph}>
          Finopt est une application de gestion financière personnelle qui vous permet de suivre vos comptes, transactions, budgets et objectifs d'épargne. L'application propose également des analyses basées sur l'intelligence artificielle.
        </Text>

        <Text style={styles.sectionTitle}>3. Compte utilisateur</Text>
        <Text style={styles.paragraph}>
          Vous êtes responsable de la confidentialité de vos identifiants de connexion. Vous devez nous signaler immédiatement toute utilisation non autorisée de votre compte.
        </Text>

        <Text style={styles.sectionTitle}>4. Données financières</Text>
        <Text style={styles.paragraph}>
          Les données financières que vous saisissez dans Finopt sont déclaratives. L'application ne se connecte pas directement à vos comptes bancaires. Vous êtes responsable de l'exactitude des informations saisies.
        </Text>

        <Text style={styles.sectionTitle}>5. Limitation de responsabilité</Text>
        <Text style={styles.paragraph}>
          Finopt est un outil d'aide à la gestion financière et ne constitue pas un conseil financier professionnel. Les insights IA sont fournis à titre indicatif et ne doivent pas être considérés comme des recommandations d'investissement.
        </Text>

        <Text style={styles.sectionTitle}>6. Disponibilité du service</Text>
        <Text style={styles.paragraph}>
          Nous nous efforçons de maintenir le service disponible 24/7, mais ne pouvons garantir une disponibilité ininterrompue. Des maintenances programmées peuvent occasionner des interruptions temporaires.
        </Text>

        <Text style={styles.sectionTitle}>7. Résiliation</Text>
        <Text style={styles.paragraph}>
          Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application. La suppression entraîne la destruction définitive de toutes vos données.
        </Text>

        <Text style={styles.sectionTitle}>8. Modifications</Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de modifier ces conditions. Les utilisateurs seront notifiés de tout changement significatif via l'application.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question relative aux conditions d'utilisation : legal@finopt.app
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
