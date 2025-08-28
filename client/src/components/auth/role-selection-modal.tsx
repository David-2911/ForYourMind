import { Users, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (role: "individual" | "manager" | "admin") => void;
}

export default function RoleSelectionModal({
  isOpen,
  onClose,
  onRoleSelect,
}: RoleSelectionModalProps) {
  const roles = [
    {
      key: "individual" as const,
      icon: User,
      title: "Individual",
      description: "Personal wellness journey",
      color: "bg-secondary",
    },
    {
      key: "manager" as const,
      icon: Users,
      title: "Manager",
      description: "Team wellness oversight",
      color: "bg-accent",
    },
    {
      key: "admin" as const,
      icon: Settings,
      title: "Admin",
      description: "Platform management",
      color: "bg-primary",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-2xl animate-slide-up border-none bg-card/95 backdrop-blur-xl">
        <DialogHeader className="text-center mb-8">
          <DialogTitle className="text-3xl font-bold mb-4 text-foreground">
            Choose Your Role
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-muted-foreground">
            Select how you'll be using For Your Mind
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <div key={role.key} className="animate-fade-in-up" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
              <Button
                data-testid={`role-button-${role.key}`}
                variant="ghost"
                className="h-auto p-0 w-full"
                onClick={() => onRoleSelect(role.key)}
              >
                <GlassmorphicCard className="text-center card-hover w-full group hover:scale-105 transition-all duration-300">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-pulse-gentle`}>
                    <role.icon className="text-2xl text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{role.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium">
                    {role.description}
                  </p>
                </GlassmorphicCard>
              </Button>
            </div>
          ))}
        </div>

        <div className="animate-fade-in-up mt-8" style={{ animationDelay: '0.5s' }}>
          <Button
            data-testid="button-cancel-role"
            onClick={onClose}
            variant="outline"
            className="w-full font-semibold hover:bg-muted/50 transition-all duration-300"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
