import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { supabase } from '../../lib/supabase';

import { API_BASE_URL } from '../../lib/config';
const AI_URL = `${API_BASE_URL}/api/ai/analyze`;

const STAGE_COLORS: Record<string, string> = {
  Prospect: '#94a3b8', Engaged: '#0ea5e9',
  'Due Diligence': '#f59e0b', Negotiation: '#7c3aed', 'Closed Won': '#10b981',
};

type Analysis = {
  score: number;
  score_rationale: string;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
  valuation_note: string;
};

export default function AIScoreScreen() {
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    supabase.from('deals').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setDeals(data || []);
      setDealsLoading(false);
    });
  }, []);

  async function analyzeDeal(deal: any) {
    setSelectedDeal(deal);
    setAnalysis(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(deal),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Failed to analyze deal');
    }
    setLoading(false);
  }

  function scoreColor(score: number) {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  }

  function scoreLabel(score: number) {
    if (score >= 8) return 'Strong Buy';
    if (score >= 6) return 'Moderate';
    return 'Caution';
  }

  return (
    <View style={styles.container}>
      {/* Deal selector */}
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Select a deal to score</Text>
        <Text style={styles.selectorSub}>{deals.length} deals available</Text>
      </View>

      {dealsLoading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Deal list */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealPills}>
            {deals.map(deal => (
              <TouchableOpacity
                key={deal.id}
                style={[
                  styles.dealPill,
                  selectedDeal?.id === deal.id && styles.dealPillActive,
                ]}
                onPress={() => analyzeDeal(deal)}>
                <Text style={[styles.dealPillName, selectedDeal?.id === deal.id && styles.dealPillNameActive]}>
                  {deal.company}
                </Text>
                <View style={[styles.stageDot, { backgroundColor: STAGE_COLORS[deal.stage] }]} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0ea5e9" />
              <Text style={styles.loadingText}>Aria is analysing {selectedDeal?.company}...</Text>
              <Text style={styles.loadingSubtext}>Running M&A scoring model</Text>
            </View>
          )}

          {/* No selection */}
          {!selectedDeal && !loading && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✦</Text>
              <Text style={styles.emptyTitle}>AI Deal Scoring</Text>
              <Text style={styles.emptyDesc}>Select any deal above to get an instant AI-powered M&A assessment with score, strengths, risks and recommendation.</Text>
            </View>
          )}

          {/* Analysis result */}
          {analysis && !loading && (
            <ScrollView contentContainerStyle={styles.resultContainer} showsVerticalScrollIndicator={false}>

              {/* Score card */}
              <View style={styles.scoreCard}>
                <View style={styles.scoreLeft}>
                  <Text style={styles.scoreDealName}>{selectedDeal?.company}</Text>
                  <Text style={styles.scoreSector}>{selectedDeal?.sector} · {selectedDeal?.stage}</Text>
                  <Text style={styles.scoreRationale}>{analysis.score_rationale}</Text>
                </View>
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scoreNum, { color: scoreColor(analysis.score) }]}>{analysis.score}</Text>
                  <Text style={styles.scoreDenom}>/10</Text>
                  <Text style={[styles.scoreLabel, { color: scoreColor(analysis.score) }]}>{scoreLabel(analysis.score)}</Text>
                </View>
              </View>

              {/* Score bar */}
              <View style={styles.scoreBarContainer}>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, {
                    width: `${analysis.score * 10}%` as any,
                    backgroundColor: scoreColor(analysis.score),
                  }]} />
                </View>
                <View style={styles.scoreBarLabels}>
                  <Text style={styles.scoreBarLabel}>0</Text>
                  <Text style={styles.scoreBarLabel}>5</Text>
                  <Text style={styles.scoreBarLabel}>10</Text>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Executive Summary</Text>
                <Text style={styles.summaryText}>{analysis.summary}</Text>
              </View>

              {/* Strengths */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Strengths</Text>
                {analysis.strengths.map((s, i) => (
                  <View key={i} style={styles.pointRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.pointText}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Risks */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Risks</Text>
                {analysis.risks.map((r, i) => (
                  <View key={i} style={styles.pointRow}>
                    <View style={styles.redDot} />
                    <Text style={styles.pointText}>{r}</Text>
                  </View>
                ))}
              </View>

              {/* Recommendation */}
              <View style={[styles.card, styles.recCard]}>
                <Text style={styles.recLabel}>Recommendation</Text>
                <Text style={styles.recText}>{analysis.recommendation}</Text>
              </View>

              {/* Valuation note */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Valuation Note</Text>
                <Text style={styles.summaryText}>{analysis.valuation_note}</Text>
              </View>

              {/* Re-analyse */}
              <TouchableOpacity style={styles.reanalyzeBtn} onPress={() => analyzeDeal(selectedDeal)}>
                <Text style={styles.reanalyzeBtnText}>↺ Re-analyse</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  selectorHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  selectorTitle: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  selectorSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  dealPills: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  dealPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0F2040', borderWidth: 1, borderColor: '#1E3A5F' },
  dealPillActive: { borderColor: '#0ea5e9', backgroundColor: '#0ea5e920' },
  dealPillName: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  dealPillNameActive: { color: '#0ea5e9', fontWeight: '700' },
  stageDot: { width: 7, height: 7, borderRadius: 4 },
  loadingCard: { margin: 16, backgroundColor: '#0F2040', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1E3A5F' },
  loadingText: { fontSize: 14, color: '#e2e8f0', fontWeight: '600', textAlign: 'center' },
  loadingSubtext: { fontSize: 12, color: '#475569', textAlign: 'center' },
  emptyCard: { margin: 16, backgroundColor: '#0F2040', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  emptyIcon: { fontSize: 36, color: '#0ea5e9', marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#e2e8f0', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20 },
  resultContainer: { paddingHorizontal: 16, paddingTop: 8 },
  scoreCard: { backgroundColor: '#0F2040', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  scoreLeft: { flex: 1, marginRight: 16 },
  scoreDealName: { fontSize: 16, fontWeight: '800', color: '#f1f5f9', marginBottom: 3 },
  scoreSector: { fontSize: 12, color: '#475569', marginBottom: 8 },
  scoreRationale: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#071223', borderWidth: 2, borderColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 28, fontWeight: '900', lineHeight: 30 },
  scoreDenom: { fontSize: 11, color: '#475569' },
  scoreLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  scoreBarContainer: { marginBottom: 12 },
  scoreBarBg: { backgroundColor: '#071223', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 4 },
  scoreBarFill: { height: '100%', borderRadius: 8 },
  scoreBarLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  scoreBarLabel: { fontSize: 10, color: '#475569' },
  card: { backgroundColor: '#0F2040', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  summaryText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginTop: 5, flexShrink: 0 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginTop: 5, flexShrink: 0 },
  pointText: { fontSize: 13, color: '#94a3b8', flex: 1, lineHeight: 20 },
  recCard: { borderColor: '#0ea5e940', backgroundColor: '#071e38' },
  recLabel: { fontSize: 11, fontWeight: '700', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recText: { fontSize: 14, color: '#e2e8f0', lineHeight: 22, fontWeight: '500' },
  reanalyzeBtn: { backgroundColor: '#0F2040', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F', marginBottom: 10 },
  reanalyzeBtnText: { color: '#0ea5e9', fontWeight: '600', fontSize: 14 },
});
