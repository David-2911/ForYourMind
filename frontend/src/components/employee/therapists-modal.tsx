import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { useQuery } from "@tanstack/react-query";
import { Therapist } from "@/types";

interface TherapistsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TherapistsModal({ isOpen, onClose }: TherapistsModalProps) {
  const { data: therapists = [], isLoading } = useQuery({
    queryKey: ["/api/therapists"],
    enabled: isOpen,
  });

  const getAvailabilityStatus = (availability: Record<string, any>) => {
    if (availability.status === "available") {
      return { label: "Available Today", color: "bg-green-100 text-green-800" };
    } else if (availability.status === "busy") {
      return { label: `Next Available: ${availability.nextSlot}`, color: "bg-yellow-100 text-yellow-800" };
    }
    return { label: "Busy Today", color: "bg-red-100 text-red-800" };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? "text-yellow-500 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-6xl max-h-[90vh] overflow-y-auto animate-slide-up border-none [&>button]:hidden">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-bold">Find Your Therapist</DialogTitle>
          <Button
            data-testid="button-close-therapists"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="text-xl" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading therapists...</div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              {(therapists as Therapist[]).map((therapist: Therapist) => {
                const availability = getAvailabilityStatus(therapist.availability);
                
                return (
                  <GlassmorphicCard key={therapist.id} hover className="text-center">
                    <img
                      src={therapist.profileUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                      alt={`Professional therapist ${therapist.name}`}
                      className="rounded-xl mb-4 w-full h-32 object-cover"
                    />
                    <h4 className="font-semibold mb-2">{therapist.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {therapist.specialization}
                    </p>
                    <div className="flex justify-center mb-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(therapist.rating)}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({therapist.rating})
                        </span>
                      </div>
                    </div>
                    <Badge className={`text-xs mb-3 ${availability.color}`}>
                      {availability.label}
                    </Badge>
                    <Button
                      data-testid={`button-book-${therapist.id}`}
                      className="btn-primary w-full text-white text-sm"
                      disabled={availability.label === "Busy Today"}
                    >
                      {availability.label === "Busy Today" ? "Join Waitlist" : "Book Session"}
                    </Button>
                  </GlassmorphicCard>
                );
              })}
            </div>

            <GlassmorphicCard>
              <h4 className="font-semibold mb-2">Filters</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="cursor-pointer">Anxiety</Badge>
                <Badge variant="outline" className="cursor-pointer">Depression</Badge>
                <Badge variant="outline" className="cursor-pointer">PTSD</Badge>
                <Badge variant="outline" className="cursor-pointer">Relationships</Badge>
                <Badge variant="outline" className="cursor-pointer">Workplace</Badge>
              </div>
            </GlassmorphicCard>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
