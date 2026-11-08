import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Icon, TextField, Typography } from '../../components/ui';
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '../../components/forms';
import { useProfile, useUpdateProfileRoot } from '../../features/profile/useProfile';
import { isValidEmail, isValidUrl } from '../../utils/validation';

export const ContactInfoScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfileRoot();

  // Form states
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [customLinks, setCustomLinks] = useState<
    { id: string; label: string; url: string }[]
  >([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Populate from query
  useEffect(() => {
    if (profile) {
      setFullName(profile.contact?.fullName || '');
      setHeadline(profile.headline || profile.contact?.headline || '');
      setEmail(profile.contact?.email || '');
      setPhone(profile.contact?.phone || '');
      setLocation(profile.contact?.location || '');
      setWebsite(profile.contact?.website || '');
      setLinkedin(profile.contact?.linkedin || '');
      setGithub(profile.contact?.github || '');
      setCustomLinks(
        (profile.contact?.customLinks || []).map((l, i) => ({
          id: l.id || `link_${i}`,
          label: l.label,
          url: l.url,
        }))
      );
      setIsDirty(false);
    }
  }, [profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (website.trim() && !isValidUrl(website.trim())) {
      errs.website = 'Please enter a valid URL (e.g., https://mysite.com)';
    }
    if (linkedin.trim() && !isValidUrl(linkedin.trim())) {
      errs.linkedin = 'Please enter a valid LinkedIn URL';
    }
    if (github.trim() && !isValidUrl(github.trim())) {
      errs.github = 'Please enter a valid GitHub URL';
    }

    customLinks.forEach((link, idx) => {
      if (!link.label.trim()) {
        errs[`custom_label_${idx}`] = 'Label required';
      }
      if (!link.url.trim()) {
        errs[`custom_url_${idx}`] = 'URL required';
      } else if (!isValidUrl(link.url.trim())) {
        errs[`custom_url_${idx}`] = 'Invalid URL';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddCustomLink = () => {
    setCustomLinks([
      ...customLinks,
      { id: `link_${Date.now()}`, label: '', url: '' },
    ]);
    setIsDirty(true);
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleUpdateCustomLink = (
    index: number,
    field: 'label' | 'url',
    val: string
  ) => {
    const updated = [...customLinks];
    const link = updated[index];
    if (!link) return;
    link[field] = val;
    setCustomLinks(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await updateProfile.mutateAsync({
        headline,
        contact: {
          fullName: fullName.trim(),
          headline: headline.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim(),
          website: website.trim(),
          linkedin: linkedin.trim(),
          github: github.trim(),
          customLinks: customLinks.map((l) => ({
            label: l.label.trim(),
            url: l.url.trim(),
          })),
        },
      });
      setIsDirty(false);
      navigation.goBack();
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to update contact info.' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        testID="contact-info-screen"
      >
        <Typography variant="h2" weight="bold">
          Contact Information
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Personal details appearing in the header of your resumes.
        </Typography>

        {errors.form && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: `${theme.colors.error}20` },
            ]}
          >
            <Typography variant="caption" color="error">
              {errors.form}
            </Typography>
          </View>
        )}

        <View style={styles.formGroup}>
          <TextField
            label="Full Name *"
            placeholder="e.g. Alex Morgan"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              setIsDirty(true);
            }}
            error={errors.fullName}
            autoCapitalize="words"
            testID="contact-fullname-input"
          />

          <TextField
            label="Professional Headline"
            placeholder="e.g. Staff Distributed Systems Engineer"
            value={headline}
            onChangeText={(t) => {
              setHeadline(t);
              setIsDirty(true);
            }}
            testID="contact-headline-input"
          />

          <TextField
            label="Email Address *"
            placeholder="e.g. alex@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setIsDirty(true);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            testID="contact-email-input"
          />

          <TextField
            label="Phone Number"
            placeholder="e.g. +1 (555) 234-5678"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setIsDirty(true);
            }}
            keyboardType="phone-pad"
            testID="contact-phone-input"
          />

          <TextField
            label="Location"
            placeholder="e.g. San Francisco, CA"
            value={location}
            onChangeText={(t) => {
              setLocation(t);
              setIsDirty(true);
            }}
            testID="contact-location-input"
          />
        </View>

        {/* Online Profiles & Links */}
        <Typography
          variant="h3"
          weight="bold"
          style={styles.sectionHeader}
        >
          Online Profiles & Portfolio
        </Typography>

        <View style={styles.formGroup}>
          <TextField
            label="Personal Website"
            placeholder="https://yourportfolio.com"
            value={website}
            onChangeText={(t) => {
              setWebsite(t);
              setIsDirty(true);
            }}
            autoCapitalize="none"
            keyboardType="url"
            error={errors.website}
            testID="contact-website-input"
          />

          <TextField
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/username"
            value={linkedin}
            onChangeText={(t) => {
              setLinkedin(t);
              setIsDirty(true);
            }}
            autoCapitalize="none"
            keyboardType="url"
            error={errors.linkedin}
            testID="contact-linkedin-input"
          />

          <TextField
            label="GitHub URL"
            placeholder="https://github.com/username"
            value={github}
            onChangeText={(t) => {
              setGithub(t);
              setIsDirty(true);
            }}
            autoCapitalize="none"
            keyboardType="url"
            error={errors.github}
            testID="contact-github-input"
          />
        </View>

        {/* Dynamic Custom Links */}
        <View style={styles.customLinksHeader}>
          <Typography variant="body" weight="semibold">
            Custom Links
          </Typography>
          <TouchableOpacity
            onPress={handleAddCustomLink}
            style={styles.addCustomLinkBtn}
            testID="add-custom-link-btn"
          >
            <Icon name="Plus" size={16} color={theme.colors.primary} />
            <Typography variant="caption" color="primary" weight="bold">
              Add Link
            </Typography>
          </TouchableOpacity>
        </View>

        {customLinks.map((link, idx) => (
          <View
            key={link.id}
            style={[
              styles.customLinkRow,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.customLinkFields}>
              <TextField
                label="Label"
                placeholder="e.g. Medium, Dribbble"
                value={link.label}
                onChangeText={(t) => handleUpdateCustomLink(idx, 'label', t)}
                error={errors[`custom_label_${idx}`]}
                containerStyle={{ marginBottom: 8 }}
              />
              <TextField
                label="URL"
                placeholder="https://..."
                value={link.url}
                onChangeText={(t) => handleUpdateCustomLink(idx, 'url', t)}
                autoCapitalize="none"
                keyboardType="url"
                error={errors[`custom_url_${idx}`]}
              />
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveCustomLink(idx)}
              style={styles.removeLinkBtn}
              accessibilityRole="button"
              accessibilityLabel="Remove custom link"
              testID={`remove-custom-link-${idx}`}
            >
              <Icon name="Trash2" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Save button */}
        <Button
          variant="primary"
          title="Save Contact Details"
          loading={updateProfile.isPending}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-contact-info-btn"
        />
      </ScrollView>

      <UnsavedChangesDialog {...dialogProps} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  formGroup: {
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  customLinksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCustomLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    minHeight: 44,
  },
  customLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  customLinkFields: {
    flex: 1,
  },
  removeLinkBtn: {
    padding: 10,
    marginLeft: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    marginTop: 16,
  },
});
