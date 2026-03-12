import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { chatsAPI } from '../services/api';
import { getSocket } from '../services/socket';

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const data = await chatsAPI.list();
      setChats(data.chats);
    } catch (error) {
      console.log('Sohbetler yuklenemedi:', error.message);
    }
  }, []);

  useEffect(() => {
    loadChats();
    const socket = getSocket();
    if (socket) {
      socket.on('message:received', () => loadChats());
    }
    const unsubscribe = navigation.addListener('focus', loadChats);
    return () => {
      unsubscribe();
      socket?.off('message:received');
    };
  }, [loadChats, navigation]);

  async function onRefresh() {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }

  function getChatName(chat) {
    if (chat.isGroup) return chat.name;
    const other = chat.participants.find((p) => p._id !== user?._id);
    return other?.displayName || 'Bilinmeyen';
  }

  function getChatAvatar(chat) {
    if (chat.isGroup) return chat.name?.[0]?.toUpperCase() || 'G';
    const other = chat.participants.find((p) => p._id !== user?._id);
    return other?.displayName?.[0]?.toUpperCase() || '?';
  }

  function getLastMessagePreview(chat) {
    if (!chat.lastMessage) return 'Henuz mesaj yok';
    const sender = chat.lastMessage.sender;
    const prefix = sender?.displayName ? `${sender.displayName}: ` : '';
    return `${prefix}${chat.lastMessage.content}`;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  }

  function renderChat({ item }) {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { chatId: item._id, chatName: getChatName(item) })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getChatAvatar(item)}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{getChatName(item)}</Text>
            <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>{getLastMessagePreview(item)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BussUp</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewChat')}>
          <Text style={styles.newChatButton}>+ Yeni</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderChat}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#075E54" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henuz sohbet yok</Text>
            <Text style={styles.emptySubtext}>Yeni bir sohbet baslatmak icin + Yeni butonuna basin</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 50, backgroundColor: '#075E54',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  newChatButton: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chatItem: { flexDirection: 'row', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#075E54',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1, marginRight: 8 },
  chatTime: { fontSize: 12, color: '#999' },
  lastMessage: { fontSize: 14, color: '#666', marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#333', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
});
