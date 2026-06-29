import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
  'Submitted':    { color: '#0369a1', bg: '#e0f2fe', icon: '📨' },
  'In Review':    { color: '#92400e', bg: '#fef3c7', icon: '🔍' },
  'NDA Sent':     { color: '#5b21b6', bg: '#ede9fe', icon: '📄' },
  'Under DD':     { color: '#1e3a8a', bg: '#dbeafe', icon: '🏦' },
  'Closed':       { color: '#166534', bg: '#dcfce7', icon: '✅' },
  'Declined':     { color: '#991b1b', bg: '#fee2e2', icon: '✕' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

const offerMeta: Record<string, { color: string; bg: string }> = {
  Submitted: { color: '#0369a1', bg: '#e0f2fe' },
  Reviewing: { color: '#92400e', bg: '#fef3c7' },
  Countered: { color: '#5b21b6', bg: '#ede9fe' },
  Accepted: { color: '#166534', bg: '#dcfce7' },
  Declined: { color: '#991b1b', bg: '#fee2e2' },
  Withdrawn: { color: '#475569', bg: '#f1f5f9' },
};
const structureLabels: Record<string, string> = {
  all_cash: 'All cash', cash_plus_earnout: 'Cash + earn-out', equity_swap: 'Equity swap',
  asset_purchase: 'Asset purchase', other: 'Other',
};

export default function InquiriesScreen({ navigation }: any) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setInquiries(data || []);
    const { data: off } = await supabase
      .from('offers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOffers(off || []);
    setLoading(false);
  }

  const OffersHeader = offers.length === 0 ? null : (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionLabel}>MY OFFERS</Text>
      {offers.map((o) => {
        const m = offerMeta[o.status] || offerMeta.Submitted;
        return (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listingName}>{o.listing_name || 'Business'}</Text>
                <Text style={styles.timeAgo}>Offered {timeAgo(o.created_at)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: m.bg }]}>
                <Text style={[styles.statusText, { color: m.color }]}>{o.status}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.offerAmount}>₹{o.amount_cr} Cr</Text>
              <View style={styles.structChip}><Text style={styles.structChipText}>{structureLabels[o.structure] || o.structure}</Text></View>
              {o.timeline ? <Text style={styles.timeAgo}>· {o.timeline}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;

  return (
    <View style={styles.container}>
      {inquiries.length === 0 && offers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No inquiries yet</Text>
          <Text style={styles.emptyDesc}>Express interest in a business to start tracking here</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.browseBtnText}>Browse Businesses →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View>
              {OffersHeader}
              {inquiries.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>MY INQUIRIES</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Text style={styles.statNum}>{inquiries.length}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={[styles.statNum, { color: '#0369a1' }]}>
                        {inquiries.filter(i => !['Closed', 'Declined'].includes(i.status)).length}
                      </Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={[styles.statNum, { color: '#16a34a' }]}>
                        {inquiries.filter(i => i.status === 'Closed').length}
                      </Text>
                      <Text style={styles.statLabel}>Closed</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const cfg = statusConfig[item.status] || statusConfig['Submitted'];
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingName}>{item.listing_name}</Text>
                    <Text style={styles.timeAgo}>Submitted {timeAgo(item.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={styles.statusIcon}>{cfg.icon}</Text>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.viewBtn, { flex: 1 }]}
                    onPress={() => navigation.navigate('ListingDetail', { id: item.listing_id })}>
                    <Text style={styles.viewBtnText}>View Listing →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewBtn, styles.chatBtn, { flex: 1 }]}
                    onPress={() => navigation.navigate('InquiryChat', { inquiryId: item.id, listingName: item.listing_name })}>
                    <Text style={styles.chatBtnText}>💬 Messages</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  browseBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  listingName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  timeAgo: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusIcon: { fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  viewBtn: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  viewBtnText: { fontSize: 13, color: '#7c3aed', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 8 },
  chatBtn: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chatBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  offerAmount: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  structChip: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  structChipText: { fontSize: 11, color: '#475569' },
});
