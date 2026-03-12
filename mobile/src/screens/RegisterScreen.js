import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '', password: '', displayName: '', department: '', title: '',
  });
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister() {
    const { email, password, displayName } = form;
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      return Alert.alert('Hata', 'E-posta, sifre ve gorunen ad zorunludur.');
    }
    if (password.length < 6) {
      return Alert.alert('Hata', 'Sifre en az 6 karakter olmalidir.');
    }
    setLoading(true);
    try {
      await register(
        email.trim().toLowerCase(), password, displayName.trim(),
        form.department.trim(), form.title.trim(),
      );
    } catch (error) {
      Alert.alert('Kayit Hatasi', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Kayit Ol</Text>
        <Text style={styles.subtitle}>Sirket e-postaniz ile hesap olusturun</Text>

        <Text style={styles.label}>Gorunen Ad *</Text>
        <TextInput
          style={styles.input}
          placeholder="Adiniz Soyadiniz"
          value={form.displayName}
          onChangeText={(v) => update('displayName', v)}
        />

        <Text style={styles.label}>Sirket E-postasi *</Text>
        <TextInput
          style={styles.input}
          placeholder="ad@sirket.com"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Sifre *</Text>
        <TextInput
          style={styles.input}
          placeholder="En az 6 karakter"
          value={form.password}
          onChangeText={(v) => update('password', v)}
          secureTextEntry
        />

        <Text style={styles.label}>Departman</Text>
        <TextInput
          style={styles.input}
          placeholder="Ornegin: Yazilim"
          value={form.department}
          onChangeText={(v) => update('department', v)}
        />

        <Text style={styles.label}>Unvan</Text>
        <TextInput
          style={styles.input}
          placeholder="Ornegin: Kidemli Gelistirici"
          value={form.title}
          onChangeText={(v) => update('title', v)}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayit Ol</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Zaten hesabiniz var mi? Giris yapin</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#075E54', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14,
    fontSize: 16, marginBottom: 16, backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#075E54', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#075E54', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
