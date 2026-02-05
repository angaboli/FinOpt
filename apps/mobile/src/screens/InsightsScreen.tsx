/**
 * Insights Screen - AI-powered financial insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LoadingSpinner, ErrorMessage } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';

interface Insight {
  id: string;
  month_year: string;
  data: {
    summary?: string;
    recommendations?: string[];
    spending_patterns?: { category: string; amount: number; trend: string }[];
    anomalies?: string[];
    opportunities?: string[];
  };
  income_estimate: number | null;
  fixed_costs_estimate: number | null;
  generated_at: string;
}

export default function InsightsScreen() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.listInsights();
      setInsights(data as unknown as Insight[]);
    } catch (err: any) {
      setError('Impossible de charger les insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    setIsGenerating(true);
    try {
      await apiClient.generateInsights(monthYear);
      await loadInsights();
      Alert.alert('Insights générés avec succès !');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Erreur lors de la génération';
      Alert.alert('Erreur', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatMonth = (monthYear: string): string => {
    const [year, month] = monthYear.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  if (error && !isLoading && insights.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights IA</Text>
        </View>
        <ErrorMessage message={error} onRetry={loadInsights} fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights IA</Text>
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={colors.neutral.white} />
          ) : (
            <Text style={styles.generateButtonText}>Générer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadInsights} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && insights.length === 0 ? (
          <LoadingSpinner message="Chargement des insights..." />
        ) : insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💡</Text>
            <Text style={styles.emptyStateTitle}>Aucun insight</Text>
            <Text style={styles.emptyStateText}>
              Générez vos premiers insights IA pour recevoir des recommandations personnalisées
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleGenerate} disabled={isGenerating}>
              <Text style={styles.emptyStateButtonText}>
                {isGenerating ? 'Génération...' : 'Générer mes insights'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightMonth}>{formatMonth(insight.month_year)}</Text>
                <Text style={styles.insightDate}>
                  {new Date(insight.generated_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              {/* Estimations */}
              {(insight.income_estimate || insight.fixed_costs_estimate) && (
                <View style={styles.estimatesRow}>
                  {insight.income_estimate != null && (
                    <View style={styles.estimateItem}>
                      <Text style={styles.estimateLabel}>Revenus estimés</Text>
                      <Text style={[styles.estimateValue, { color: colors.status.success }]}>
                        {insight.income_estimate.toFixed(0)} €
                      </Text>
                    </View>
                  )}
                  {insight.fixed_costs_estimate != null && (
                    <View style={styles.estimateItem}>
                      <Text style={styles.estimateLabel}>Charges fixes</Text>
                      <Text style={[styles.estimateValue, { color: colors.status.error }]}>
                        {insight.fixed_costs_estimate.toFixed(0)} €
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Summary */}
              {insight.data?.summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Résumé</Text>
                  <Text style={styles.sectionText}>{insight.data.summary}</Text>
                </View>
              )}

              {/* Recommendations */}
              {insight.data?.recommendations && insight.data.recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommandations</Text>
                  {insight.data.recommendations.map((rec, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.listBullet}>💡</Text>
                      <Text style={styles.listText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Anomalies */}
              {insight.data?.anomalies && insight.data.anomalies.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Anomalies détectées</Text>
                  {insight.data.anomalies.map((a, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.listBullet}>⚠️</Text>
                      <Text style={styles.listText}>{a}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Opportunities */}
              {insight.data?.opportunities && insight.data.opportunities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Opportunités</Text>
                  {insight.data.opportunities.map((o, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.listBullet}>🎯</Text>
                      <Text style={styles.listText}>{o}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
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
  title: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    color: colors.neutral[800],
  },
  generateButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: colors.neutral.white,
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.neutral.white,
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  insightMonth: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  insightDate: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[500],
  },
  estimatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  estimateItem: {
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  estimateValue: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  listBullet: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[700],
    lineHeight: 20,
  },
});
