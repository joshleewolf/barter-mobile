import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { validateListingForm } from '../../utils/validation';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Music',
  'Games',
  'Services',
  'Other',
];

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

export default function CreateListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [images, setImages] = useState<string[]>([]);
  const [listingType, setListingType] = useState<'ITEM' | 'SERVICE'>('ITEM');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Filter only positive numbers for estimated value
  const handleValueChange = (text: string) => {
    // Only allow digits and decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = filtered.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered;
    setEstimatedValue(sanitized);
    if (fieldErrors.estimatedValue) {
      setFieldErrors((prev) => ({ ...prev, estimatedValue: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a listing');
      return;
    }

    const validation = validateListingForm({
      title,
      description,
      estimatedValue,
      category,
      images,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      Alert.alert('Validation Error', firstError);
      return;
    }

    setSubmitting(true);
    try {
      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        const fileName = `${user.id}/${Date.now()}_${i}.jpg`;

        const response = await fetch(uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, blob, { upsert: true });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          // Use placeholder if upload fails
          imageUrls.push(`https://via.placeholder.com/400?text=Image${i + 1}`);
        } else {
          const { data } = supabase.storage.from('listings').getPublicUrl(fileName);
          imageUrls.push(data.publicUrl);
        }
      }

      // Insert listing into Supabase
      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        title,
        description,
        estimated_value: parseFloat(estimatedValue),
        category,
        condition: listingType === 'ITEM' ? condition : null,
        type: listingType,
        images: imageUrls,
        status: 'ACTIVE' as const,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success!', 'Your listing has been created', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Create listing error:', error);
      Alert.alert('Error', error.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.header, { color: colors.text }]}>Create Listing</Text>

      {/* Type Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: colors.surface },
              listingType === 'ITEM' && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setListingType('ITEM')}
          >
            <MaterialIcons name="inventory-2" size={20} color={listingType === 'ITEM' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.typeText, { color: colors.textSecondary }, listingType === 'ITEM' && { color: colors.primary }]}>
              Item
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: colors.surface },
              listingType === 'SERVICE' && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setListingType('SERVICE')}
          >
            <MaterialIcons name="build" size={20} color={listingType === 'SERVICE' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.typeText, { color: colors.textSecondary }, listingType === 'SERVICE' && { color: colors.primary }]}>
              Service
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Images */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Photos *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.imagesRow}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => removeImage(index)}
                >
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={[styles.addImage, { borderColor: colors.border }]} onPress={pickImage}>
                <MaterialIcons name="add-a-photo" size={24} color={colors.textMuted} />
                <Text style={[styles.addImageText, { color: colors.textMuted }]}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            fieldErrors.title && styles.inputError
          ]}
          placeholder="What are you listing?"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
          }}
          maxLength={100}
        />
        {fieldErrors.title ? (
          <Text style={styles.errorText}>{fieldErrors.title}</Text>
        ) : null}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Description *</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            fieldErrors.description && styles.inputError
          ]}
          placeholder="Describe your item or service..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
          }}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />
        {fieldErrors.description ? (
          <Text style={styles.errorText}>{fieldErrors.description}</Text>
        ) : null}
      </View>

      {/* Estimated Value */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Estimated Value ($) *</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            fieldErrors.estimatedValue && styles.inputError
          ]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          value={estimatedValue}
          onChangeText={handleValueChange}
          keyboardType="decimal-pad"
        />
        {fieldErrors.estimatedValue ? (
          <Text style={styles.errorText}>{fieldErrors.estimatedValue}</Text>
        ) : null}
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: colors.textSecondary },
                    category === cat && { color: colors.textInverse, fontWeight: '600' }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Condition (for items only) */}
      {listingType === 'ITEM' && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Condition</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={cond.value}
                style={[
                  styles.conditionChip,
                  { backgroundColor: colors.surface },
                  condition === cond.value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setCondition(cond.value)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    { color: colors.textSecondary },
                    condition === cond.value && { color: colors.textInverse, fontWeight: '600' },
                  ]}
                >
                  {cond.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
          {submitting ? 'Creating...' : 'Create Listing'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: insets.bottom + Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    borderWidth: 1,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  typeText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  imagesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: FontSizes.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: FontSizes.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  conditionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  conditionText: {
    fontSize: FontSizes.sm,
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
