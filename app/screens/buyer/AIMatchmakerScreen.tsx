import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Message = { role: 'user' | 'assistant'; content: string };

import { API_BASE_URL } from '../../lib/config';
const ARIA_URL = `${API_BASE_URL}/api/ai/onboarding`;

export default function AIMatchmakerScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [budget, setBudget] = useState('');
  const [sector, setSector] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata;
        setBuyerName(meta?.first_name || '');
        setBudget(meta?.budget || '');
        setSector(meta?.sector_interest || '');
      }
    });
    // Initial greeting
    sendMessage(null);
  }, []);

  async function sendMessage(userText: string | null) {
    const updatedMessages: Message[] = userText
      ? [...messages, { role: 'user', content: userText }]
      : messages;

    if (userText) setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(ARIA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: updatedMessages,
          buyerName,
          budget,
          sectorInterest: sector,
        }),
      });
      const data = await res.json();
      if (data.type === 'message') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else if (data.type === 'profile') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Profile complete!\n\n🎯 You're: ${data.profile.personality_type}\n📊 Risk: ${data.profile.risk_appetite}\n🏭 Sectors: ${data.profile.sectors?.join(', ')}\n💼 Style: ${data.profile.operational_style}\n\n${data.profile.ideal_business}`,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Aria header */}
      <View style={styles.ariaHeader}>
        <View style={styles.ariaAvatar}>
          <Text style={styles.ariaAvatarText}>✦</Text>
        </View>
        <View>
          <Text style={styles.ariaName}>Aria</Text>
          <Text style={styles.ariaTagline}>AI Business Matchmaker</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.ariaBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.ariaText]}>
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={loading ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text style={styles.typingText}>Aria is thinking...</Text>
          </View>
        ) : null}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => input.trim() && sendMessage(input.trim())}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => input.trim() && sendMessage(input.trim())}
          disabled={!input.trim() || loading}>
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  ariaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  ariaAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  ariaAvatarText: { color: '#fff', fontSize: 18 },
  ariaName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  ariaTagline: { fontSize: 12, color: '#94a3b8' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginLeft: 'auto' },
  messageList: { padding: 16, gap: 10 },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginBottom: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  ariaBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  ariaText: { color: '#0f172a' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingBottom: 8 },
  typingText: { fontSize: 12, color: '#94a3b8' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#0f172a', maxHeight: 100, borderWidth: 1, borderColor: '#e2e8f0' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#c4b5fd' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
