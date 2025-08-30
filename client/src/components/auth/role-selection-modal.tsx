import { Users, User } from "lucide-react";
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
  onRoleSelect: (role: "individual" | "manager") => void;
}

export default function RoleSelectionModal({
  isOpen,
  onClose,
  onRoleSelect,
}: RoleSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-2xl animate-slide-up border-none bg-card/95 backdrop-blur-xl">
        <DialogHeader className="text-center mb-8">
          <DialogTitle className="text-3xl font-bold mb-4 text-foreground">
            Sign in to For Your Mind
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-muted-foreground">
            Choose your path: Individuals or Businesses
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Individuals */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Button
              data-testid={`role-button-individual`}
              variant="ghost"
              className="h-auto p-0 w-full"
              onClick={() => onRoleSelect("individual")}
            >
              <GlassmorphicCard className="text-center card-hover w-full group hover:scale-105 transition-all duration-300">
                <div className={`w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-pulse-gentle`}>
                  <User className="text-2xl text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Individuals</h4>
                <p className="text-xs text-muted-foreground font-medium">
                  Personal wellness in Nigeria
                </p>
              </GlassmorphicCard>
            </Button>
          </div>

          {/* Businesses */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <GlassmorphicCard className="w-full h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-gentle">
                  <Users className="text-2xl text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Businesses</h4>
                <p className="text-xs text-muted-foreground font-medium mb-4">Choose your role</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    data-testid="role-button-employee"
                    variant="outline"
                    className="font-semibold"
                    onClick={() => onRoleSelect("individual")}
                  >
                    Employee
                  </Button>
                  <Button
                    data-testid="role-button-manager"
                    className="btn-primary text-white font-semibold"
                    onClick={() => onRoleSelect("manager")}
                  >
                    Manager
                  </Button>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
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
