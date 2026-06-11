import 'react-native-url-polyfill/auto';
import { enableScreens } from 'react-native-screens';
enableScreens(false);
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { supabase } from './app/lib/supabase';

// Auth screens
import LoginScreen from './app/screens/auth/LoginScreen';
import RegisterScreen from './app/screens/auth/RegisterScreen';

// Buyer screens
import BuyerHomeScreen from './app/screens/buyer/BuyerHomeScreen';
import BrowseScreen from './app/screens/buyer/BrowseScreen';
import SavedScreen from './app/screens/buyer/SavedScreen';
import InquiriesScreen from './app/screens/buyer/InquiriesScreen';
import AIMatchmakerScreen from './app/screens/buyer/AIMatchmakerScreen';
import ListingDetailScreen from './app/screens/buyer/ListingDetailScreen';
import ChatScreen from './app/screens/buyer/ChatScreen';
import MatchesScreen from './app/screens/buyer/MatchesScreen';

// Corporate screens
import CorporateHomeScreen from './app/screens/corporate/CorporateHomeScreen';
import PipelineScreen from './app/screens/corporate/PipelineScreen';
import AnalyticsScreen from './app/screens/corporate/AnalyticsScreen';
import AIScoreScreen from './app/screens/corporate/AIScoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
        headerShadowVisible: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: '⊞', Browse: '◎', Matches: '✨', Saved: '♡', Inquiries: '◈', 'AI Match': '✦',
          };
          return <Text style={{ color, fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
      })}>
      <Tab.Screen name="Home" component={BuyerHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Matches', headerTitle: '✨ My Matches' }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ title: 'Saved' }} />
      <Tab.Screen name="Inquiries" component={InquiriesScreen} options={{ title: 'Inquiries' }} />
      <Tab.Screen name="AI Match" component={AIMatchmakerScreen} options={{ title: 'AI Match', headerTitle: 'Aria — AI Matchmaker' }} />
    </Tab.Navigator>
  );
}

function CorporateTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: '#0A1628', borderTopColor: '#1E3A5F', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0A1628' },
        headerTitleStyle: { fontWeight: '700', color: '#f1f5f9' },
        headerShadowVisible: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = { Overview: '⊞', Pipeline: '◈', Analytics: '◷', 'AI Score': '✦' };
          return <Text style={{ color, fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
      })}>
      <Tab.Screen name="Overview" component={CorporateHomeScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="Pipeline" component={PipelineScreen} options={{ title: 'Deal Pipeline' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Tab.Screen name="AIScore" component={AIScoreScreen} options={{ title: 'AI Score', tabBarLabel: 'AI Score' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FA' }}>
        <ActivityIndicator color="#7c3aed" size={40} />
      </View>
    );
  }

  const userType = session?.user?.user_metadata?.user_type;
  const initialRoute = !session ? 'Login' : userType === 'buyer' ? 'BuyerTabs' : 'CorporateTabs';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
        <Stack.Screen name="CorporateTabs" component={CorporateTabs} />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ headerShown: true, title: 'Business Details', headerBackTitle: 'Back', headerTintColor: '#7c3aed' }}
        />
        <Stack.Screen
          name="InquiryChat"
          component={ChatScreen}
          options={({ route }: any) => ({
            headerShown: true,
            title: route.params?.listingName || 'Messages',
            headerBackTitle: 'Back',
            headerTintColor: '#7c3aed',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
