// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

// Password strength validation
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label: PasswordStrength['label'];
  let color: string;

  if (score <= 1) {
    label = 'Weak';
    color = '#ef4444'; // red
  } else if (score === 2) {
    label = 'Fair';
    color = '#f59e0b'; // amber
  } else if (score === 3) {
    label = 'Good';
    color = '#3b82f6'; // blue
  } else {
    label = 'Strong';
    color = '#10b981'; // green
  }

  return { score, label, color, requirements };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  const strength = validatePasswordStrength(password);
  if (strength.score < 2) {
    return { isValid: false, error: 'Password is too weak. Add uppercase, numbers, or special characters.' };
  }

  return { isValid: true };
}

// Username validation
export function validateUsername(username: string): ValidationResult {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { isValid: true };
}

// Display name validation
export function validateDisplayName(name: string): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Display name must be 50 characters or less' };
  }

  return { isValid: true };
}

// Listing validation
export function validateListingTitle(title: string): ValidationResult {
  if (!title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }

  if (title.trim().length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters' };
  }

  if (title.length > 100) {
    return { isValid: false, error: 'Title must be 100 characters or less' };
  }

  return { isValid: true };
}

export function validateListingDescription(description: string): ValidationResult {
  if (!description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }

  if (description.trim().length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters' };
  }

  if (description.length > 2000) {
    return { isValid: false, error: 'Description must be 2000 characters or less' };
  }

  return { isValid: true };
}

export function validateEstimatedValue(value: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, error: 'Estimated value is required' };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue < 0) {
    return { isValid: false, error: 'Value cannot be negative' };
  }

  if (numValue > 1000000) {
    return { isValid: false, error: 'Value seems too high. Please enter a realistic estimate.' };
  }

  return { isValid: true };
}

// Combined form validation
export function validateRegistrationForm(data: {
  displayName: string;
  username: string;
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const displayNameResult = validateDisplayName(data.displayName);
  if (!displayNameResult.isValid) errors.displayName = displayNameResult.error!;

  const usernameResult = validateUsername(data.username);
  if (!usernameResult.isValid) errors.username = usernameResult.error!;

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) errors.email = emailResult.error!;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) errors.password = passwordResult.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateListingForm(data: {
  title: string;
  description: string;
  estimatedValue: string;
  category: string;
  images: string[];
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const titleResult = validateListingTitle(data.title);
  if (!titleResult.isValid) errors.title = titleResult.error!;

  const descriptionResult = validateListingDescription(data.description);
  if (!descriptionResult.isValid) errors.description = descriptionResult.error!;

  const valueResult = validateEstimatedValue(data.estimatedValue);
  if (!valueResult.isValid) errors.estimatedValue = valueResult.error!;

  if (!data.category) {
    errors.category = 'Please select a category';
  }

  if (data.images.length === 0) {
    errors.images = 'Please add at least one image';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
