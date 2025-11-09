import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Users } from "lucide-react";
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
  role: "individual" | "manager";
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
      <DialogContent className="glassmorphic max-w-md animate-slide-up border-none bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="text-center mb-6 md:mb-8">
          <div className={`w-16 h-16 md:w-20 md:h-20 ${config.color} rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 animate-pulse-gentle shadow-lg`}>
            <config.icon className="text-2xl md:text-3xl text-white" />
          </div>
          <DialogTitle className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-foreground leading-tight">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed px-2">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.1s' }}>
            <Label htmlFor="displayName" className="text-foreground font-semibold text-sm md:text-base mb-2 block">Full Name</Label>
            <Input
              id="displayName"
              data-testid="input-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
              placeholder="Enter your full name"
            />
          </div>

          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="email" className="text-foreground font-semibold text-sm md:text-base mb-2 block">Email Address</Label>
            <Input
              id="email"
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
              placeholder="Enter your email"
            />
          </div>

          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.3s' }}>
            <Label htmlFor="password" className="text-foreground font-semibold text-sm md:text-base mb-2 block">Password</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
              placeholder="Create a password (min 6 characters)"
            />
          </div>

          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.4s' }}>
            <Label htmlFor="confirmPassword" className="text-foreground font-semibold text-sm md:text-base mb-2 block">Confirm Password</Label>
            <Input
              id="confirmPassword"
              data-testid="input-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
              placeholder="Confirm your password"
            />
          </div>

      {role === "manager" && (
            <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.5s' }}>
              <Label htmlFor="orgCode" className="text-foreground font-semibold text-sm md:text-base mb-2 block">
        Organization Code
              </Label>
              <Input
                id="orgCode"
                data-testid="input-org-code"
                type="text"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value)}
        placeholder="Provided by your organization"
                className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
              />
            </div>
          )}

          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.6s' }}>
            <Button
              data-testid="button-create-account"
              type="submit"
              className="btn-primary w-full text-white font-semibold hover:scale-105 transition-all duration-300 text-sm md:text-base py-3 md:py-4 rounded-lg shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6 md:mt-8 animate-fade-in-up px-2" style={{ animationDelay: '0.7s' }}>
          <Button
            data-testid="link-login"
            variant="link"
            onClick={onSwitchToLogin}
            className="text-ring hover:text-primary font-semibold hover:underline transition-colors duration-300 text-sm md:text-base"
          >
            Already have an account? <span className="font-bold">Sign in</span>
          </Button>
        </div>

        <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.8s' }}>
          <Button
            data-testid="button-back-role"
            variant="ghost"
            onClick={onClose}
            className="mt-4 w-full text-muted-foreground hover:text-foreground font-medium hover:bg-muted/50 transition-all duration-300 text-sm md:text-base py-2 md:py-3 rounded-lg"
          >
            ← Back to role selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}