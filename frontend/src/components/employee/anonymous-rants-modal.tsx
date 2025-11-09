import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Heart, HandHeart, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AnonymousRant } from "@/types";

interface AnonymousRantsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnonymousRantsModal({ isOpen, onClose }: AnonymousRantsModalProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rants = [], isLoading } = useQuery({
    queryKey: ["/rants"],
    enabled: isOpen,
  });

  const createRantMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      return apiRequest("POST", "/rants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/rants"] });
      toast({
        title: "Rant submitted",
        description: "Your thoughts have been shared anonymously",
      });
      setContent("");
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const supportRantMutation = useMutation({
    mutationFn: async (rantId: string) => {
      return apiRequest("POST", `/rants/${rantId}/support`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/rants"] });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createRantMutation.mutate({ content });
  };

  const getSentimentColor = (score: number) => {
    if (score < -0.5) return "border-red-400";
    if (score < 0) return "border-yellow-400";
    return "border-green-400";
  };

  const getSentimentLabel = (score: number) => {
    if (score < -0.5) return "Stressed";
    if (score < 0) return "Anxious";
    return "Hopeful";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up border-none [&>button]:hidden">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-bold">Safe Vent Space</DialogTitle>
          <Button
            data-testid="button-close-rants"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="text-xl" />
          </Button>
        </DialogHeader>

        <div className="mb-6">
          <Textarea
            data-testid="textarea-rant-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what's bothering you... This is completely anonymous and safe."
            className="w-full h-32 resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Completely anonymous • Auto-moderated for safety
            </p>
            <Button
              data-testid="button-post-rant"
              onClick={handleSubmit}
              className="btn-primary text-white"
              disabled={!content.trim() || createRantMutation.isPending}
            >
              {createRantMutation.isPending ? "Posting..." : "Post Anonymously"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : (
            (rants as AnonymousRant[]).map((rant: AnonymousRant) => (
              <GlassmorphicCard
                key={rant.id}
                className={`border-l-4 ${getSentimentColor(rant.sentimentScore)}`}
              >
                <p className="text-sm mb-2">{rant.content}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {new Date(rant.createdAt).toLocaleString()} • 
                    Sentiment: {getSentimentLabel(rant.sentimentScore)}
                  </span>
                  <div className="flex space-x-4">
                    <Button
                      data-testid={`button-heart-${rant.id}`}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 hover:text-secondary text-xs"
                      onClick={() => supportRantMutation.mutate(rant.id)}
                    >
                      <Heart className="w-3 h-3" />
                      <span>{rant.supportCount}</span>
                    </Button>
                    <Button
                      data-testid={`button-support-${rant.id}`}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 hover:text-accent text-xs"
                    >
                      <HandHeart className="w-3 h-3" />
                      <span>Support</span>
                    </Button>
                  </div>
                </div>
              </GlassmorphicCard>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
