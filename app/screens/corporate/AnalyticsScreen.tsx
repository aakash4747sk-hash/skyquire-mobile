import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

const STAGES = ['Prospect', 'Engaged', 'Due Diligence', 'Negotiation', 'Closed Won'];
const STAGE_COLORS: Record<string, string> = {
  Prospect: '#94a3b8', Engaged: '#0ea5e9', 'Due Diligence': '#f59e0b', Negotiation: '#7c3aed', 'Closed Won': '#10b981',
};
const OWNER_COLORS: Record<string, string> = {
  AK: '#0ea5e9', RV: '#7c3aed', SM: '#10b981', PJ: '#f59e0b',
};

function parseCr(size: string) {
  return parseFloat((size || '').replace(/[₹, Cr]/g, '')) || 0;
}

export default function AnalyticsScreen() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('deals').select('*').then(({ data }) => {
      setDeals(data || []);
      setLoading(false);
    });
  }, []);

  const totalValue = deals.reduce((s, d) => s + parseCr(d.size), 0);
  const closedDeals = deals.filter(d => d.stage === 'Closed Won');
  const closedValue = closedDeals.reduce((s, d) => s + parseCr(d.size), 0);
  const winRate = deals.length > 0 ? Math.round((closedDeals.length / deals.length) * 100) : 0;
  const avgDeal = deals.length > 0 ? Math.round(totalValue / deals.length) : 0;

  const owners = Array.from(new Set(deals.map(d => d.owner)));
  const ownerData = owners.map(o => ({
    owner: o,
    count: deals.filter(d => d.owner === o).length,
    value: Math.round(deals.filter(d => d.owner === o).reduce((s, d) => s + parseCr(d.size), 0)),
    closed: deals.filter(d => d.owner === o && d.stage === 'Closed Won').length,
  })).sort((a, b) => b.value - a.value);

  const maxOwnerValue = Math.max(...ownerData.map(o => o.value), 1);

  const sectors = Array.from(new Set(deals.map(d => d.sector)));
  const sectorData = sectors.map(s => ({
    label: s.length > 10 ? s.slice(0, 9) + '…' : s,
    value: Math.round(deals.filter(d => d.sector === s).reduce((acc, d) => acc + parseCr(d.size), 0)),
  })).sort((a, b) => b.value - a.value).slice(0, 6);
  const maxSector = Math.max(...sectorData.map(d => d.value), 1);

  const staleCount = deals.filter(d => d.stage !== 'Closed Won' && d.days_in_stage > 30).length;

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color="#0ea5e9" /></View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* KPI cards */}
      <View style={styles.kpiGrid}>
        {[
          { label: 'Pipeline Value', value: `₹${totalValue.toFixed(0)} Cr`, color: '#0ea5e9' },
          { label: 'Closed Value',   value: `₹${closedValue.toFixed(0)} Cr`, color: '#10b981' },
          { label: 'Win Rate',       value: `${winRate}%`,                    color: '#7c3aed' },
          { label: 'Avg Deal',       value: `₹${avgDeal} Cr`,                color: '#f59e0b' },
        ].map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Stale deal alert */}
      {staleCount > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>⚠</Text>
          <Text style={styles.alertText}>{staleCount} deal{staleCount > 1 ? 's' : ''} stuck 30+ days in same stage</Text>
        </View>
      )}

      {/* Funnel */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conversion Funnel</Text>
        {STAGES.map((stage, i) => {
          const count = deals.filter(d => d.stage === stage).length;
          const value = deals.filter(d => d.stage === stage).reduce((s, d) => s + parseCr(d.size), 0);
          const maxCount = Math.max(...STAGES.map(s => deals.filter(d => d.stage === s).length), 1);
          const pct = Math.max(8, (count / maxCount) * 100);
          const nextCount = i < STAGES.length - 1 ? deals.filter(d => d.stage === STAGES[i + 1]).length : null;
          const convRate = nextCount !== null && count > 0 ? Math.round((nextCount / count) * 100) : null;

          return (
            <View key={stage} style={styles.funnelRow}>
              <Text style={styles.funnelLabel}>{stage}</Text>
              <View style={styles.funnelBarBg}>
                <View style={[styles.funnelBar, { width: `${pct}%` as any, backgroundColor: STAGE_COLORS[stage] }]}>
                  <Text style={styles.funnelCount}>{count}</Text>
                </View>
              </View>
              <Text style={styles.funnelValue}>{value > 0 ? `₹${value}Cr` : '—'}</Text>
              {convRate !== null && count > 0 && (
                <Text style={styles.convRate}>↓{convRate}%</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Sector bar chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pipeline by Sector (₹ Cr)</Text>
        {sectorData.map(s => (
          <View key={s.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{s.label}</Text>
            <View style={styles.barBg}>
              <View style={[styles.bar, { width: `${Math.max(4, (s.value / maxSector) * 100)}%` as any }]} />
            </View>
            <Text style={styles.barValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Team leaderboard */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Team Performance</Text>
        {ownerData.map((o, i) => {
          const barPct = Math.max(4, (o.value / Math.max(ownerData[0]?.value, 1)) * 100);
          return (
            <View key={o.owner} style={styles.teamRow}>
              <Text style={styles.teamRank}>#{i + 1}</Text>
              <View style={[styles.teamAvatar, { backgroundColor: OWNER_COLORS[o.owner] || '#94a3b8' }]}>
                <Text style={styles.teamAvatarText}>{o.owner}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <View style={styles.teamBarBg}>
                  <View style={[styles.teamBar, { width: `${barPct}%` as any, backgroundColor: OWNER_COLORS[o.owner] || '#94a3b8' }]} />
                </View>
              </View>
              <View style={styles.teamStats}>
                <Text style={styles.teamStatVal}>{o.count}<Text style={styles.teamStatLbl}> deals</Text></Text>
                <Text style={[styles.teamStatVal, { color: '#10b981' }]}>{o.closed}<Text style={styles.teamStatLbl}> won</Text></Text>
              </View>
            </View>
          );
        })}
        {ownerData.length === 0 && <Text style={styles.emptyText}>No deal data yet</Text>}
      </View>

      {/* Top deals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Deals by Value</Text>
        {[...deals].sort((a, b) => parseCr(b.size) - parseCr(a.size)).slice(0, 5).map(deal => (
          <View key={deal.id} style={styles.topDealRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topDealName}>{deal.company}</Text>
              <Text style={styles.topDealMeta}>{deal.sector}</Text>
            </View>
            <View style={[styles.stagePill, { backgroundColor: STAGE_COLORS[deal.stage] + '22' }]}>
              <Text style={[styles.stagePillText, { color: STAGE_COLORS[deal.stage] }]}>{deal.stage}</Text>
            </View>
            <Text style={styles.topDealSize}>{deal.size}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A1628' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  kpiCard: { width: '47%', backgroundColor: '#0F2040', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1E3A5F' },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { fontSize: 11, color: '#475569', marginTop: 4 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, padding: 12, backgroundColor: '#2d1b00', borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b40' },
  alertIcon: { fontSize: 16 },
  alertText: { fontSize: 12, color: '#f59e0b', flex: 1 },
  card: { backgroundColor: '#0F2040', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E3A5F' },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  funnelRow: { marginBottom: 10 },
  funnelLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  funnelBarBg: { backgroundColor: '#071223', borderRadius: 6, height: 28, overflow: 'hidden', marginBottom: 2 },
  funnelBar: { height: '100%', borderRadius: 6, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 8, opacity: 0.85 },
  funnelCount: { fontSize: 12, fontWeight: '700', color: '#fff' },
  funnelValue: { fontSize: 11, color: '#475569' },
  convRate: { fontSize: 10, color: '#475569', marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barLabel: { fontSize: 11, color: '#64748b', width: 70 },
  barBg: { flex: 1, backgroundColor: '#071223', borderRadius: 4, height: 20, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#0ea5e9', borderRadius: 4, opacity: 0.85 },
  barValue: { fontSize: 11, color: '#64748b', width: 36, textAlign: 'right' },
  teamRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  teamRank: { fontSize: 11, color: '#475569', width: 20 },
  teamAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  teamAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  teamBarBg: { backgroundColor: '#071223', borderRadius: 4, height: 8, overflow: 'hidden' },
  teamBar: { height: '100%', borderRadius: 4, opacity: 0.8 },
  teamStats: { flexDirection: 'row', gap: 10 },
  teamStatVal: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  teamStatLbl: { fontSize: 10, color: '#475569', fontWeight: '400' },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  topDealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#071223', gap: 8 },
  topDealName: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
  topDealMeta: { fontSize: 11, color: '#475569', marginTop: 1 },
  stagePill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  stagePillText: { fontSize: 10, fontWeight: '600' },
  topDealSize: { fontSize: 14, fontWeight: '800', color: '#f1f5f9', minWidth: 60, textAlign: 'right' },
});
