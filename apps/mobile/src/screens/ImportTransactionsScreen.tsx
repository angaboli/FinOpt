/**
 * Import Transactions Screen - Modal for importing transactions from file
 * Supports CSV, Excel (.xlsx), JSON, PDF - format detected from file extension
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Upload, FileText, CheckCircle } from 'lucide-react-native';
import { Button } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  '.csv': 'CSV',
  '.xlsx': 'EXCEL',
  '.xls': 'EXCEL',
  '.json': 'JSON',
  '.pdf': 'PDF',
};

const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_TO_FILE_TYPE);

function detectFileType(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (lower.endsWith(ext)) return EXTENSION_TO_FILE_TYPE[ext];
  }
  return null;
}

export default function ImportTransactionsScreen({ navigation }: any) {
  const { accounts, fetchAccounts, fetchTransactions } = useDataStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts.length > 0 ? accounts[0].id : null
  );
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
    fileType: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      fetchAccounts();
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const handlePickFile = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        const detectedType = detectFileType(asset.name);

        if (!detectedType) {
          Alert.alert(
            'Format non supporte',
            `Formats acceptes : CSV, Excel (.xlsx), JSON, PDF.\n\nFichier choisi : ${asset.name}`
          );
          return;
        }

        setSelectedFile({
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
          fileType: detectedType,
        });
        setResult(null);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de selectionner le fichier');
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
      Alert.alert('Erreur', 'Veuillez selectionner un compte');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Erreur', 'Veuillez choisir un fichier');
      return;
    }

    setIsImporting(true);
    try {
      const base64Data = await readAsStringAsync(selectedFile.uri, {
        encoding: EncodingType.Base64,
      });

      const response = await apiClient.importTransactions({
        account_id: selectedAccountId,
        file_type: selectedFile.fileType,
        file_data: base64Data,
        file_name: selectedFile.name,
      });

      setResult({
        imported: response.transactionsImported,
        errors: response.errors || [],
      });

      await fetchTransactions({ limit: 100 });
      await fetchAccounts();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || err.message || "Erreur lors de l'import";
      Alert.alert('Erreur', msg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Importer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success result */}
        {result && (
          <View style={styles.resultContainer}>
            <CheckCircle size={48} color={colors.status.success} />
            <Text style={styles.resultTitle}>Import termine !</Text>
            <Text style={styles.resultCount}>
              {result.imported} transaction{result.imported !== 1 ? 's' : ''} importee{result.imported !== 1 ? 's' : ''}
            </Text>
            {result.errors.length > 0 && (
              <View style={styles.resultErrors}>
                <Text style={styles.resultErrorsTitle}>
                  {result.errors.length} avertissement{result.errors.length !== 1 ? 's' : ''} :
                </Text>
                {result.errors.slice(0, 5).map((error, i) => (
                  <Text key={i} style={styles.resultErrorText}>
                    {error}
                  </Text>
                ))}
                {result.errors.length > 5 && (
                  <Text style={styles.resultErrorText}>
                    ... et {result.errors.length - 5} autre(s)
                  </Text>
                )}
              </View>
            )}
            <Button
              title="Fermer"
              variant="primary"
              onPress={handleCancel}
              style={styles.closeButton}
            />
          </View>
        )}

        {!result && (
          <>
            {/* Account selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compte cible *</Text>
              {accounts.length > 0 ? (
                <View style={styles.accountSelector}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        selectedAccountId === account.id &&
                          styles.accountOptionSelected,
                      ]}
                      onPress={() => setSelectedAccountId(account.id)}
                    >
                      <View style={styles.accountOptionContent}>
                        <Text
                          style={[
                            styles.accountOptionText,
                            selectedAccountId === account.id &&
                              styles.accountOptionTextSelected,
                          ]}
                        >
                          {account.name}
                        </Text>
                        <Text
                          style={[
                            styles.accountOptionBalance,
                            selectedAccountId === account.id &&
                              styles.accountOptionBalanceSelected,
                          ]}
                        >
                          {account.balance.toFixed(2)} {account.currency}
                        </Text>
                      </View>
                      {selectedAccountId === account.id && (
                        <Text style={styles.accountCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noAccountContainer}>
                  <Text style={styles.noAccountText}>
                    Aucun compte disponible. Creez un compte d'abord.
                  </Text>
                </View>
              )}
            </View>

            {/* File picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fichier</Text>
              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={handlePickFile}
              >
                {selectedFile ? (
                  <View style={styles.selectedFileInfo}>
                    <FileText size={24} color={colors.primary.main} />
                    <View style={styles.selectedFileText}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(selectedFile.size)} — {selectedFile.fileType}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.filePickerContent}>
                    <Upload size={32} color={colors.neutral[400]} />
                    <Text style={styles.filePickerText}>
                      Choisir un fichier
                    </Text>
                    <Text style={styles.filePickerHint}>
                      CSV, Excel, JSON ou PDF
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Le format est detecte automatiquement selon l'extension du
                fichier. Le fichier doit contenir des colonnes pour la date, la
                description et le montant.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={handleCancel}
                style={styles.actionButton}
              />
              <Button
                title={isImporting ? 'Import en cours...' : 'Importer'}
                variant="primary"
                onPress={handleImport}
                loading={isImporting}
                disabled={!selectedAccountId || !selectedFile || isImporting}
                style={styles.actionButton}
              />
            </View>
          </>
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
  cancelButton: {
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
    width: 60,
  },
  content: {
    flex: 1,
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
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  accountSelector: {
    gap: spacing.sm,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  accountOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  accountOptionContent: {
    flex: 1,
  },
  accountOptionText: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  accountOptionTextSelected: {
    color: colors.primary.main,
  },
  accountOptionBalance: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  accountOptionBalanceSelected: {
    color: colors.primary.dark,
  },
  accountCheckmark: {
    fontSize: 20,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
  noAccountContainer: {
    padding: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  noAccountText: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  filePickerButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: spacing.lg,
  },
  filePickerContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  filePickerText: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  filePickerHint: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[400],
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedFileText: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  fileSize: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[500],
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.body.small.fontSize,
    color: colors.primary.dark,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  resultContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    gap: spacing.md,
  },
  resultTitle: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    color: colors.neutral[800],
  },
  resultCount: {
    fontSize: typography.body.large.fontSize,
    color: colors.neutral[600],
  },
  resultErrors: {
    width: '100%',
    backgroundColor: colors.status.warningLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  resultErrorsTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  resultErrorText: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  closeButton: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
});
