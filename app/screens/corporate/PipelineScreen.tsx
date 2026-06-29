import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

const STAGES = ['Prospect', 'Engaged', 'Due Diligence', 'Negotiation', 'Closed Won'];

const stageColors: Record<string, string> = {
  Prospect: '#94a3b8',
  Engaged: '#0ea5e9',
  'Due Diligence': '#f59e0b',
  Negotiation: '#7c3aed',
  'Closed Won': '#10b981',
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  High:   { bg: '#fef2f2', text: '#ef4444' },
  Medium: { bg: '#fefce8', text: '#f59e0b' },
  Low:    { bg: '#f1f5f9', text: '#94a3b8' },
};

function parseCr(size: string) {
  return parseFloat((size || '').replace(/[₹, Cr]/g, '')) || 0;
}

export default function PipelineScreen({ navigation }: any) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('All');

  useEffect(() => {
    supabase.from('deals').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setDeals(data || []);
      setLoading(false);
    });
  }, []);

  const stages = ['All', ...STAGES];
  const filtered = activeStage === 'All' ? deals : deals.filter(d => d.stage === activeStage);

  // Summary counts
  const stageCounts = STAGES.map(s => ({
    stage: s,
    count: deals.filter(d => d.stage === s).length,
    value: deals.filter(d => d.stage === s).reduce((acc, d) => acc + parseCr(d.size), 0),
  }));

  return (
    <View style={styles.container}>
      {/* Stage summary pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll} contentContainerStyle={styles.summaryRow}>
        {stageCounts.map(s => (
          <TouchableOpacity
            key={s.stage}
            style={[styles.summaryCard, activeStage === s.stage && { borderColor: stageColors[s.stage], borderWidth: 2 }]}
            onPress={() => setActiveStage(s.stage)}>
            <View style={[styles.stageDot, { backgroundColor: stageColors[s.stage] }]} />
            <Text style={styles.summaryStage}>{s.stage}</Text>
            <Text style={styles.summaryCount}>{s.count}</Text>
            {s.value > 0 && <Text style={styles.summaryValue}>₹{s.value} Cr</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {stages.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, activeStage === s && styles.filterTabActive]}
            onPress={() => setActiveStage(s)}>
            <Text style={[styles.filterTabText, activeStage === s && styles.filterTabTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.dealList} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No deals in this stage</Text>
            </View>
          )}
          {filtered.map(deal => {
            const pc = priorityColors[deal.priority] || priorityColors.Low;
            return (
              <View key={deal.id} style={styles.dealCard}>
                {/* Header */}
                <View style={styles.dealHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.dealName}>{deal.company}</Text>
                    <Text style={styles.dealMeta}>{deal.sector} · {deal.days_in_stage}d in stage</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
                    <Text style={[styles.priorityText, { color: pc.text }]}>{deal.priority}</Text>
                  </View>
                </View>

                {/* Stage bar */}
                <View style={styles.stageBar}>
                  {STAGES.map((s, i) => {
                    const stageIdx = STAGES.indexOf(deal.stage);
                    return (
                      <View key={s} style={[
                        styles.stageBarSegment,
                        { backgroundColor: i <= stageIdx ? stageColors[deal.stage] : '#1E3A5F' },
                        i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                        i === STAGES.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
                      ]} />
                    );
                  })}
                </View>
                <Text style={[styles.stageLabel, { color: stageColors[deal.stage] }]}>{deal.stage}</Text>

                {/* Footer */}
                <View style={styles.dealFooter}>
                  <Text style={styles.dealSize}>{deal.size || '—'}</Text>
                  <View style={[styles.ownerBadge, { backgroundColor: '#0ea5e920' }]}>
                    <Text style={styles.ownerText}>{deal.owner}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  summaryScroll: { maxHeight: 90 },
  summaryRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  summaryCard: { backgroundColor: '#0F2040', borderRadius: 12, padding: 10, minWidth: 110, borderWidth: 1, borderColor: '#1E3A5F' },
  stageDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  summaryStage: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  summaryCount: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  summaryValue: { fontSize: 11, color: '#475569', marginTop: 1 },
  filterRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0F2040', borderWidth: 1, borderColor: '#1E3A5F' },
  filterTabActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterTabText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  filterTabTextActive: { color: '#fff', fontWeight: '700' },
  dealList: { paddingHorizontal: 16, paddingTop: 4 },
  dealCard: { backgroundColor: '#0F2040', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  dealHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  dealName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  dealMeta: { fontSize: 12, color: '#475569', marginTop: 2 },
  priorityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  stageBar: { flexDirection: 'row', gap: 3, marginBottom: 6 },
  stageBarSegment: { flex: 1, height: 4 },
  stageLabel: { fontSize: 11, fontWeight: '600', marginBottom: 12 },
  dealFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealSize: { fontSize: 18, fontWeight: '800', color: '#f1f5f9' },
  ownerBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ownerText: { fontSize: 11, fontWeight: '700', color: '#0ea5e9' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#475569', fontSize: 14 },
});
