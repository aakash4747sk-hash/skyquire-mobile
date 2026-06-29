import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

const STRUCTURES = [
  { value: 'all_cash', label: 'All cash' },
  { value: 'cash_plus_earnout', label: 'Cash + earn-out' },
  { value: 'equity_swap', label: 'Equity swap' },
  { value: 'asset_purchase', label: 'Asset purchase' },
  { value: 'other', label: 'Other' },
];

export default function ListingDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [interested, setInterested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Make-an-offer
  const [offerVisible, setOfferVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [structure, setStructure] = useState('all_cash');
  const [timeline, setTimeline] = useState('');
  const [conditions, setConditions] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('business_listings').select('*').eq('id', id).single();
      setListing(data);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: s } = await supabase.from('saved_listings').select('id').eq('user_id', session.user.id).eq('listing_id', id).single();
        setSaved(!!s);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function toggleSave() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    if (saved) {
      await supabase.from('saved_listings').delete().eq('user_id', session.user.id).eq('listing_id', id);
      setSaved(false);
    } else {
      await supabase.from('saved_listings').insert({ user_id: session.user.id, listing_id: id });
      setSaved(true);
    }
  }

  async function expressInterest() {
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session && listing) {
      const meta: any = session.user.user_metadata || {};
      const buyerName = `${meta.first_name ?? ''} ${meta.last_name ?? ''}`.trim() || meta.full_name || session.user.email || 'Buyer';
      await supabase.from('inquiries').insert({
        user_id: session.user.id,
        listing_id: listing.id,
        listing_name: listing.name,
        status: 'Submitted',
        buyer_name: buyerName,
        buyer_email: session.user.email,
        budget_range: meta.budget || null,
      });
    }
    setSubmitting(false);
    setInterested(true);
    Alert.alert('Interest Submitted! ✅', 'Our advisors will reach out within 24 hours.');
  }

  async function submitOffer() {
    const amt = parseFloat(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid offer amount in ₹ Cr.');
      return;
    }
    setOfferSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !listing) { setOfferSubmitting(false); return; }
    const { error } = await supabase.from('offers').insert({
      user_id: session.user.id,
      listing_id: listing.id,
      listing_name: listing.name,
      amount_cr: amt,
      structure,
      timeline: timeline || null,
      conditions: conditions || null,
    });
    setOfferSubmitting(false);
    if (error) { Alert.alert('Could not submit', 'Please try again.'); return; }
    setOfferVisible(false);
    setAmount(''); setTimeline(''); setConditions(''); setStructure('all_cash');
    Alert.alert('Offer submitted 📨', 'Our advisors will review it and get back to you. Track it under Inquiries.');
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;
  if (!listing) return <View style={styles.center}><Text style={styles.notFound}>Listing not found</Text></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <View style={styles.sectorBadge}><Text style={styles.sectorBadgeText}>{listing.sector}</Text></View>
          <View style={styles.locationBadge}><Text style={styles.locationBadgeText}>📍 {listing.location}</Text></View>
          <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>● {listing.status}</Text></View>
          {listing.verified && (
            <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
          )}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.name}</Text>
          <TouchableOpacity onPress={toggleSave} style={styles.saveBtn}>
            <Text style={{ fontSize: 22, color: saved ? '#ef4444' : '#cbd5e1' }}>{saved ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{listing.description}</Text>
      </View>

      {/* Key financials */}
      <View style={styles.financialsGrid}>
        {[
          { label: 'Asking Price', value: listing.asking_price },
          { label: 'Revenue', value: listing.revenue },
          { label: 'EBITDA', value: listing.ebitda || 'N/A' },
          { label: 'Employees', value: listing.employees?.toString() || 'N/A' },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* Highlights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Highlights</Text>
        {listing.highlights?.map((h: string, i: number) => (
          <View key={i} style={styles.highlightRow}>
            <View style={styles.checkDot}><Text style={styles.checkText}>✓</Text></View>
            <Text style={styles.highlightText}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Business details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Business Details</Text>
        {[
          { label: 'Founded', value: listing.founded?.toString() || 'N/A' },
          { label: 'Location', value: listing.location },
          { label: 'Sector', value: listing.sector },
          { label: 'Team Size', value: listing.employees ? `${listing.employees} employees` : 'N/A' },
        ].map(item => (
          <View key={item.label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{item.label}</Text>
            <Text style={styles.detailValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, interested && styles.ctaBtnDone]}
        onPress={expressInterest}
        disabled={submitting || interested}>
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.ctaBtnText}>{interested ? '✅ Interest Submitted' : 'Express Interest →'}</Text>
        }
      </TouchableOpacity>

      {!interested && (
        <TouchableOpacity style={styles.offerBtn} onPress={() => setOfferVisible(true)}>
          <Text style={styles.offerBtnText}>Make an offer</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />

      {/* Make-an-offer modal */}
      <Modal visible={offerVisible} animationType="slide" transparent onRequestClose={() => setOfferVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Make an offer</Text>
              <TouchableOpacity onPress={() => setOfferVisible(false)} accessibilityLabel="Close"><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{listing.name} · Asking {listing.asking_price}</Text>

            <Text style={styles.fieldLabel}>Your offer (₹ Cr)</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="e.g. 7.5" placeholderTextColor="#94a3b8" style={styles.input} />

            <Text style={styles.fieldLabel}>Deal structure</Text>
            <View style={styles.chipRow}>
              {STRUCTURES.map(s => (
                <TouchableOpacity key={s.value} onPress={() => setStructure(s.value)}
                  style={[styles.chip, structure === s.value && styles.chipOn]}>
                  <Text style={[styles.chipText, structure === s.value && styles.chipTextOn]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Target timeline (optional)</Text>
            <TextInput value={timeline} onChangeText={setTimeline} placeholder="e.g. Close within 90 days" placeholderTextColor="#94a3b8" style={styles.input} />

            <Text style={styles.fieldLabel}>Conditions / notes (optional)</Text>
            <TextInput value={conditions} onChangeText={setConditions} placeholder="e.g. Subject to due diligence" placeholderTextColor="#94a3b8" style={[styles.input, { height: 70 }]} multiline />

            <Text style={styles.modalNote}>Non-binding indication of interest. Our team reviews every offer before anything is shared with the seller.</Text>

            <TouchableOpacity style={styles.modalSubmit} onPress={submitOffer} disabled={offerSubmitting}>
              {offerSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Submit offer</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#94a3b8' },
  headerCard: { backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  sectorBadge: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sectorBadgeText: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },
  locationBadge: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  locationBadgeText: { fontSize: 11, color: '#475569' },
  statusBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 10 },
  saveBtn: { padding: 4 },
  description: { fontSize: 13, color: '#64748b', lineHeight: 20 },
  financialsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  statCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  checkDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  checkText: { fontSize: 11, color: '#7c3aed', fontWeight: '700' },
  highlightText: { fontSize: 13, color: '#475569', flex: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 13, color: '#94a3b8' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#475569' },
  ctaBtn: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#7c3aed', borderRadius: 16, padding: 18, alignItems: 'center' },
  ctaBtnDone: { backgroundColor: '#16a34a' },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  verifiedBadge: { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontSize: 11, color: '#047857', fontWeight: '700' },
  offerBtn: { marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#c4b5fd', backgroundColor: '#f5f3ff' },
  offerBtnText: { color: '#6d28d9', fontWeight: '700', fontSize: 15 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.55)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalClose: { fontSize: 18, color: '#94a3b8', padding: 4 },
  modalSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { borderColor: '#7c3aed', backgroundColor: '#ede9fe' },
  chipText: { fontSize: 12, color: '#64748b' },
  chipTextOn: { color: '#6d28d9', fontWeight: '700' },
  modalNote: { fontSize: 11, color: '#94a3b8', marginTop: 10, marginBottom: 14, lineHeight: 16 },
  modalSubmit: { backgroundColor: '#7c3aed', borderRadius: 14, padding: 16, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
