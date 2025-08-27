import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Users, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "individual" | "manager" | "admin";
  onSwitchToSignup: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  role,
  onSwitchToSignup,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationCode, setOrganizationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const roleConfig = {
    individual: {
      icon: User,
      title: "Welcome Back",
      description: "Continue your wellness journey",
      color: "bg-secondary",
      redirect: "/employee",
    },
    manager: {
      icon: Users,
      title: "Manager Portal",
      description: "Access team wellness insights",
      color: "bg-accent",
      redirect: "/manager",
    },
    admin: {
      icon: Settings,
      title: "Admin Console",
      description: "Platform administration",
      color: "bg-primary",
      redirect: "/admin",
    },
  };

  const config = roleConfig[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password, organizationCode);
      toast({
        title: "Login successful",
        description: `Welcome to For Your Mind ${config.title}`,
      });
      onClose();
      setLocation(config.redirect);
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-md animate-slide-up border-none">
        <DialogHeader className="text-center mb-8">
          <div className={`w-16 h-16 ${config.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <config.icon className="text-2xl text-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold mb-2">
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {(role === "manager" || role === "admin") && (
            <div>
              <Label htmlFor="orgCode">
                {role === "admin" ? "2FA Code" : "Organization Code"}
              </Label>
              <Input
                id="orgCode"
                data-testid="input-org-code"
                type="text"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          <Button
            data-testid="button-sign-in"
            type="submit"
            className="btn-primary w-full text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : role === "admin" ? "Access Console" : "Sign In"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Button
            data-testid="link-signup"
            variant="link"
            onClick={onSwitchToSignup}
            className="text-ring hover:underline"
          >
            Don't have an account? Sign up
          </Button>
        </div>

        <Button
          data-testid="button-back-role"
          variant="ghost"
          onClick={onClose}
          className="mt-4 w-full text-muted-foreground hover:text-foreground"
        >
          ← Back to role selection
        </Button>
      </DialogContent>
    </Dialog>
  );
}
