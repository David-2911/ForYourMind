import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import { useAuth } from "@/lib/auth";

function Router() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/employee" component={() => {
        if (!isAuthenticated || user?.role !== "individual") {
          return <LandingPage />;
        }
        return <EmployeeDashboard />;
      }} />
      <Route path="/manager" component={() => {
        if (!isAuthenticated || user?.role !== "manager") {
          return <LandingPage />;
        }
        return <ManagerDashboard />;
      }} />
      <Route path="/admin" component={() => {
        if (!isAuthenticated || user?.role !== "admin") {
          return <LandingPage />;
        }
        return <AdminDashboard />;
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
