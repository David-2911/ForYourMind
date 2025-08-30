import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/auth/login-modal";
import { useAuth } from "@/lib/auth";
import { Brain } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminAccessPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      setShowLogin(true);
    }
  }, [isAuthenticated, user?.role]);

  if (isAuthenticated && user?.role === "admin") {
    // If already admin, redirect to dashboard
    setLocation("/admin");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
            <Brain className="text-foreground w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">For Your Mind</h1>
        </div>
        <h2 className="text-xl font-semibold">Admin Access</h2>
        <p className="text-sm text-muted-foreground">
          This area is restricted. Authorized administrators only.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setShowLogin(true)} className="btn-primary">Admin Sign In</Button>
          <Button variant="outline" onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        role="admin"
        onSwitchToSignup={() => setShowLogin(false)}
      />
    </div>
  );
}
