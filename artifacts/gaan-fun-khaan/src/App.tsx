import { Switch, Route, Router as WouterRouter } from "wouter";
import BillingScreen from "@/pages/BillingScreen";
import HistoryScreen from "@/pages/HistoryScreen";
import SalesScreen from "@/pages/SalesScreen";
import InventoryScreen from "@/pages/InventoryScreen";
import SettingsScreen from "@/pages/SettingsScreen";
import AuthScreen from "@/pages/AuthScreen";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BillingScreen} />
      <Route path="/history" component={HistoryScreen} />
      <Route path="/sales" component={SalesScreen} />
      <Route path="/inventory" component={InventoryScreen} />
      <Route path="/settings" component={SettingsScreen} />
    </Switch>
  );
}

function App() {
  const { session, isLoading } = useSupabaseSession();

  if (supabase && isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background font-bold text-muted-foreground">Loading POS...</div>;
  }

  if (supabase && !session) {
    return <AuthScreen />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
      <NavBar />
    </WouterRouter>
  );
}

export default App;
