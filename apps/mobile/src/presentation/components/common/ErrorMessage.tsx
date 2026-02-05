import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@shared/constants/colors';
import { spacing, borderRadius } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryButtonText?: string;
  fullScreen?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Erreur',
  message,
  onRetry,
  retryButtonText = 'Réessayer',
  fullScreen = false,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.errorBox}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <Button
            title={retryButtonText}
            variant="primary"
            size="medium"
            onPress={onRetry}
            style={styles.retryButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
  },
  errorBox: {
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight as any,
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
});
