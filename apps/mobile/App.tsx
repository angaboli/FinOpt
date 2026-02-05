/**
 * Finopt Mobile App Entry Point
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CreditCard, PieChart, Lightbulb, Settings } from 'lucide-react-native';
import { colors } from './src/shared/constants/colors';

import { useAuthStore } from './src/store';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import AddAccountScreen from './src/screens/AddAccountScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import AddBudgetScreen from './src/screens/AddBudgetScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import AddGoalScreen from './src/screens/AddGoalScreen';
import EditGoalScreen from './src/screens/EditGoalScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SignInScreen from './src/screens/SignInScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import BudgetDetailScreen from './src/screens/BudgetDetailScreen';
import HelpScreen from './src/screens/HelpScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import TermsScreen from './src/screens/TermsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.neutral[400],
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{
          tabBarLabel: 'Budgets',
          tabBarIcon: ({ color, size }) => <PieChart size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => <Lightbulb size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Plus',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="AddAccount"
                component={AddAccountScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="AddTransaction"
                component={AddTransactionScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="AddBudget"
                component={AddBudgetScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="AddGoal"
                component={AddGoalScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="EditGoal"
                component={EditGoalScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="Goals"
                component={GoalsScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="Accounts"
                component={AccountsScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="TransactionDetail"
                component={TransactionDetailScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="BudgetDetail"
                component={BudgetDetailScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="Help"
                component={HelpScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="Privacy"
                component={PrivacyScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="Terms"
                component={TermsScreen}
                options={{ presentation: 'modal' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
