import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

const stageColors: Record<string, string> = {
  Prospect: '#94a3b8', Engaged: '#0ea5e9', 'Due Diligence': '#f59e0b', Negotiation: '#7c3aed', 'Closed Won': '#10b981',
};

export default function CorporateHomeScreen({ navigation }: any) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('deals').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setDeals(data || []);
      setLoading(false);
    });
  }, []);

  const totalValue = deals.reduce((s, d) => s + (parseFloat((d.size || '').replace(/[₹, Cr]/g, '')) || 0), 0);
  const closed = deals.filter(d => d.stage === 'Closed Won');
  const active = deals.filter(d => d.stage !== 'Closed Won');

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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, Aakash 👋</Text>
          <Text style={styles.subtext}>Your M&A pipeline at a glance</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={handleSignOut}>
          <Text style={styles.avatarText}>AK</Text>
        </TouchableOpacity>
      </View>

      {/* KPI row */}
      <View style={styles.kpiRow}>
        {[
          { label: 'Pipeline', value: `₹${totalValue.toFixed(0)} Cr`, color: '#0ea5e9' },
          { label: 'Active', value: `${active.length}`, color: '#7c3aed' },
          { label: 'Won', value: `${closed.length}`, color: '#10b981' },
        ].map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsRow}>
          {[
            { label: 'Pipeline', icon: '◈', screen: 'Pipeline' },
            { label: 'Analytics', icon: '◷', screen: 'Analytics' },
            { label: 'AI Score', icon: '✦', screen: 'AIScore' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen)}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent deals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent deals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Pipeline')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color="#0ea5e9" /> : (
          deals.slice(0, 5).map(deal => (
            <View key={deal.id} style={styles.dealCard}>
              <View style={styles.dealLeft}>
                <Text style={styles.dealName}>{deal.company}</Text>
                <Text style={styles.dealMeta}>{deal.sector} · {deal.days_in_stage}d in stage</Text>
              </View>
              <View style={styles.dealRight}>
                <Text style={styles.dealSize}>{deal.size}</Text>
                <View style={[styles.stagePill, { backgroundColor: stageColors[deal.stage] + '22' }]}>
                  <Text style={[styles.stageText, { color: stageColors[deal.stage] }]}>{deal.stage}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
  subtext: { fontSize: 13, color: '#475569', marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#0F2040', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  kpiValue: { fontSize: 18, fontWeight: '800' },
  kpiLabel: { fontSize: 11, color: '#475569', marginTop: 3 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#0ea5e9', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#0F2040', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  actionIcon: { fontSize: 22, color: '#0ea5e9', marginBottom: 6 },
  actionLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  dealCard: { backgroundColor: '#0F2040', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  dealLeft: { flex: 1, marginRight: 10 },
  dealName: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
  dealMeta: { fontSize: 12, color: '#475569', marginTop: 2 },
  dealRight: { alignItems: 'flex-end', gap: 6 },
  dealSize: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  stagePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  stageText: { fontSize: 11, fontWeight: '600' },
});
