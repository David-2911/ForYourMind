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
      <DialogContent className="glassmorphic max-w-2xl animate-slide-up border-none">
        <DialogHeader className="text-center mb-8">
          <DialogTitle className="text-3xl font-bold mb-4">
            Choose Your Role
          </DialogTitle>
          <DialogDescription>
            Select how you'll be using For Your Mind
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Button
              key={role.key}
              data-testid={`role-button-${role.key}`}
              variant="ghost"
              className="h-auto p-0"
              onClick={() => onRoleSelect(role.key)}
            >
              <GlassmorphicCard className="text-center card-hover w-full group">
                <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <role.icon className="text-2xl text-foreground" />
                </div>
                <h4 className="font-semibold mb-2">{role.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </GlassmorphicCard>
            </Button>
          ))}
        </div>

        <Button
          data-testid="button-cancel-role"
          onClick={onClose}
          variant="outline"
          className="mt-8 w-full"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
