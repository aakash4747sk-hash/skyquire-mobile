import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

const SECTORS = ['All', 'Fintech', 'IT Services', 'Retail', 'Logistics', 'Healthcare', 'EV / Auto', 'Real Estate', 'EdTech', 'Pharma'];

export default function BrowseScreen({ navigation, route }: any) {
  const [listings, setListings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Apply filters passed from a saved search (Saved tab → View).
  useEffect(() => {
    const p = route?.params;
    if (!p) return;
    if (p.sector && SECTORS.includes(p.sector)) setSector(p.sector);
    if (typeof p.query === 'string') setSearch(p.query);
  }, [route?.params]);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.from('business_listings').select('*').eq('status', 'Active');
      setListings(data || []);

      if (session) {
        const { data: savedData } = await supabase.from('saved_listings').select('listing_id').eq('user_id', session.user.id);
        if (savedData) setSavedIds(new Set(savedData.map((s: any) => s.listing_id)));
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = [...listings];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.sector.toLowerCase().includes(q) || l.location.toLowerCase().includes(q));
    }
    if (sector !== 'All') result = result.filter(l => l.sector === sector);
    setFiltered(result);
  }, [listings, search, sector]);

  async function toggleSave(listingId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    if (savedIds.has(listingId)) {
      await supabase.from('saved_listings').delete().eq('user_id', session.user.id).eq('listing_id', listingId);
      setSavedIds(prev => { const s = new Set(prev); s.delete(listingId); return s; });
    } else {
      await supabase.from('saved_listings').insert({ user_id: session.user.id, listing_id: listingId });
      setSavedIds(prev => new Set(prev).add(listingId));
    }
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sector filters */}
      <FlatList
        horizontal
        data={SECTORS}
        keyExtractor={s => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, sector === item && styles.filterChipActive]}
            onPress={() => setSector(item)}>
            <Text style={[styles.filterChipText, sector === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No businesses found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ListingDetail', { id: item.id })}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.verified && (
                      <View style={styles.verifiedChip}><Text style={styles.verifiedChipText}>✓ Verified</Text></View>
                    )}
                  </View>
                  <Text style={styles.cardMeta}>{item.sector} · {item.location}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.heartBtn}>
                  <Text style={{ fontSize: 18, color: savedIds.has(item.id) ? '#ef4444' : '#cbd5e1' }}>
                    {savedIds.has(item.id) ? '♥' : '♡'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardPrice}>{item.asking_price}</Text>
                <Text style={styles.cardRev}>Rev: {item.revenue}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  filterList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  filterChipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  verifiedChip: { backgroundColor: '#d1fae5', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 },
  verifiedChipText: { fontSize: 9, color: '#047857', fontWeight: '700' },
  cardMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  heartBtn: { padding: 4 },
  cardDesc: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cardPrice: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  cardRev: { fontSize: 12, color: '#94a3b8' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#94a3b8' },
});
