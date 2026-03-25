import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';

import { api } from '@/lib/api';
import { colors, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { isSignedIn } = useAuth();

  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<{ displayName: string; email: string | null }>('/users/me'),
    enabled: isSignedIn,
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              Welcome{user?.displayName ? `, ${user.displayName}` : ''}
            </Text>
            <Text style={styles.greetingSubtext}>Ready to coordinate your crew?</Text>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No active sessions</Text>
            <Text style={styles.emptyDescription}>
              Start a session to see your group on a live map, or join one with an invite link.
            </Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  greeting: {
    marginBottom: spacing.xl,
  },
  greetingText: {
    ...typography.h2,
    color: colors.text.primary,
  },
  greetingSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  startButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing['2xl'],
  },
  startButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
});
