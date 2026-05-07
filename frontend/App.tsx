import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "@/application/auth/authStore";
import { AccountsScreen } from "@/presentation/screens/AccountsScreen";
import { AddAccountScreen } from "@/presentation/screens/AddAccountScreen";
import { AddIncomeScreen } from "@/presentation/screens/AddIncomeScreen";
import { AddTransactionScreen } from "@/presentation/screens/AddTransactionScreen";
import { EditTransactionScreen } from "@/presentation/screens/EditTransactionScreen";
import { AddSavingsGoalScreen } from "@/presentation/screens/AddSavingsGoalScreen";
import { BudgetAdviceScreen } from "@/presentation/screens/BudgetAdviceScreen";
import { BudgetScreen } from "@/presentation/screens/BudgetScreen";
import { ImportScreen } from "@/presentation/screens/ImportScreen";
import { SavingsGoalsScreen } from "@/presentation/screens/SavingsGoalsScreen";
import { ScanReceiptScreen } from "@/presentation/screens/ScanReceiptScreen";
import { HomeScreen } from "@/presentation/screens/HomeScreen";
import { IncomesScreen } from "@/presentation/screens/IncomesScreen";
import { SetBudgetScreen } from "@/presentation/screens/SetBudgetScreen";
import { TransactionsScreen } from "@/presentation/screens/TransactionsScreen";
import { EditAccountScreen } from "@/presentation/screens/EditAccountScreen";
import { TransferScreen } from "@/presentation/screens/TransferScreen";
import { LoginScreen } from "@/presentation/screens/LoginScreen";
import { NotificationsScreen } from "@/presentation/screens/NotificationsScreen";
import { OnboardingScreen } from "@/presentation/screens/OnboardingScreen";
import { ProfileScreen } from "@/presentation/screens/ProfileScreen";
import { SignUpScreen } from "@/presentation/screens/SignUpScreen";
import { useNotificationsStore } from "@/application/notifications/notificationsStore";
import { finoptTheme } from "@/presentation/theme/theme";
import { Ionicons } from "@expo/vector-icons";

const logo = require("./assets/FinOptLogo.png") as number;

export type RootStackParamList = {
  Notifications: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Onboarding: undefined;
  Profile: undefined;
  Accounts: undefined;
  AddAccount: undefined;
  Incomes: undefined;
  AddIncome: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
  EditTransaction: { transactionId: string };
  Transfer: undefined;
  EditAccount: { accountId: string };
  Budget: undefined;
  SetBudget: undefined;
  Import: undefined;
  ScanReceipt: undefined;
  SavingsGoals: undefined;
  AddSavingsGoal: { goalId?: string };
  BudgetAdvice: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function NotificationBell({ onPress }: { onPress: () => void }) {
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  return (
    <Pressable onPress={onPress} style={{ marginRight: 4, padding: 4 }}>
      <Ionicons name="notifications-outline" size={22} color={finoptTheme.colors.foreground} />
      {unreadCount > 0 && (
        <View style={{
          position: "absolute", top: 2, right: 2,
          backgroundColor: finoptTheme.colors.danger,
          borderRadius: 6, minWidth: 14, height: 14,
          alignItems: "center", justifyContent: "center", paddingHorizontal: 2,
        }}>
          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800", lineHeight: 12 }}>
            {unreadCount > 9 ? "9+" : String(unreadCount)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: finoptTheme.colors.background }}>
        <ActivityIndicator size="large" color={finoptTheme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          contentStyle: { backgroundColor: finoptTheme.colors.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: finoptTheme.colors.card },
          headerTintColor: finoptTheme.colors.foreground,
          headerTitleStyle: { fontWeight: "800" },
          headerTitle: () => (
            <Image source={logo} style={{ width: 100, height: 32 }} resizeMode="contain" />
          ),
          headerRight: () => (
            <NotificationBell onPress={() => navigation.navigate("Notifications")} />
          ),
        })}
      >
        {!hasCompletedOnboarding && !user ? (
          <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
            {() => <OnboardingScreen onComplete={() => setHasCompletedOnboarding(true)} />}
          </Stack.Screen>
        ) : user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Finopt" }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
            <Stack.Screen name="Accounts" component={AccountsScreen} options={{ title: "Comptes" }} />
            <Stack.Screen
              name="AddAccount"
              component={AddAccountScreen}
              options={{ title: "Nouveau compte" }}
            />
            <Stack.Screen name="Incomes" component={IncomesScreen} options={{ title: "Revenus" }} />
            <Stack.Screen
              name="AddIncome"
              component={AddIncomeScreen}
              options={{ title: "Nouveau revenu" }}
            />
            <Stack.Screen
              name="Transactions"
              component={TransactionsScreen}
              options={{ title: "Transactions" }}
            />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ title: "Nouvelle transaction" }}
            />
            <Stack.Screen
              name="EditTransaction"
              component={EditTransactionScreen}
              options={{ title: "Modifier la transaction" }}
            />
            <Stack.Screen
              name="Budget"
              component={BudgetScreen}
              options={{ title: "Budget mensuel" }}
            />
            <Stack.Screen
              name="SetBudget"
              component={SetBudgetScreen}
              options={{ title: "Définir le budget" }}
            />
            <Stack.Screen
              name="Import"
              component={ImportScreen}
              options={{ title: "Importer un relevé" }}
            />
            <Stack.Screen
              name="ScanReceipt"
              component={ScanReceiptScreen}
              options={{ title: "Scanner un ticket" }}
            />
            <Stack.Screen
              name="SavingsGoals"
              component={SavingsGoalsScreen}
              options={{ title: "Épargne" }}
            />
            <Stack.Screen
              name="AddSavingsGoal"
              component={AddSavingsGoalScreen}
              options={{ title: "Objectif d'épargne" }}
            />
            <Stack.Screen
              name="BudgetAdvice"
              component={BudgetAdviceScreen}
              options={{ title: "Conseils IA" }}
            />
            <Stack.Screen
              name="Transfer"
              component={TransferScreen}
              options={{ title: "Virement" }}
            />
            <Stack.Screen
              name="EditAccount"
              component={EditAccountScreen}
              options={{ title: "Modifier le compte" }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: "Notifications" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Connexion" }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Inscription" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
