import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
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
import { TransferScreen } from "@/presentation/screens/TransferScreen";
import { LoginScreen } from "@/presentation/screens/LoginScreen";
import { OnboardingScreen } from "@/presentation/screens/OnboardingScreen";
import { ProfileScreen } from "@/presentation/screens/ProfileScreen";
import { SignUpScreen } from "@/presentation/screens/SignUpScreen";
import { finoptTheme } from "@/presentation/theme/theme";

export type RootStackParamList = {
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
  Budget: undefined;
  SetBudget: undefined;
  Import: undefined;
  ScanReceipt: undefined;
  SavingsGoals: undefined;
  AddSavingsGoal: { goalId?: string };
  BudgetAdvice: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
        screenOptions={{
          contentStyle: { backgroundColor: finoptTheme.colors.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: finoptTheme.colors.card },
          headerTintColor: finoptTheme.colors.foreground,
          headerTitleStyle: { fontWeight: "800" },
        }}
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
