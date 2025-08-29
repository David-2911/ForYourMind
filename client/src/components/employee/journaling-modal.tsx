import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, BookOpen, ArrowLeft, CalendarDays, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import MoodSelector from "@/components/common/mood-selector";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface JournalingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component to view all journal entries
const JournalEntriesView = ({ 
  journals, 
  isLoading, 
  onBack 
}: { 
  journals: any[]; 
  isLoading: boolean; 
  onBack: () => void;
}) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading journal entries...</div>;
  }

  if (!journals.length) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">You haven't created any journal entries yet.</p>
        <Button onClick={onBack}>Start Journaling</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Journal
        </Button>
        <span className="text-sm text-muted-foreground">
          {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="grid gap-4">
        {journals.map((journal: any) => (
          <GlassmorphicCard key={journal.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays size={16} />
                <span>{new Date(journal.createdAt).toLocaleDateString()}</span>
                <Clock size={16} className="ml-2" />
                <span>{new Date(journal.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {journal.moodScore !== undefined && (
                  <Badge variant="outline" className="bg-primary/10">
                    Mood: {journal.moodScore}/5
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="whitespace-pre-wrap my-3">{journal.content}</p>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {journal.tags && journal.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </GlassmorphicCard>
        ))}
      </div>
    </div>
  );
};

export default function JournalingModal({ isOpen, onClose }: JournalingModalProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | undefined>();
  const [tags, setTags] = useState<string[]>(["Gratitude", "Reflection"]);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent journals
  const { data: journals = [], isLoading: isLoadingJournals } = useQuery({
    queryKey: ["/api/journals"],
    enabled: isOpen,
  });

  const createJournalMutation = useMutation({
    mutationFn: async (data: { content: string; moodScore: number | undefined; tags: string[] }) => {
      return await apiRequest("POST", "/journals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      toast({
        title: "Journal saved",
        description: "Your journal entry has been saved successfully.",
      });
      setContent("");
      setMood(undefined);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createJournalMutation.mutate({
      content,
      moodScore: mood,
      tags,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up border-none [&>button]:hidden">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-bold">
            {showAllEntries ? "Journal History" : "Personal Journal"}
          </DialogTitle>
          <Button
            data-testid="button-close-journal"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="text-xl" />
          </Button>
        </DialogHeader>

        {showAllEntries ? (
          <JournalEntriesView 
            journals={journals as any[]} 
            isLoading={isLoadingJournals} 
            onBack={() => setShowAllEntries(false)}
          />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <img
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
                alt="Peaceful forest path for reflection"
                className="rounded-xl mb-4 w-full h-40 object-cover"
              />
              <Textarea
                data-testid="textarea-journal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind today? Write freely about your thoughts, feelings, and experiences..."
                className="w-full h-64 resize-none"
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  data-testid="button-save-journal"
                  onClick={handleSubmit}
                  className="btn-primary text-white"
                  disabled={!content.trim() || createJournalMutation.isPending}
                >
                  {createJournalMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <GlassmorphicCard>
                <h4 className="font-semibold mb-2">Today's Prompt</h4>
                <p className="text-sm text-muted-foreground">
                  "What are three things you're grateful for today, and why do they matter to you?"
                </p>
              </GlassmorphicCard>

              <GlassmorphicCard>
                <h4 className="font-semibold mb-2">Mood Tracker</h4>
                <MoodSelector onMoodSelect={setMood} selectedMood={mood} size="sm" />
              </GlassmorphicCard>

              <GlassmorphicCard>
                <h4 className="font-semibold mb-2">Recent Entries</h4>
                {isLoadingJournals ? (
                  <div className="text-center py-2">Loading...</div>
                ) : journals.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No entries yet</div>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      {(journals as any[]).slice(0, 3).map((journal: any) => (
                        <div key={journal.id} className="text-sm border-l-2 border-secondary pl-2">
                          <div className="font-medium">
                            {new Date(journal.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-muted-foreground truncate">
                            {journal.content.slice(0, 50)}...
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setShowAllEntries(true)}
                    >
                      <BookOpen size={16} />
                      View All Entries
                    </Button>
                  </>
                )}
              </GlassmorphicCard>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
