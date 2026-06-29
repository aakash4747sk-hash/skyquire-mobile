import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Alert } from 'react-native';

export default function BuyerHomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState('');
  const [budget, setBudget] = useState('');
  const [sector, setSector] = useState('');
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const meta = session.user.user_metadata;
        setUserName(meta?.first_name || 'Buyer');
        setBudget(meta?.budget || '');
        setSector(meta?.sector_interest || '');
      }
      const { data } = await supabase.from('business_listings').select('*').eq('status', 'Active').limit(4);
      setFeaturedListings(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }},
    ]);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {userName} 👋</Text>
          <Text style={styles.subtext}>Find your perfect business today</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={handleSignOut}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Profile summary */}
      <View style={styles.profileRow}>
        {budget ? (
          <View style={styles.profileChip}>
            <Text style={styles.profileChipLabel}>Budget</Text>
            <Text style={styles.profileChipValue}>{budget}</Text>
          </View>
        ) : null}
        {sector ? (
          <View style={[styles.profileChip, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
            <Text style={[styles.profileChipLabel, { color: '#7c3aed' }]}>Sector</Text>
            <Text style={[styles.profileChipValue, { color: '#7c3aed' }]}>{sector}</Text>
          </View>
        ) : null}
      </View>

      {/* AI Matchmaker banner */}
      <TouchableOpacity style={styles.aiCard} onPress={() => navigation.navigate('AIMatchmaker')}>
        <View>
          <Text style={styles.aiTitle}>✦ AI Matchmaker</Text>
          <Text style={styles.aiDesc}>Chat with Aria to find your ideal business</Text>
        </View>
        <Text style={styles.aiArrow}>→</Text>
      </TouchableOpacity>

      {/* Journey steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your journey</Text>
        <View style={styles.stepsRow}>
          {[
            { n: '1', label: 'Complete profile', done: !!budget },
            { n: '2', label: 'Browse businesses', done: false },
            { n: '3', label: 'Express interest', done: false },
          ].map((s) => (
            <View key={s.n} style={styles.step}>
              <View style={[styles.stepDot, s.done && styles.stepDotDone]}>
                <Text style={styles.stepDotText}>{s.done ? '✓' : s.n}</Text>
              </View>
              <Text style={styles.stepLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Featured listings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured businesses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 20 }} />
        ) : (
          featuredListings.map((listing) => (
            <TouchableOpacity
              key={listing.id}
              style={styles.listingCard}
              onPress={() => navigation.navigate('ListingDetail', { id: listing.id })}>
              <View style={styles.listingTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listingName}>{listing.name}</Text>
                  <Text style={styles.listingMeta}>{listing.sector} · {listing.location}</Text>
                </View>
                <View style={styles.sectorBadge}>
                  <Text style={styles.sectorBadgeText}>{listing.sector}</Text>
                </View>
              </View>
              <View style={styles.listingBottom}>
                <Text style={styles.listingPrice}>{listing.asking_price}</Text>
                <Text style={styles.listingRev}>Rev: {listing.revenue}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtext: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  profileRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  profileChip: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  profileChipLabel: { fontSize: 11, color: '#16a34a', fontWeight: '600', textTransform: 'uppercase' },
  profileChipValue: { fontSize: 14, fontWeight: '700', color: '#15803d', marginTop: 2 },
  aiCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#7c3aed' },
  aiTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  aiDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  aiArrow: { fontSize: 20, color: '#fff' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#7c3aed', fontWeight: '600' },
  stepsRow: { flexDirection: 'row', gap: 8 },
  step: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepDotDone: { backgroundColor: '#7c3aed' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  stepLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  listingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  listingTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  listingName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  listingMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  sectorBadge: { backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  sectorBadgeText: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },
  listingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  listingPrice: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  listingRev: { fontSize: 12, color: '#94a3b8' },
});
