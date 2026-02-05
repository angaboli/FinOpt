/**
 * Settings Screen - User preferences and app settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Pencil, Lock, CreditCard, Wallet, Target, Lightbulb, Bell,
  DollarSign, Globe, Download, FileText, HelpCircle, Info,
  TestTube, Trash2,
} from 'lucide-react-native';
import { useAuthStore } from '../store';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';
import runManualTests from '../test/manual-test';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingsItemLeft}>
      <View style={styles.settingsItemIcon}>{icon}</View>
      <Text style={styles.settingsItemLabel}>{label}</Text>
    </View>
    <View style={styles.settingsItemRight}>
      {value && <Text style={styles.settingsItemValue}>{value}</Text>}
      {showArrow && onPress && <Text style={styles.settingsItemArrow}>›</Text>}
    </View>
  </TouchableOpacity>
);

interface SettingsToggleProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
}) => (
  <View style={styles.settingsToggle}>
    <View style={styles.settingsToggleLeft}>
      <View style={styles.settingsItemIcon}>{icon}</View>
      <View style={styles.settingsToggleText}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
        {description && <Text style={styles.settingsToggleDescription}>{description}</Text>}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.neutral[300], true: colors.primary.light }}
      thumbColor={value ? colors.primary.main : colors.neutral.white}
    />
  </View>
);

export default function SettingsScreen({ navigation }: any) {
  const { user, signOut } = useAuthStore();
  const [notificationPrefs, setNotificationPrefs] = useState({
    budgetAlerts: true,
    goalMilestones: true,
    insights: true,
    transactionAlerts: false,
  });
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    loadNotificationPrefs();
  }, []);

  const loadNotificationPrefs = async () => {
    try {
      const prefs = await apiClient.getNotificationPreferences();
      setNotificationPrefs({
        budgetAlerts: prefs.budgetWarningsEnabled ?? true,
        goalMilestones: prefs.budgetExceededEnabled ?? true,
        insights: prefs.insightsEnabled ?? true,
        transactionAlerts: prefs.anomalyAlertsEnabled ?? false,
      });
    } catch {
      // Use defaults if API fails
    }
  };

  const updateNotifPref = async (key: string, value: boolean) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
    const mapping: Record<string, string> = {
      budgetAlerts: 'budget_warnings_enabled',
      goalMilestones: 'budget_exceeded_enabled',
      insights: 'insights_enabled',
      transactionAlerts: 'anomaly_alerts_enabled',
    };
    try {
      await apiClient.updateNotificationPreferences({ [mapping[key]]: value });
    } catch {
      // Revert on failure
      setNotificationPrefs((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleManageAccounts = () => {
    navigation.navigate('Accounts');
  };

  const handleCurrency = () => {
    Alert.alert('Devise', 'Fonctionnalité à venir...');
  };

  const handleLanguage = () => {
    Alert.alert('Langue', 'Fonctionnalité à venir...');
  };

  const handleExportData = () => {
    Alert.alert('Export de données', 'Fonctionnalité à venir...');
  };

  const handleRunTests = async () => {
    Alert.alert(
      'Tests API',
      'Voulez-vous lancer les tests de toutes les fonctionnalités API ?\n\n⚠️ Cela créera et supprimera des données de test.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Lancer les tests',
          onPress: async () => {
            setIsRunningTests(true);
            try {
              await runManualTests();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setIsRunningTests(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.\n\nEntrez votre mot de passe pour confirmer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.prompt?.(
              'Confirmation',
              'Entrez votre mot de passe',
              async (password: string) => {
                if (!password) return;
                try {
                  await apiClient.deleteUserAccount(password);
                  await signOut();
                } catch (err: any) {
                  Alert.alert('Erreur', err.response?.data?.detail || 'Impossible de supprimer le compte');
                }
              },
              'secure-text'
            ) || (async () => {
              // Fallback for Android (no Alert.prompt)
              try {
                await apiClient.deleteUserAccount('confirm');
                await signOut();
              } catch (err: any) {
                Alert.alert('Erreur', err.response?.data?.detail || 'Impossible de supprimer le compte');
              }
            })();
          },
        },
      ]
    );
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };

  const handlePrivacy = () => {
    navigation.navigate('Privacy');
  };

  const handleTerms = () => {
    navigation.navigate('Terms');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <Card style={styles.sectionCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.fullName || 'Utilisateur'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <SettingsItem icon={<Pencil size={20} color={colors.neutral[600]} />} label="Modifier le profil" onPress={handleEditProfile} />
            <SettingsItem icon={<Lock size={20} color={colors.neutral[600]} />} label="Changer le mot de passe" onPress={handleChangePassword} />
            <SettingsItem icon={<CreditCard size={20} color={colors.neutral[600]} />} label="Gérer les comptes" onPress={handleManageAccounts} />
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card style={styles.sectionCard}>
            <SettingsToggle
              icon={<Wallet size={20} color={colors.neutral[600]} />}
              label="Alertes de budget"
              description="Recevoir des alertes lorsque vous dépassez vos budgets"
              value={notificationPrefs.budgetAlerts}
              onValueChange={(value) => updateNotifPref('budgetAlerts', value)}
            />
            <View style={styles.divider} />
            <SettingsToggle
              icon={<Target size={20} color={colors.neutral[600]} />}
              label="Étapes des objectifs"
              description="Notifications pour les étapes importantes de vos objectifs"
              value={notificationPrefs.goalMilestones}
              onValueChange={(value) => updateNotifPref('goalMilestones', value)}
            />
            <View style={styles.divider} />
            <SettingsToggle
              icon={<Lightbulb size={20} color={colors.neutral[600]} />}
              label="Insights mensuels"
              description="Recevoir des analyses et recommandations chaque mois"
              value={notificationPrefs.insights}
              onValueChange={(value) => updateNotifPref('insights', value)}
            />
            <View style={styles.divider} />
            <SettingsToggle
              icon={<Bell size={20} color={colors.neutral[600]} />}
              label="Alertes de transactions"
              description="Notifications pour chaque nouvelle transaction"
              value={notificationPrefs.transactionAlerts}
              onValueChange={(value) => updateNotifPref('transactionAlerts', value)}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          <Card style={styles.sectionCard}>
            <SettingsItem icon={<DollarSign size={20} color={colors.neutral[600]} />} label="Devise" value="EUR (€)" onPress={handleCurrency} />
            <View style={styles.divider} />
            <SettingsItem icon={<Globe size={20} color={colors.neutral[600]} />} label="Langue" value="Français" onPress={handleLanguage} />
          </Card>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données & Confidentialité</Text>
          <Card style={styles.sectionCard}>
            <SettingsItem icon={<Download size={20} color={colors.neutral[600]} />} label="Exporter mes données" onPress={handleExportData} />
            <View style={styles.divider} />
            <SettingsItem icon={<Lock size={20} color={colors.neutral[600]} />} label="Politique de confidentialité" onPress={handlePrivacy} />
            <View style={styles.divider} />
            <SettingsItem icon={<FileText size={20} color={colors.neutral[600]} />} label="Conditions d'utilisation" onPress={handleTerms} />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.sectionCard}>
            <SettingsItem icon={<HelpCircle size={20} color={colors.neutral[600]} />} label="Aide & FAQ" onPress={handleHelp} />
            <View style={styles.divider} />
            <SettingsItem icon={<Info size={20} color={colors.neutral[600]} />} label="À propos" value="v1.0.0" showArrow={false} />
          </Card>
        </View>

        {/* Developer Section - visible uniquement en dev */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Développement & Tests</Text>
            <Card style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleRunTests}
                disabled={isRunningTests}
              >
                {isRunningTests ? (
                  <ActivityIndicator color={colors.primary.main} />
                ) : (
                  <View style={styles.testButtonIcon}><TestTube size={24} color={colors.primary.main} /></View>
                )}
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonLabel}>
                    {isRunningTests ? 'Tests en cours...' : 'Lancer les tests API'}
                  </Text>
                  <Text style={styles.testButtonDescription}>
                    Teste toutes les fonctionnalités (comptes, transactions, budgets, objectifs)
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone de danger</Text>
          <Card style={styles.sectionCard}>
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
              <View style={styles.dangerItemIcon}><Trash2 size={20} color={colors.status.error} /></View>
              <Text style={styles.dangerItemLabel}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Finopt © 2025</Text>
          <Text style={styles.footerText}>Made with ❤️</Text>
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
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body.small.fontSize,
    fontWeight: '600',
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    padding: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    width: 24,
    alignItems: 'center' as const,
    marginRight: spacing.sm,
  },
  settingsItemLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[800],
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemValue: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
    marginRight: spacing.xs,
  },
  settingsItemArrow: {
    fontSize: 24,
    color: colors.neutral[400],
  },
  settingsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  settingsToggleText: {
    flex: 1,
  },
  settingsToggleDescription: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: typography.body.small.lineHeight * 1.3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.md,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  testButtonIcon: {
    width: 28,
    alignItems: 'center' as const,
    marginRight: spacing.md,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonLabel: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  testButtonDescription: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    lineHeight: typography.body.small.lineHeight * 1.3,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dangerItemIcon: {
    width: 24,
    alignItems: 'center' as const,
    marginRight: spacing.sm,
  },
  dangerItemLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.status.error,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.status.error,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  signOutButtonText: {
    color: colors.status.error,
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
});
