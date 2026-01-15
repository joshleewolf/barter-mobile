import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  ActionSheetIOS,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../constants/theme';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isSystem?: boolean;
  systemType?: 'accepted' | 'declined' | 'completed';
  sender: {
    displayName: string;
    avatar?: string;
  };
}

interface TradeInfo {
  status: 'pending' | 'accepted' | 'exchange' | 'completed';
  currentStep: number;
  yourItem: { title: string; image: string };
  theirItem: { title: string; image: string };
  cashAmount?: number;
}

const TRADE_STEPS = ['OFFER', 'ACCEPTED', 'EXCHANGE', 'DONE'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tradeInfo, setTradeInfo] = useState<TradeInfo | null>(null);
  const [otherUser, setOtherUser] = useState({ name: 'Sarah Jenkins', avatar: '', online: true });
  const [showAttachments, setShowAttachments] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    loadTradeInfo();
  }, [id]);

  const loadMessages = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Enhanced mock messages with system messages
    const enhancedMessages: Message[] = [
      {
        id: 'msg-1',
        content: "Hey! I saw your mountain bike. Would you be open to a trade for my Gibson and some cash?",
        senderId: 'user-2',
        createdAt: '2024-10-23T10:42:00Z',
        sender: { displayName: 'Sarah Jenkins', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjQmn0E6lU_PwDjeIC9z8FvqxxLGrRa8rhbkFBkCXYAfWNIv4gCKha5DWkdHuTrmwKcRyYmzAnZHt-e6SZFyowPdwA6LYBvpMy7OvyKwvi3hQCCtJmGZmnf5tHjGXR83lGTHfvj6wTC2GtO8ySx3U3icvCAC-p5VeIKYZ6l9b63YuqT2CQZHr2Ubi1QhzBJkcVTq5sHkRQ2o77P7kY8sa0I5esy9w12dXVJ5jLL5bNSUw_52O3sX3Io_8cKy9lszA2WYa769e5m1Hr' },
      },
      {
        id: 'msg-2',
        content: "Definitely interested! Does the Gibson come with the hard case?",
        senderId: 'user-1',
        createdAt: '2024-10-23T10:45:00Z',
        sender: { displayName: 'You' },
      },
      {
        id: 'msg-system-1',
        content: "Sarah accepted your trade proposal!",
        senderId: 'system',
        createdAt: '2024-10-23T10:50:00Z',
        isSystem: true,
        systemType: 'accepted',
        sender: { displayName: 'System' },
      },
      {
        id: 'msg-3',
        content: "Yes, it includes the original hardshell case. It's in great condition!",
        senderId: 'user-2',
        createdAt: '2024-10-23T11:02:00Z',
        sender: { displayName: 'Sarah Jenkins', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjQmn0E6lU_PwDjeIC9z8FvqxxLGrRa8rhbkFBkCXYAfWNIv4gCKha5DWkdHuTrmwKcRyYmzAnZHt-e6SZFyowPdwA6LYBvpMy7OvyKwvi3hQCCtJmGZmnf5tHjGXR83lGTHfvj6wTC2GtO8ySx3U3icvCAC-p5VeIKYZ6l9b63YuqT2CQZHr2Ubi1QhzBJkcVTq5sHkRQ2o77P7kY8sa0I5esy9w12dXVJ5jLL5bNSUw_52O3sX3Io_8cKy9lszA2WYa769e5m1Hr' },
      },
      {
        id: 'msg-4',
        content: "Shall we meet tomorrow at the Downtown Park parking lot? Say around 5 PM?",
        senderId: 'user-2',
        createdAt: '2024-10-23T11:03:00Z',
        sender: { displayName: 'Sarah Jenkins', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjQmn0E6lU_PwDjeIC9z8FvqxxLGrRa8rhbkFBkCXYAfWNIv4gCKha5DWkdHuTrmwKcRyYmzAnZHt-e6SZFyowPdwA6LYBvpMy7OvyKwvi3hQCCtJmGZmnf5tHjGXR83lGTHfvj6wTC2GtO8ySx3U3icvCAC-p5VeIKYZ6l9b63YuqT2CQZHr2Ubi1QhzBJkcVTq5sHkRQ2o77P7kY8sa0I5esy9w12dXVJ5jLL5bNSUw_52O3sX3Io_8cKy9lszA2WYa769e5m1Hr' },
      },
    ];

    setMessages(enhancedMessages);
    setOtherUser({
      name: 'Sarah Jenkins',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXiyi45eOz4BcXvd7mdn3sawvga1SF3bOHRQ7RfRNuNDG8A1eLaVSed4UaYU2qNoi7IWM65hQGbgHBQs4xfzQkw-md3L09luMSSquggrgV61RBhMXrHpJMc2QOVk8yRYHvwqOCwPiZOv91IThmRxmGInaqNRRsDjTzDhafzsZCeQ3S5P1a6NZ_GkSBfaGLSOLDJQVmmSde0VlQbw_3o3g4fzNSqn-ie8zFHLD6goPb27uFd3uAo3CrZlgETT5KMmxt3QYnz8EgnX1',
      online: true,
    });
  };

  const loadTradeInfo = async () => {
    // Mock trade info
    setTradeInfo({
      status: 'accepted',
      currentStep: 2,
      yourItem: {
        title: 'Mountain Bike',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPv7U5WgtGTmWfV0b23kLAgSeONVc8oymH7p4cEni_lTy9Vl2GyjcZcbpY5EGEDtrDVqiOB7Md8QxZtimZ3r0z5GVQW3TvV7DzIFk6Sc3caZECJjMyk8YD29_ZJ0RWyIypSKo4Etla_r_aZ0LmXDZzeXlvpDEkXU05zvji_qK0G8Ght4wBr2260RO33tENmJ29b5JSjyD1GqczaNqXxAYAtdFsZWLnrGLHzeDUx3R9SN3Uhux1lPYUvom4xFaGxvJVAj-OybcF8Xqv',
      },
      theirItem: {
        title: 'Gibson Guitar',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAse4tTPD_IERWUn6lRZnz15TAv0CV-zI4pyfAecLw4olpUpJePFnK3FEp2AcFr-GfhGL5z5xlo3oDGe6hfUC-1p_IY086YW3NbSod0CDGpWvjef8jvWFyL6l4jy2xoNUWH8ItOJCtmqiHj5jYoySH7fAxeFdwfFldivK99vvoP_8wVBEYx4Ug8KoBUm_R1Vap4bZD44VW5taoQmciThnHRz3srF7QauzpMMGluejQkHMsDTcbLV8zd8zkl_xzgMgZ4Uzh2if2Pl3zF',
      },
      cashAmount: 50,
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const message: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      senderId: user?.id || 'user-1',
      createdAt: new Date().toISOString(),
      sender: { displayName: user?.displayName || 'You' },
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
    setSending(false);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMoreOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View Profile', 'View Trade Details', 'Report User', 'Block User'],
          destructiveButtonIndex: 4,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Alert.alert('Profile', `Viewing ${otherUser.name}'s profile`);
          } else if (buttonIndex === 2) {
            handleViewTradeDetails();
          } else if (buttonIndex === 3) {
            Alert.alert('Report', 'Report submitted. Our team will review it.');
          } else if (buttonIndex === 4) {
            Alert.alert('Block User', 'User has been blocked.');
          }
        }
      );
    } else {
      Alert.alert(
        'Options',
        '',
        [
          { text: 'View Profile', onPress: () => Alert.alert('Profile', `Viewing ${otherUser.name}'s profile`) },
          { text: 'View Trade Details', onPress: handleViewTradeDetails },
          { text: 'Report User', onPress: () => Alert.alert('Report', 'Report submitted.') },
          { text: 'Block User', style: 'destructive', onPress: () => Alert.alert('Block', 'User blocked.') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleViewTradeDetails = () => {
    if (tradeInfo) {
      Alert.alert(
        'Trade Details',
        `Your Item: ${tradeInfo.yourItem.title}\nTheir Item: ${tradeInfo.theirItem.title}\nCash: $${tradeInfo.cashAmount || 0}\n\nStatus: ${tradeInfo.status.toUpperCase()}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddAttachment = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Share Location'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });
            if (!result.canceled) {
              Alert.alert('Photo', 'Photo captured! Sending photos will be available soon.');
            }
          } else if (buttonIndex === 2) {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });
            if (!result.canceled) {
              Alert.alert('Photo', 'Photo selected! Sending photos will be available soon.');
            }
          } else if (buttonIndex === 3) {
            Alert.alert('Location', 'Location sharing will be available soon!');
          }
        }
      );
    } else {
      setShowAttachments(true);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id || item.senderId === 'user-1';
    const isSystem = item.isSystem;
    const showDate =
      index === 0 ||
      new Date(item.createdAt).toDateString() !==
        new Date(messages[index - 1].createdAt).toDateString();

    // Check if we should show avatar (first message in a sequence from this sender)
    const showAvatar = !isOwn && !isSystem && (
      index === 0 ||
      messages[index - 1].senderId !== item.senderId ||
      messages[index - 1].isSystem
    );

    if (isSystem) {
      return (
        <View>
          {showDate && (
            <View style={styles.dateHeaderContainer}>
              <Text style={styles.dateHeader}>{formatDateHeader(item.createdAt)}</Text>
            </View>
          )}
          <View style={styles.systemMessageContainer}>
            <View style={styles.systemMessageBox}>
              <MaterialIcons name="handshake" size={28} color={Colors.primary} />
              <Text style={styles.systemMessageTitle}>{item.content}</Text>
              <Text style={styles.systemMessageSubtitle}>
                Next step: Coordinate the exchange meeting location.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View>
        {showDate && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeader}>{formatDateHeader(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
          {!isOwn && (
            <View style={styles.avatarContainer}>
              {showAvatar ? (
                <Image
                  source={{ uri: item.sender.avatar || 'https://via.placeholder.com/32' }}
                  style={styles.messageAvatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
          )}
          <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
            <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStepper = () => {
    if (!tradeInfo) return null;

    return (
      <View style={styles.stepperContainer}>
        {TRADE_STEPS.map((step, index) => {
          const isActive = index < tradeInfo.currentStep;
          const isCurrent = index === tradeInfo.currentStep - 1;
          const isLast = index === TRADE_STEPS.length - 1;

          return (
            <View key={step} style={styles.stepItem}>
              <View style={styles.stepDotContainer}>
                <View style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isCurrent && styles.stepDotCurrent,
                ]} />
              </View>
              <Text style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
              ]}>
                {step}
              </Text>
              {!isLast && (
                <View style={[
                  styles.stepLine,
                  isActive && styles.stepLineActive,
                ]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: otherUser.avatar || 'https://via.placeholder.com/40' }}
                style={styles.headerAvatar}
              />
            </View>
            <View>
              <Text style={styles.userName}>{otherUser.name}</Text>
              <Text style={styles.userStatus}>
                {otherUser.online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={handleMoreOptions}>
          <MaterialIcons name="more-horiz" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Trade Status Section */}
      {tradeInfo && (
        <View style={styles.tradeStatusSection}>
          <View style={styles.tradeStatusHeader}>
            <Text style={styles.tradeStatusTitle}>
              Trade Status: <Text style={styles.tradeStatusValue}>Pending</Text>
            </Text>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP {tradeInfo.currentStep} OF 4</Text>
            </View>
          </View>
          {renderStepper()}
        </View>
      )}

      {/* Pinned Trade Card */}
      {tradeInfo && (
        <View style={styles.tradeCardContainer}>
          <View style={styles.tradeCard}>
            <View style={styles.tradeImages}>
              <Image
                source={{ uri: tradeInfo.yourItem.image }}
                style={[styles.tradeImage, styles.tradeImageBack]}
              />
              <Image
                source={{ uri: tradeInfo.theirItem.image }}
                style={[styles.tradeImage, styles.tradeImageFront]}
              />
            </View>
            <View style={styles.tradeCardInfo}>
              <Text style={styles.tradeCardTitle}>{tradeInfo.yourItem.title}</Text>
              <Text style={styles.tradeCardSubtitle}>
                for <Text style={styles.tradeCardHighlight}>
                  {tradeInfo.theirItem.title} + ${tradeInfo.cashAmount}
                </Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.viewButton} onPress={handleViewTradeDetails}>
              <MaterialIcons name="visibility" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAttachment}>
          <MaterialIcons name="add" size={26} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <MaterialIcons name="send" size={20} color={Colors.background} />
        </TouchableOpacity>
      </View>

      {/* Android Attachment Modal */}
      <Modal
        visible={showAttachments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAttachments(false)}
      >
        <TouchableOpacity
          style={styles.attachmentModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachments(false)}
        >
          <View style={styles.attachmentModalContent}>
            <View style={styles.attachmentModalHandle} />
            <Text style={styles.attachmentModalTitle}>Add Attachment</Text>
            <View style={styles.attachmentOptions}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={async () => {
                  setShowAttachments(false);
                  const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                  });
                  if (!result.canceled) {
                    Alert.alert('Photo', 'Photo captured! Sending photos will be available soon.');
                  }
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <MaterialIcons name="camera-alt" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.attachmentLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={async () => {
                  setShowAttachments(false);
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                  });
                  if (!result.canceled) {
                    Alert.alert('Photo', 'Photo selected! Sending photos will be available soon.');
                  }
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: 'rgba(25, 230, 128, 0.15)' }]}>
                  <MaterialIcons name="photo-library" size={24} color="#19e680" />
                </View>
                <Text style={styles.attachmentLabel}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={() => {
                  setShowAttachments(false);
                  Alert.alert('Location', 'Location sharing will be available soon!');
                }}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialIcons name="location-on" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.attachmentLabel}>Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 22,
    padding: 2,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  userStatus: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeStatusSection: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tradeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  tradeStatusTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  tradeStatusValue: {
    color: Colors.primary,
  },
  stepBadge: {
    backgroundColor: 'rgba(25, 230, 128, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepDotContainer: {
    marginBottom: Spacing.sm,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotCurrent: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  stepLine: {
    position: 'absolute',
    top: 5,
    left: '55%',
    right: '-45%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  tradeCardContainer: {
    padding: Spacing.md,
  },
  tradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  tradeImages: {
    flexDirection: 'row',
    marginRight: Spacing.sm,
  },
  tradeImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  tradeImageBack: {
    zIndex: 1,
  },
  tradeImageFront: {
    marginLeft: -20,
    zIndex: 2,
  },
  tradeCardInfo: {
    flex: 1,
  },
  tradeCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  tradeCardSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tradeCardHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(25, 230, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dateHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    letterSpacing: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: 32,
    marginRight: Spacing.sm,
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: Spacing.md,
    flex: 1,
  },
  messageBubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: Colors.background,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  messageTimeOwn: {
    color: 'rgba(17, 33, 25, 0.5)',
  },
  systemMessageContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  systemMessageBox: {
    backgroundColor: 'rgba(25, 230, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 128, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  systemMessageTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  systemMessageSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface,
    shadowOpacity: 0,
  },
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  attachmentModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  attachmentModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
    gap: 8,
  },
  attachmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
