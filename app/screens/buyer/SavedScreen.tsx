import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const budgetRanges = [
  { label: 'Any budget', min: 0, max: 9999 },
  { label: 'Under ₹2 Cr', min: 0, max: 2 },
  { label: '₹2–5 Cr', min: 2, max: 5 },
  { label: '₹5–15 Cr', min: 5, max: 15 },
  { label: '₹15 Cr+', min: 15, max: 9999 },
];

export default function SavedScreen({ navigation }: any) {
  const [saved, setSaved] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('saved_listings')
      .select('id, listing_id, created_at, business_listings(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setSaved((data as any[]) || []);

    const { data: ss } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    const list = (ss as any[]) || [];
    const withCounts = await Promise.all(list.map(async (s) => {
      let q = supabase.from('business_listings').select('id', { count: 'exact', head: true })
        .eq('status', 'Active').gt('created_at', s.last_seen_at);
      if (s.sector) q = q.eq('sector', s.sector);
      const range = budgetRanges[s.budget_idx];
      if (range && range.max < 9999) q = q.gte('asking_price_cr', range.min).lte('asking_price_cr', range.max);
      const { count } = await q;
      return { ...s, newCount: count || 0 };
    }));
    setSearches(withCounts);
    setLoading(false);
  }

  async function unsave(savedId: string) {
    await supabase.from('saved_listings').delete().eq('id', savedId);
    setSaved(prev => prev.filter(s => s.id !== savedId));
  }

  async function deleteSearch(searchId: string) {
    setSearches(prev => prev.filter(s => s.id !== searchId));
    await supabase.from('saved_searches').delete().eq('id', searchId);
  }

  async function openSearch(s: any) {
    await supabase.from('saved_searches').update({ last_seen_at: new Date().toISOString() }).eq('id', s.id);
    navigation.navigate('Browse', { sector: s.sector || undefined, query: s.query || undefined });
  }

  const SearchesHeader = searches.length === 0 ? null : (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.sectionLabel}>SAVED SEARCHES</Text>
      {searches.map((s) => (
        <View key={s.id} style={styles.searchCard}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => openSearch(s)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.searchName}>{s.name}</Text>
              {!!s.newCount && <View style={styles.newChip}><Text style={styles.newChipText}>{s.newCount} new</Text></View>}
            </View>
            <Text style={styles.searchMeta}>{[s.sector || 'All sectors', budgetRanges[s.budget_idx]?.label].filter(Boolean).join(' · ')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteSearch(s.id)} accessibilityLabel="Delete saved search" style={{ padding: 6 }}>
            <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;

  return (
    <View style={styles.container}>
      {saved.length === 0 && searches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyDesc}>Tap ♡ on any listing to save it here</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.browseBtnText}>Browse Businesses →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={SearchesHeader}
          renderItem={({ item }) => {
            const listing = item.business_listings;
            if (!listing) return null;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ListingDetail', { id: listing.id })}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}><Text style={styles.badgeText}>{listing.sector}</Text></View>
                      <Text style={styles.location}>📍 {listing.location}</Text>
                    </View>
                    <Text style={styles.name}>{listing.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => unsave(item.id)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>♥</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.desc} numberOfLines={2}>{listing.description}</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.price}>{listing.asking_price}</Text>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('ListingDetail', { id: listing.id })}>
                    <Text style={styles.viewBtnText}>View →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, color: '#cbd5e1', marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  browseBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },
  location: { fontSize: 11, color: '#94a3b8' },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 20, color: '#ef4444' },
  desc: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  price: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  viewBtn: { backgroundColor: '#ede9fe', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  viewBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 13 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, marginBottom: 8 },
  searchCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
  searchName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  searchMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  newChip: { backgroundColor: '#ede9fe', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  newChipText: { fontSize: 10, color: '#6d28d9', fontWeight: '700' },
});
