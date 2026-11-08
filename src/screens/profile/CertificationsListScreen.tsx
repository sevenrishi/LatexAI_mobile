import React, { useState } from 'react';
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, ConfirmDialog, Icon, Typography } from '../../components/ui';
import { DraggableList } from '../../components/forms';
import {
  useDeleteProfileItem,
  useProfile,
  useReorderProfileSection,
} from '../../features/profile/useProfile';
import { Certification } from '../../types/user';

export const CertificationsListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: profile } = useProfile();
  const deleteItem = useDeleteProfileItem('certifications');
  const reorderSection = useReorderProfileSection('certifications');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const certifications = profile?.certifications || [];

  const handleReorder = (newItems: Certification[]) => {
    const orderedIds = newItems.map((c) => c.id);
    reorderSection.mutate(orderedIds);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatPeriod = (cert: Certification) => {
    const start = cert.issueDate ? `Issued ${cert.issueDate}` : '';
    const expiry = cert.doesNotExpire
      ? 'No Expiration'
      : cert.expiryDate
      ? `Expires ${cert.expiryDate}`
      : '';
    return [start, expiry].filter(Boolean).join(' • ');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="certifications-list-screen"
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Typography variant="h2" weight="bold">
            Certifications
          </Typography>
          <Typography variant="caption" color="secondary">
            Showcase professional credentials, licenses, and verified badges.
          </Typography>
        </View>
        <Button
          variant="primary"
          size="sm"
          title="Add Credential"
          leftIcon={<Icon name="Plus" size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate('CertificationForm')}
          testID="add-certification-btn"
        />
      </View>

      <DraggableList<Certification>
        data={certifications}
        keyExtractor={(item) => item.id}
        onReorder={handleReorder}
        emptyTitle="No certifications yet"
        emptySubtitle="Add AWS, GCP, Cisco, Scrum, or other licenses."
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleWrap}>
                  <Typography variant="body" weight="bold">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" weight="semibold" color="primary">
                    {item.issuer}
                  </Typography>
                </View>

                {/* Edit & Delete actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CertificationForm', {
                        certificationId: item.id,
                      })
                    }
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Edit certification"
                    testID={`edit-certification-${item.id}`}
                  >
                    <Icon
                      name="Edit3"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteId(item.id)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Delete certification"
                    testID={`delete-certification-${item.id}`}
                  >
                    <Icon name="Trash2" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Typography variant="caption" color="secondary">
                  {formatPeriod(item)}
                </Typography>
                {item.credentialUrl || item.url ? (
                  <TouchableOpacity
                    onPress={() => {
                      const link = item.credentialUrl || item.url;
                      if (link) Linking.openURL(link);
                    }}
                    style={styles.verifyLink}
                  >
                    <Icon name="ExternalLink" size={12} color={theme.colors.primary} />
                    <Typography variant="caption" color="primary" weight="medium">
                      Verify
                    </Typography>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ConfirmDialog
        visible={Boolean(deleteId)}
        title="Delete Certification?"
        message="Are you sure you want to remove this credential from your profile?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  verifyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

