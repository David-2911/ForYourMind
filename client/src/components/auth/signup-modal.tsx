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

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "individual" | "manager" | "admin";
  onSwitchToLogin: () => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  role,
  onSwitchToLogin,
}: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organizationCode, setOrganizationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { register } = useAuth();
  const [, setLocation] = useLocation();

  const roleConfig = {
    individual: {
      icon: User,
      title: "Join For Your Mind",
      description: "Start your wellness journey today",
      color: "bg-secondary",
      redirect: "/employee",
    },
    manager: {
      icon: Users,
      title: "Manager Registration",
      description: "Set up team wellness oversight",
      color: "bg-accent",
      redirect: "/manager",
    },
    admin: {
      icon: Settings,
      title: "Admin Registration",
      description: "Platform administration access",
      color: "bg-primary",
      redirect: "/admin",
    },
  };

  const config = roleConfig[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please ensure passwords match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await register({
        email,
        password,
        displayName,
        role,
      });
      
      toast({
        title: "Account created successfully",
        description: `Welcome to For Your Mind, ${displayName}!`,
      });
      
      // Close modal first, then redirect after a small delay to ensure state updates
      onClose();
      setTimeout(() => {
        setLocation(config.redirect);
        // Force a page reload to ensure fresh auth state
        window.location.reload();
      }, 100);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
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
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              data-testid="input-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-2"
            />
          </div>

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

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              data-testid="input-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {(role === "manager" || role === "admin") && (
            <div>
              <Label htmlFor="orgCode">
                {role === "admin" ? "Admin Access Code" : "Organization Code"}
              </Label>
              <Input
                id="orgCode"
                data-testid="input-org-code"
                type="text"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value)}
                placeholder={role === "admin" ? "Contact support for code" : "Provided by your organization"}
                className="mt-2"
              />
            </div>
          )}

          <Button
            data-testid="button-create-account"
            type="submit"
            className="btn-primary w-full text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Button
            data-testid="link-login"
            variant="link"
            onClick={onSwitchToLogin}
            className="text-ring hover:underline"
          >
            Already have an account? Sign in
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