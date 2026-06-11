import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const MATCH_URL = 'https://skyquire-app.vercel.app/api/ai/match';

type Match = {
  listing_id: string;
  score: number;
  fit_summary: string;
  reasons: string[];
  listing?: { id: string; name: string; sector: string; location: string; asking_price: string };
};

function scoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#0ea5e9';
  return '#f59e0b';
}

export default function MatchesScreen({ navigation }: any) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState('');
  const [noProfile, setNoProfile] = useState(false);

  useFocusEffect(useCallback(() => { loadCached(); }, []));

  async function loadCached() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('buyer_matches')
      .select('listing_id, score, fit_summary, reasons, listing:business_listings(id, name, sector, location, asking_price)')
      .eq('user_id', session.user.id)
      .order('score', { ascending: false });
    setMatches((data as unknown as Match[]) || []);
    setLoading(false);
  }

  async function computeMatches() {
    setComputing(true);
    setError('');
    setNoProfile(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(MATCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'no_profile') { setNoProfile(true); return; }
        throw new Error(data.message || data.error || 'Failed');
      }
      await loadCached();
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setComputing(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;

  if (noProfile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>✦</Text>
        <Text style={styles.emptyTitle}>Build your profile first</Text>
        <Text style={styles.emptyDesc}>Chat with Aria so we know what you're looking for — then we can rank every business for you.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('AI Match')}>
          <Text style={styles.primaryBtnText}>Talk to Aria →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={item => item.listing_id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.primaryBtn, { marginBottom: 16 }, computing && { opacity: 0.6 }]}
            onPress={computeMatches}
            disabled={computing}>
            <Text style={styles.primaryBtnText}>
              {computing ? 'Analyzing businesses...' : matches.length > 0 ? '↻ Refresh Matches' : '✨ Find My Matches'}
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !computing ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyDesc}>Tap the button above and our AI will rank every available business against your profile.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <ActivityIndicator color="#7c3aed" />
              <Text style={[styles.emptyDesc, { marginTop: 12 }]}>This takes about 10 seconds...</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.scoreBadge, { borderColor: scoreColor(item.score) }]}>
                <Text style={[styles.scoreText, { color: scoreColor(item.score) }]}>{item.score}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {index === 0 ? '🏆 ' : ''}{item.listing?.name || 'Listing unavailable'}
                </Text>
                <Text style={styles.meta}>
                  {item.listing?.sector} · {item.listing?.location} · {item.listing?.asking_price}
                </Text>
              </View>
            </View>
            <Text style={styles.summary}>{item.fit_summary}</Text>
            <View style={styles.reasons}>
              {(item.reasons || []).map((r, i) => (
                <View key={i} style={styles.reasonChip}>
                  <Text style={styles.reasonText}>✓ {r}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => item.listing && navigation.navigate('ListingDetail', { id: item.listing.id })}>
              <Text style={styles.viewBtnText}>View Listing →</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FA' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  primaryBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  scoreBadge: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  summary: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 10 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  reasonChip: { backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  reasonText: { fontSize: 11, color: '#6d28d9', fontWeight: '500' },
  viewBtn: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  viewBtnText: { fontSize: 13, color: '#7c3aed', fontWeight: '600' },
  error: { color: '#dc2626', fontSize: 12, textAlign: 'center', padding: 10 },
});
