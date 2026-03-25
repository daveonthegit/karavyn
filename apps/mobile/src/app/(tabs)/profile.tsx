import { useAuth, useUser } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';

import { api } from '@/lib/api';
import { colors, spacing, typography, radius } from '@/theme';

interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<UserProfile>('/users/me'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { displayName: string }) => api.patch<UserProfile>('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      setEditing(false);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  const handleEdit = () => {
    setName(profile?.displayName ?? '');
    setEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateMutation.mutate({ displayName: name.trim() });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {profile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          )}
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Display name"
              placeholderTextColor={colors.text.tertiary}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, updateMutation.isPending && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={updateMutation.isPending || !name.trim()}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.displayName}>{profile?.displayName ?? 'User'}</Text>
            <Text style={styles.email}>{profile?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? ''}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Notifications</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Location Permissions</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>About Karavyn</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  displayName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  editButton: {
    borderWidth: 1,
    borderColor: colors.brand.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  editButtonText: {
    ...typography.label,
    color: colors.brand.primary,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.label,
    color: colors.text.inverse,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  settingsLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  settingsArrow: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
  },
  signOutText: {
    ...typography.button,
    color: colors.semantic.error,
  },
});
