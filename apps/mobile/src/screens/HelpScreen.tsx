/**
 * Help & FAQ Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';

const FAQ_ITEMS = [
  {
    question: 'Comment ajouter un compte bancaire ?',
    answer: 'Allez dans l\'onglet "Accueil" puis appuyez sur "Comptes" ou via les Paramètres > Gérer les comptes. Appuyez sur "+ Ajouter" pour créer un nouveau compte.',
  },
  {
    question: 'Comment ajouter une transaction ?',
    answer: 'Depuis l\'onglet "Transactions", appuyez sur "+ Ajouter". Remplissez le montant (négatif pour une dépense, positif pour un revenu), sélectionnez le compte et la catégorie.',
  },
  {
    question: 'Comment créer un budget ?',
    answer: 'Allez dans l\'onglet "Budgets" et appuyez sur "+ Ajouter". Sélectionnez une catégorie, définissez un montant et une période. Vous recevrez des alertes quand vous approchez la limite.',
  },
  {
    question: 'Comment fonctionnent les insights IA ?',
    answer: 'Les insights analysent vos transactions pour identifier des tendances de dépenses, des anomalies et vous fournir des recommandations personnalisées. Accédez-y depuis le raccourci "Insights IA" sur le tableau de bord.',
  },
  {
    question: 'Comment définir un objectif d\'épargne ?',
    answer: 'Depuis l\'onglet "Objectifs", créez un nouvel objectif avec un montant cible et une date. L\'app calculera automatiquement combien épargner chaque mois.',
  },
  {
    question: 'Comment modifier mon mot de passe ?',
    answer: 'Allez dans Paramètres > Changer le mot de passe. Entrez votre mot de passe actuel puis le nouveau mot de passe (minimum 8 caractères).',
  },
  {
    question: 'Comment supprimer mon compte ?',
    answer: 'Allez dans Paramètres > Zone de danger > Supprimer mon compte. Cette action est irréversible et supprimera toutes vos données.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Oui, vos données sont chiffrées en transit (HTTPS) et au repos. Nous utilisons l\'authentification JWT et les politiques Row-Level Security (RLS) pour isoler vos données.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {expanded
          ? <ChevronUp size={20} color={colors.neutral[600]} />
          : <ChevronDown size={20} color={colors.neutral[600]} />
        }
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Aide & FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>

        <Card style={styles.card}>
          {FAQ_ITEMS.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <View style={styles.divider} />}
              <FAQItem question={item.question} answer={item.answer} />
            </React.Fragment>
          ))}
        </Card>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Besoin d'aide supplémentaire ?</Text>
          <Text style={styles.contactText}>
            Contactez-nous à support@finopt.app
          </Text>
        </View>
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
  sectionTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  card: {
    padding: 0,
  },
  faqItem: {
    padding: spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.md,
  },
  contactSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  contactTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.primary.main,
  },
});
