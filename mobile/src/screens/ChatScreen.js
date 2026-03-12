import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { chatsAPI } from '../services/api';
import { getSocket, sendMessage, startTyping, stopTyping, markAsRead, joinChat } from '../services/socket';

export default function ChatScreen({ route }) {
  const { chatId, chatName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await chatsAPI.getMessages(chatId);
      setMessages(data.messages);
    } catch (error) {
      console.log('Mesajlar yuklenemedi:', error.message);
    }
  }, [chatId]);

  useEffect(() => {
    loadMessages();
    joinChat(chatId);

    const socket = getSocket();
    if (!socket) return;

    function onMessageReceived(data) {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data.message]);
        markAsRead(data.message._id, chatId);
      }
    }

    function onTypingStart(data) {
      if (data.chatId === chatId && data.userId !== user?._id) {
        setTypingUser(data.displayName);
      }
    }

    function onTypingStop(data) {
      if (data.chatId === chatId) {
        setTypingUser(null);
      }
    }

    socket.on('message:received', onMessageReceived);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:received', onMessageReceived);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [chatId, loadMessages, user?._id]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    stopTyping(chatId);

    try {
      const message = await sendMessage(chatId, text);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.log('Mesaj gonderilemedi:', error.message);
    }
  }

  function handleTyping(text) {
    setInputText(text);
    startTyping(chatId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => stopTyping(chatId), 2000);
  }

  function formatMessageTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function isMyMessage(msg) {
    return msg.sender?._id === user?._id || msg.sender === user?._id;
  }

  function getMessageStatus(msg) {
    if (!isMyMessage(msg)) return '';
    if (msg.readBy?.length > 0) return ' \u2713\u2713';
    if (msg.deliveredTo?.length > 0) return ' \u2713\u2713';
    return ' \u2713';
  }

  function renderMessage({ item }) {
    const mine = isMyMessage(item);
    return (
      <View style={[styles.messageBubble, mine ? styles.myMessage : styles.otherMessage]}>
        {!mine && (
          <Text style={styles.senderName}>{item.sender?.displayName || 'Bilinmeyen'}</Text>
        )}
        <Text style={[styles.messageText, mine && styles.myMessageText]}>{item.content}</Text>
        <Text style={[styles.messageTime, mine && styles.myMessageTime]}>
          {formatMessageTime(item.createdAt)}{getMessageStatus(item)}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{chatName?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{chatName}</Text>
          {typingUser && <Text style={styles.typingText}>{typingUser} yaziyor...</Text>}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Mesajlasmaya baslayin!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Mesaj yazin..."
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Gonder</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 50,
    backgroundColor: '#075E54',
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#128C7E',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  headerAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  typingText: { fontSize: 12, color: '#b0f0e6', fontStyle: 'italic' },
  messageList: { padding: 12, paddingBottom: 4 },
  messageBubble: {
    maxWidth: '78%', padding: 10, borderRadius: 10, marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end', backgroundColor: '#DCF8C6', borderBottomRightRadius: 2,
  },
  otherMessage: {
    alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2,
  },
  senderName: { fontSize: 12, fontWeight: '700', color: '#075E54', marginBottom: 2 },
  messageText: { fontSize: 15, color: '#000' },
  myMessageText: { color: '#000' },
  messageTime: { fontSize: 10, color: '#999', textAlign: 'right', marginTop: 4 },
  myMessageTime: { color: '#7a9c78' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 8,
    backgroundColor: '#f0f0f0', borderTopWidth: 0.5, borderTopColor: '#ddd',
  },
  textInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100, marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#075E54', borderRadius: 20, paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#999' },
});
