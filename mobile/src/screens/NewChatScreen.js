import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { usersAPI, chatsAPI } from '../services/api';

export default function NewChatScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedForGroup, setSelectedForGroup] = useState([]);
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search]);

  async function loadUsers() {
    try {
      const data = await usersAPI.list(search);
      setUsers(data.users);
    } catch (error) {
      console.log('Kullanicilar yuklenemedi:', error.message);
    }
  }

  async function startDirectChat(userId, displayName) {
    try {
      const data = await chatsAPI.createDirect(userId);
      navigation.replace('Chat', { chatId: data.chat._id, chatName: displayName });
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  }

  function toggleUserForGroup(userId) {
    setSelectedForGroup((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function createGroup() {
    if (!groupName.trim()) {
      return Alert.alert('Hata', 'Grup adi gerekli.');
    }
    if (selectedForGroup.length < 1) {
      return Alert.alert('Hata', 'En az 1 katilimci secin.');
    }
    try {
      const data = await chatsAPI.createGroup(groupName.trim(), selectedForGroup);
      navigation.replace('Chat', { chatId: data.chat._id, chatName: groupName.trim() });
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  }

  function renderUser({ item }) {
    const isSelected = selectedForGroup.includes(item._id);
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => groupMode ? toggleUserForGroup(item._id) : startDirectChat(item._id, item.displayName)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.displayName[0].toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.department ? <Text style={styles.userDept}>{item.department}</Text> : null}
        </View>
        {groupMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupMode ? 'Yeni Grup' : 'Yeni Sohbet'}</Text>
        <TouchableOpacity onPress={() => { setGroupMode(!groupMode); setSelectedForGroup([]); }}>
          <Text style={styles.toggleButton}>{groupMode ? 'Bireysel' : 'Grup'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Kisi ara..."
        value={search}
        onChangeText={setSearch}
      />

      {groupMode && (
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Grup adi"
            value={groupName}
            onChangeText={setGroupName}
          />
          {selectedForGroup.length > 0 && (
            <TouchableOpacity style={styles.createGroupButton} onPress={createGroup}>
              <Text style={styles.createGroupText}>Olustur ({selectedForGroup.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Kullanici bulunamadi</Text>
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
  backButton: { color: '#fff', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  toggleButton: { color: '#b0f0e6', fontSize: 14, fontWeight: '600' },
  searchInput: {
    margin: 12, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10, fontSize: 15,
  },
  groupNameContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8,
  },
  groupNameInput: {
    flex: 1, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10, fontSize: 15,
  },
  createGroupButton: {
    marginLeft: 8, backgroundColor: '#075E54', paddingHorizontal: 16,
    paddingVertical: 12, borderRadius: 10,
  },
  createGroupText: { color: '#fff', fontWeight: '600' },
  userItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  userItemSelected: { backgroundColor: '#e8f5e9' },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#075E54',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#000' },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  userDept: { fontSize: 12, color: '#999', marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#075E54', borderColor: '#075E54' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
