import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [status, setStatus] = useState(user?.status || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [title, setTitle] = useState(user?.title || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!displayName.trim()) {
      return Alert.alert('Hata', 'Gorunen ad bos birakilamaz.');
    }
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), status, department, title });
      Alert.alert('Basarili', 'Profiliniz guncellendi.');
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Cikis', 'Cikis yapmak istediginizden emin misiniz?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Cikis Yap', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{user?.displayName?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Gorunen Ad</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

        <Text style={styles.label}>Durum Mesaji</Text>
        <TextInput
          style={styles.input}
          value={status}
          onChangeText={setStatus}
          maxLength={150}
          placeholder="Durumunuzu yazin..."
        />

        <Text style={styles.label}>Departman</Text>
        <TextInput style={styles.input} value={department} onChangeText={setDepartment} />

        <Text style={styles.label}>Unvan</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cikis Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24 },
  header: { alignItems: 'center', paddingTop: 30, marginBottom: 30 },
  avatarLarge: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#075E54',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  email: { fontSize: 15, color: '#666' },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14,
    fontSize: 16, marginBottom: 16, backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#075E54', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
});
