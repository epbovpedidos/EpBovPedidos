import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ClientesList from "@/pages/clientes";
import ClienteForm from "@/pages/clientes/form";
import PedidosList from "@/pages/pedidos";
import Relatorios from "@/pages/relatorios";
import Configuracoes from "@/pages/configuracoes";
import PedidoForm from "@/pages/pedidos/form";
import PedidoView from "@/pages/pedidos/view";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/clientes">
        <AppLayout>
          <ClientesList />
        </AppLayout>
      </Route>
      <Route path="/clientes/:id/editar">
        <AppLayout>
          <ClienteForm />
        </AppLayout>
      </Route>
      <Route path="/clientes/novo">
        <AppLayout>
          <ClienteForm />
        </AppLayout>
      </Route>
      <Route path="/pedidos">
        <AppLayout>
          <PedidosList />
        </AppLayout>
      </Route>
      <Route path="/pedidos/novo">
        <AppLayout>
          <PedidoForm />
        </AppLayout>
      </Route>
      <Route path="/pedidos/:id/editar">
        <AppLayout>
          <PedidoForm />
        </AppLayout>
      </Route>
      <Route path="/pedidos/:id">
        <AppLayout>
          <PedidoView />
        </AppLayout>
      </Route>
      <Route path="/relatorios">
        <AppLayout>
          <Relatorios />
        </AppLayout>
      </Route>
      <Route path="/configuracoes">
        <AppLayout>
          <Configuracoes />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
