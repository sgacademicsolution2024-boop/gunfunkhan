import { Switch, Route, Router as WouterRouter } from "wouter";
import BillingScreen from "@/pages/BillingScreen";
import HistoryScreen from "@/pages/HistoryScreen";
import SalesScreen from "@/pages/SalesScreen";
import NavBar from "@/components/NavBar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BillingScreen} />
      <Route path="/history" component={HistoryScreen} />
      <Route path="/sales" component={SalesScreen} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
      <NavBar />
    </WouterRouter>
  );
}

export default App;
