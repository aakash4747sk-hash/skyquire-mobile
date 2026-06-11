import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Message = {
  id: string;
  inquiry_id: string;
  sender_id: string;
  sender_role: 'buyer' | 'admin';
  body: string;
  created_at: string;
};

export default function ChatScreen({ route }: any) {
  const { inquiryId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });
      if (active) {
        setMessages(data || []);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel(`messages:${inquiryId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `inquiry_id=eq.${inquiryId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [inquiryId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSending(false); return; }

    const { data, error } = await supabase
      .from('messages')
      .insert({ inquiry_id: inquiryId, sender_id: session.user.id, sender_role: 'buyer', body })
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => (prev.some(m => m.id === data.id) ? prev : [...prev, data]));
      setInput('');
    }
    setSending(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet.{'\n'}Ask the advisor a question about this business.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_role === 'buyer';
            return (
              <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.body}</Text>
                  <Text style={[styles.time, mine ? { color: '#ddd6fe' } : { color: '#94a3b8' }]}>
                    {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
          onPress={send}
          disabled={!input.trim() || sending}>
          <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  bubbleRow: { marginBottom: 8, flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  mine: { backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
  time: { fontSize: 10, marginTop: 3 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#0f172a', maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
