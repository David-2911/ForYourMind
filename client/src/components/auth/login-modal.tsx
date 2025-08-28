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
      setTimeout(() => {
        setLocation(config.redirect);
        // Force a page reload to ensure fresh auth state
        window.location.reload();
      }, 100);
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

          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="password" className="text-foreground font-semibold text-sm md:text-base mb-2 block">Password</Label>
            <Input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
              placeholder="Enter your password"
            />
          </div>

          {(role === "manager" || role === "admin") && (
            <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="orgCode" className="text-foreground font-semibold text-sm md:text-base mb-2 block">
                {role === "admin" ? "2FA Code" : "Organization Code"}
              </Label>
              <Input
                id="orgCode"
                data-testid="input-org-code"
                type="text"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value)}
                className="mt-2 bg-background/60 border-border/60 focus:border-primary focus:bg-background/80 transition-all duration-300 text-sm md:text-base py-3 md:py-4 px-4 rounded-lg shadow-sm"
                placeholder={role === "admin" ? "Enter 2FA code" : "Enter organization code"}
              />
            </div>
          )}

          <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.4s' }}>
            <Button
              data-testid="button-sign-in"
              type="submit"
              className="btn-primary w-full text-white font-semibold hover:scale-105 transition-all duration-300 text-sm md:text-base py-3 md:py-4 rounded-lg shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : role === "admin" ? "Access Console" : "Sign In"}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6 md:mt-8 animate-fade-in-up px-2" style={{ animationDelay: '0.5s' }}>
          <Button
            data-testid="link-signup"
            variant="link"
            onClick={onSwitchToSignup}
            className="text-ring hover:text-primary font-semibold hover:underline transition-colors duration-300 text-sm md:text-base"
          >
            Don't have an account? <span className="font-bold">Sign up</span>
          </Button>
        </div>

        <div className="animate-fade-in-up px-1" style={{ animationDelay: '0.6s' }}>
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
