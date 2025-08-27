import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Bell, Book, UserCheck, GraduationCap, MessageCircle, Leaf } from "lucide-react";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import MoodSelector from "@/components/common/mood-selector";
import JournalingModal from "@/components/employee/journaling-modal";
import TherapistsModal from "@/components/employee/therapists-modal";
import AnonymousRantsModal from "@/components/employee/anonymous-rants-modal";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDashboard() {
  const [showJournaling, setShowJournaling] = useState(false);
  const [showTherapists, setShowTherapists] = useState(false);
  const [showRants, setShowRants] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's mood entries for streak calculation
  const { data: moodEntries = [] } = useQuery({
    queryKey: ["/api/mood"],
  });

  // Fetch recent journals
  const { data: journals = [] } = useQuery({
    queryKey: ["/api/journals"],
  });

  const recordMoodMutation = useMutation({
    mutationFn: async (moodScore: number) => {
      return apiRequest("POST", "/api/mood", { moodScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      toast({
        title: "Mood recorded",
        description: "Thanks for checking in with yourself today",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to record mood",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMoodSelect = (mood: number) => {
    recordMoodMutation.mutate(mood);
  };

  // Calculate wellness streak (simplified)
  const wellnessStreak = moodEntries.length > 0 ? 7 : 0;
  const todaySessions = 3;
  const wellnessScore = 8.2;

  return (
    <div className="min-h-screen">
      <title>Employee Dashboard - For Your Mind</title>
      <meta name="description" content="Your personal wellness dashboard with mood tracking, journaling, and professional support resources." />

      {/* Navigation */}
      <nav className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Brain className="text-secondary-foreground" />
            </div>
            <h1 className="text-xl font-bold">For Your Mind</h1>
            <Badge variant="secondary">Individual</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></span>
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user?.displayName?.charAt(0) || "U"}
              </span>
            </div>
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="sm"
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.displayName}!</h2>
          <p className="text-muted-foreground">How are you feeling today?</p>
        </div>

        {/* Daily Check-in */}
        <GlassmorphicCard className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Daily Mood Check-in</h3>
          <div className="mb-4">
            <MoodSelector onMoodSelect={handleMoodSelect} />
          </div>
          <div className="text-center">
            <Button
              data-testid="button-record-mood"
              className="btn-primary text-white"
              disabled={recordMoodMutation.isPending}
            >
              {recordMoodMutation.isPending ? "Recording..." : "Record Mood"}
            </Button>
          </div>
        </GlassmorphicCard>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Wellness Streak */}
          <GlassmorphicCard className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="progress-ring w-full h-full">
                <circle 
                  cx="40" 
                  cy="40" 
                  r="36" 
                  stroke="hsl(240, 67%, 94%)" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="hsl(186, 100%, 27%)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="226"
                  strokeDashoffset="68"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{wellnessStreak}</span>
              </div>
            </div>
            <h4 className="font-semibold mb-2">Day Streak</h4>
            <p className="text-sm text-muted-foreground">Keep it up!</p>
          </GlassmorphicCard>

          {/* Today's Sessions */}
          <GlassmorphicCard className="text-center">
            <Leaf className="w-16 h-16 text-secondary mb-4 mx-auto" />
            <h4 className="font-semibold mb-2">Today's Sessions</h4>
            <p className="text-2xl font-bold text-ring">{todaySessions}</p>
            <p className="text-sm text-muted-foreground">15 min remaining</p>
          </GlassmorphicCard>

          {/* Wellness Score */}
          <GlassmorphicCard className="text-center">
            <div className="text-4xl font-bold text-accent mb-2">{wellnessScore}</div>
            <h4 className="font-semibold mb-2">Wellness Score</h4>
            <p className="text-sm text-muted-foreground">↗ +0.3 this week</p>
          </GlassmorphicCard>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Button
            data-testid="button-journal-entry"
            variant="ghost"
            className="glassmorphic rounded-xl p-4 text-center card-hover h-auto flex flex-col"
            onClick={() => setShowJournaling(true)}
          >
            <Book className="w-8 h-8 text-secondary mb-2" />
            <p className="font-medium">Journal Entry</p>
          </Button>
          
          <Button
            data-testid="button-book-therapy"
            variant="ghost"
            className="glassmorphic rounded-xl p-4 text-center card-hover h-auto flex flex-col"
            onClick={() => setShowTherapists(true)}
          >
            <UserCheck className="w-8 h-8 text-primary mb-2" />
            <p className="font-medium">Book Therapy</p>
          </Button>
          
          <Button
            data-testid="button-learn"
            variant="ghost"
            className="glassmorphic rounded-xl p-4 text-center card-hover h-auto flex flex-col"
          >
            <GraduationCap className="w-8 h-8 text-accent mb-2" />
            <p className="font-medium">Learn</p>
          </Button>
          
          <Button
            data-testid="button-vent-space"
            variant="ghost"
            className="glassmorphic rounded-xl p-4 text-center card-hover h-auto flex flex-col"
            onClick={() => setShowRants(true)}
          >
            <MessageCircle className="w-8 h-8 text-ring mb-2" />
            <p className="font-medium">Vent Space</p>
          </Button>
        </div>

        {/* Recent Activity */}
        <GlassmorphicCard>
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-muted-foreground">Completed breathing exercise</span>
              <span className="text-sm text-muted-foreground ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-muted-foreground">Journaled about gratitude</span>
              <span className="text-sm text-muted-foreground ml-auto">Yesterday</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">Matched with wellness buddy</span>
              <span className="text-sm text-muted-foreground ml-auto">2 days ago</span>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Modals */}
      <JournalingModal
        isOpen={showJournaling}
        onClose={() => setShowJournaling(false)}
      />
      
      <TherapistsModal
        isOpen={showTherapists}
        onClose={() => setShowTherapists(false)}
      />
      
      <AnonymousRantsModal
        isOpen={showRants}
        onClose={() => setShowRants(false)}
      />
    </div>
  );
}
