import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { supabase } from '../../lib/supabase';

const budgetOptions = ['Under ₹1 Cr', '₹1–5 Cr', '₹5–20 Cr', '₹20–100 Cr', '₹100 Cr+'];
const sectorOptions = ['Fintech', 'IT Services', 'Retail', 'Logistics', 'Healthcare', 'EV / Auto', 'Real Estate', 'EdTech', 'Pharma', 'Manufacturing'];

export default function RegisterScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'buyer' | 'corporate' | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [budget, setBudget] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !firstName) { Alert.alert('Please fill in all fields'); return; }
    setLoading(true);
    const metadata: any = {
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
    };
    if (userType === 'buyer') { metadata.budget = budget; metadata.sector_interest = sector; }
    if (userType === 'corporate') { metadata.company = company; }

    const { error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    setLoading(false);
    if (error) { Alert.alert('Registration failed', error.message); return; }
    Alert.alert('Account created!', 'Please check your email to verify your account.', [
      { text: 'OK', onPress: () => navigation.navigate('Login') }
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoBox}><Text style={styles.logoIcon}>◈</Text></View>
          <Text style={styles.logoText}>Sky<Text style={styles.logoAccent}>quire</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create account</Text>

          {/* Step 1: Choose user type */}
          {step === 1 && (
            <View>
              <Text style={styles.stepLabel}>I am a...</Text>
              <TouchableOpacity
                style={[styles.typeCard, userType === 'corporate' && styles.typeCardActive]}
                onPress={() => setUserType('corporate')}>
                <Text style={styles.typeIcon}>🏢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeTitle}>Corporate / M&A Advisor</Text>
                  <Text style={styles.typeDesc}>Deal pipeline, target discovery, AI scoring</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeCard, userType === 'buyer' && styles.typeCardActive]}
                onPress={() => setUserType('buyer')}>
                <Text style={styles.typeIcon}>🛒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeTitle}>Business Buyer</Text>
                  <Text style={styles.typeDesc}>Browse and acquire SMB businesses</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, !userType && styles.btnDisabled]}
                disabled={!userType}
                onPress={() => setStep(2)}>
                <Text style={styles.btnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Basic info */}
          {step === 2 && (
            <View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>First name</Text>
                  <TextInput style={styles.input} placeholder="Aakash" placeholderTextColor="#94a3b8" value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Last name</Text>
                  <TextInput style={styles.input} placeholder="SK" placeholderTextColor="#94a3b8" value={lastName} onChangeText={setLastName} />
                </View>
              </View>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="you@company.com" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="Min 6 characters" placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword} secureTextEntry />

              {userType === 'corporate' && (
                <>
                  <Text style={styles.label}>Company</Text>
                  <TextInput style={styles.input} placeholder="Your firm name" placeholderTextColor="#94a3b8" value={company} onChangeText={setCompany} />
                </>
              )}

              {userType === 'buyer' && (
                <>
                  <Text style={styles.label}>Budget range</Text>
                  <View style={styles.optionsRow}>
                    {budgetOptions.map(b => (
                      <TouchableOpacity key={b} style={[styles.chip, budget === b && styles.chipActive]} onPress={() => setBudget(b)}>
                        <Text style={[styles.chipText, budget === b && styles.chipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.label}>Sector interest</Text>
                  <View style={styles.optionsRow}>
                    {sectorOptions.map(s => (
                      <TouchableOpacity key={s} style={[styles.chip, sector === s && styles.chipActive]} onPress={() => setSector(s)}>
                        <Text style={[styles.chipText, sector === s && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.linkRow}>
                <Text style={styles.link}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  inner: { padding: 24, paddingTop: 60 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 10 },
  logoBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#071223', alignItems: 'center', justifyContent: 'center' },
  logoIcon: { color: '#0EA5E9', fontSize: 18 },
  logoText: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  logoAccent: { color: '#0EA5E9' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  stepLabel: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 10 },
  typeCardActive: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  typeIcon: { fontSize: 24 },
  typeTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  typeDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, color: '#0f172a', marginBottom: 16 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipActive: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  chipText: { fontSize: 12, color: '#64748b' },
  chipTextActive: { color: '#7c3aed', fontWeight: '600' },
  btn: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled: { backgroundColor: '#c4b5fd' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkRow: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#94a3b8', fontSize: 13 },
  link: { color: '#7c3aed', fontWeight: '600' },
});
