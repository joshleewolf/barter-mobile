import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, FontSizes } from '../../constants/theme';
import {
  validateRegistrationForm,
  validatePasswordStrength,
  validateEmail,
  validateUsername,
} from '../../utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Calculate password strength in real-time
  const passwordStrength = useMemo(
    () => validatePasswordStrength(password),
    [password]
  );

  // Validate individual fields on blur
  const handleBlur = (field: string) => {
    let error = '';

    if (field === 'email' && email) {
      const result = validateEmail(email);
      if (!result.isValid) error = result.error!;
    } else if (field === 'username' && username) {
      const result = validateUsername(username);
      if (!result.isValid) error = result.error!;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleRegister = async () => {
    const validation = validateRegistrationForm({
      displayName,
      username,
      email,
      password,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      // Show first error in alert
      const firstError = Object.values(validation.errors)[0];
      Alert.alert('Validation Error', firstError);
      return;
    }

    setLoading(true);
    try {
      await register({ email, username, password, displayName });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>Barter</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, fieldErrors.displayName && { borderColor: colors.error }]}
              placeholder="How should we call you?"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (fieldErrors.displayName) setFieldErrors((prev) => ({ ...prev, displayName: '' }));
              }}
              autoCapitalize="words"
            />
            {fieldErrors.displayName ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{fieldErrors.displayName}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, fieldErrors.username && { borderColor: colors.error }]}
              placeholder="Choose a unique username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: '' }));
              }}
              onBlur={() => handleBlur('username')}
              autoCapitalize="none"
            />
            {fieldErrors.username ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{fieldErrors.username}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, fieldErrors.email && { borderColor: colors.error }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              onBlur={() => handleBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, fieldErrors.password && { borderColor: colors.error }]}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
              secureTextEntry
              autoComplete="new-password"
            />
            {fieldErrors.password ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{fieldErrors.password}</Text>
            ) : null}

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {/* Password Requirements */}
            {password.length > 0 && passwordStrength.score < 4 && (
              <View style={styles.requirementsContainer}>
                <RequirementItem
                  met={passwordStrength.requirements.minLength}
                  text="At least 8 characters"
                  colors={colors}
                />
                <RequirementItem
                  met={passwordStrength.requirements.hasUppercase}
                  text="One uppercase letter"
                  colors={colors}
                />
                <RequirementItem
                  met={passwordStrength.requirements.hasLowercase}
                  text="One lowercase letter"
                  colors={colors}
                />
                <RequirementItem
                  met={passwordStrength.requirements.hasNumber}
                  text="One number"
                  colors={colors}
                />
                <RequirementItem
                  met={passwordStrength.requirements.hasSpecial}
                  text="One special character"
                  colors={colors}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RequirementItem({ met, text, colors }: { met: boolean; text: string; colors: any }) {
  return (
    <Text style={[styles.requirementText, { color: met ? colors.success : colors.textMuted }]}>
      {met ? '✓' : '○'} {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: FontSizes.hero,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FontSizes.lg,
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    borderWidth: 1,
  },
  inputError: {},
  errorText: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    minWidth: 50,
  },
  requirementsContainer: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  requirementText: {
    fontSize: FontSizes.xs,
  },
  requirementMet: {},
  button: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.md,
  },
  linkText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
