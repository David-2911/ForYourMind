import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  ChevronRight,
  Star,
  Shield,
  Lightbulb,
  AlertCircle,
  Brain,
  Users
} from "lucide-react";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import MoodSelector from "@/components/common/mood-selector";
import JournalingModal from "@/components/employee/journaling-modal";
import TherapistsModal from "@/components/employee/therapists-modal";
import AnonymousRantsModal from "@/components/employee/anonymous-rants-modal";
import WellnessAssessmentModal from "@/components/employee/wellness-assessment-modal";
import BreathingExerciseModal from "@/components/employee/breathing-exercise-modal";
import ProfileModal from "@/components/common/profile-modal";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MoodEntry, Journal } from "../../../shared/schema";
import ChatbotWidget from "@/components/chatbot/chatbot-widget";

type ActiveSection =
  | 'dashboard'
  | 'learn'
  | 'relax'
  | 'connect'
  | 'support'
  | 'wellness'
  | 'resources';

type AssessmentResponse = {
  totalScore: number;
  recommendations: string[];
  completedAt: string;
};

export default function EmployeeDashboard() {
  const [showJournaling, setShowJournaling] = useState(false);
  const [showTherapists, setShowTherapists] = useState(false);
  const [showRants, setShowRants] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWellnessAssessment, setShowWellnessAssessment] = useState(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [breathingType, setBreathingType] = useState<'box' | '4-7-8'>('box');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [currentGuidedSession, setCurrentGuidedSession] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keyboard shortcut to close sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's mood entries for streak calculation
  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/mood"],
  });

  // Fetch latest assessment response
  const { data: latestAssessment } = useQuery<AssessmentResponse>({
    queryKey: ["/wellness-assessments/responses/latest"],
    enabled: !!user,
  });

  // Calculate wellness streak from mood entries
  const wellnessStreak = useMemo(() => {
    if (!moodEntries || moodEntries.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort entries by date (most recent first)
    const sortedEntries = [...moodEntries].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let streak = 0;
    let currentDate = new Date(today);

    // Check if user has an entry for today
    const todayEntry = sortedEntries.find(entry => {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (!todayEntry) {
      // No entry today, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
      const yesterdayEntry = sortedEntries.find(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === currentDate.getTime();
      });

      if (!yesterdayEntry) return 0; // No recent entries
      streak = 1; // Yesterday has entry, streak starts at 1
    } else {
      streak = 1; // Today has entry, streak starts at 1
    }

    // Count consecutive days backwards from the most recent entry
    for (let i = 1; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    return streak;
  }, [moodEntries]);

  // Fetch recent journals
  const { data: journals = [] } = useQuery<Journal[]>({
    queryKey: ["/journals"],
  });

  // Calculate today's sessions (mood entries + journal entries)
  const todaySessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sessions = 0;

    // Count today's mood entries
    if (moodEntries) {
      sessions += moodEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      }).length;
    }

    // Count today's journal entries
    if (journals) {
      sessions += journals.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      }).length;
    }

    return sessions;
  }, [moodEntries, journals]);

  // Calculate wellness score based on recent activity and mood
  const wellnessScore = useMemo(() => {
    if (!moodEntries || moodEntries.length === 0) return 0;

    // Get recent mood entries (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEntries = moodEntries.filter(entry =>
      new Date(entry.createdAt) >= sevenDaysAgo
    );

    if (recentEntries.length === 0) return 0;

    // Calculate average mood score (1-5 scale, convert to 0-10 scale)
    const avgMood = recentEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / recentEntries.length;
    const moodScore = (avgMood / 5) * 10;

    // Bonus for streak (max 2 points)
    const streakBonus = Math.min(wellnessStreak * 0.2, 2);

    // Bonus for activity (max 1 point)
    const activityBonus = Math.min(todaySessions * 0.5, 1);

    // Include assessment score if available (max 2 points)
    let assessmentBonus = 0;
    if (latestAssessment?.totalScore) {
      // Assessment score is already 0-10, convert to bonus points
      assessmentBonus = Math.min(latestAssessment.totalScore * 0.2, 2);
    }

    // Calculate final score (0-10 scale)
    const finalScore = Math.min(moodScore + streakBonus + activityBonus + assessmentBonus, 10);

    return finalScore.toFixed(1);
  }, [moodEntries, wellnessStreak, todaySessions, latestAssessment]);

  const recordMoodMutation = useMutation({
    mutationFn: async (moodScore: number) => {
      return apiRequest("POST", "/mood", { moodScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/mood"] });
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

  const navigationItems = [
    { id: 'dashboard' as ActiveSection, label: 'Dashboard', icon: Settings },
    { id: 'learn' as ActiveSection, label: 'Learn', icon: Lightbulb },
    { id: 'relax' as ActiveSection, label: 'Relax', icon: Star },
    { id: 'connect' as ActiveSection, label: 'Connect', icon: Shield },
    { id: 'support' as ActiveSection, label: 'Support', icon: AlertCircle },
    { id: 'wellness' as ActiveSection, label: 'Wellness', icon: Star },
    { id: 'resources' as ActiveSection, label: 'Resources', icon: Settings },
  ];

  const guidedSessions = [
    { id: 'breathing', title: '4-7-8 Breathing', duration: '2 min', type: 'breathing' },
    { id: 'mindfulness', title: 'Mindful Awareness', duration: '5 min', type: 'meditation' },
    { id: 'gratitude', title: 'Gratitude Practice', duration: '3 min', type: 'reflection' },
    { id: 'body-scan', title: 'Body Scan Relaxation', duration: '10 min', type: 'relaxation' },
  ];

  const courses = [
    { id: 'resilience', title: 'Building Resilience', progress: 65, modules: 8 },
    { id: 'mindfulness', title: 'Mindfulness Basics', progress: 30, modules: 12 },
    { id: 'communication', title: 'Effective Communication', progress: 80, modules: 6 },
    { id: 'stress', title: 'Stress Management', progress: 45, modules: 10 },
  ];

  const relaxationTechniques = [
    { id: 'box-breathing', title: 'Box Breathing', description: 'Equal parts inhale, hold, exhale, hold' },
    { id: 'progressive-relaxation', title: 'Progressive Muscle Relaxation', description: 'Systematically tense and relax muscle groups' },
    { id: 'loving-kindness', title: 'Loving-Kindness Meditation', description: 'Cultivate compassion for yourself and others' },
    { id: 'grounding', title: 'Grounding Techniques', description: 'Connect with the present moment' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="mb-6 md:mb-8 animate-fade-in-up">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Welcome back, {user?.displayName}!</h2>
        <p className="text-muted-foreground text-sm md:text-base">How are you feeling today?</p>
      </div>

      {/* Daily Check-in */}
      <GlassmorphicCard className="mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">Daily Mood Check-in</h3>
        <div className="mb-4">
          <MoodSelector onMoodSelect={handleMoodSelect} />
        </div>
        <div className="text-center">
          <Button
            data-testid="button-record-mood"
            className="btn-primary text-white font-semibold hover:scale-105 transition-all duration-300"
            disabled={recordMoodMutation.isPending}
          >
            {recordMoodMutation.isPending ? "Recording..." : "Record Mood"}
          </Button>
        </div>
      </GlassmorphicCard>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Wellness Streak */}
        <GlassmorphicCard className="text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 relative">
            <svg className="progress-ring w-full h-full" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="hsl(240, 67%, 94%)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="hsl(186, 100%, 27%)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="175.93"
                strokeDashoffset={175.93 - (wellnessStreak / 30) * 175.93}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl md:text-2xl font-bold">{wellnessStreak}</span>
            </div>
          </div>
          <h4 className="font-semibold mb-2 text-sm md:text-base">Day Streak</h4>
          <p className="text-xs md:text-sm text-muted-foreground">Keep it up!</p>
        </GlassmorphicCard>

        {/* Today's Sessions */}
        <GlassmorphicCard className="text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
          <Star className="w-12 h-12 md:w-16 md:h-16 text-secondary mb-4 mx-auto animate-float-gentle" />
          <h4 className="font-semibold mb-2 text-sm md:text-base">Today's Sessions</h4>
          <p className="text-xl md:text-2xl font-bold text-ring">{todaySessions}</p>
          <p className="text-xs md:text-sm text-muted-foreground">15 min remaining</p>
        </GlassmorphicCard>

        {/* Wellness Score */}
        <GlassmorphicCard className="text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
          <div className="text-3xl md:text-4xl font-bold text-accent mb-2">{wellnessScore}</div>
          <h4 className="font-semibold mb-2 text-sm md:text-base">Wellness Score</h4>
          <p className="text-xs md:text-sm text-muted-foreground">↗ +0.3 this week</p>
        </GlassmorphicCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Button
          data-testid="button-journal-entry"
          variant="ghost"
          className="glassmorphic rounded-xl p-3 md:p-4 text-center card-hover h-auto flex flex-col animate-fade-in-up hover:scale-105 transition-all duration-300"
          onClick={() => setShowJournaling(true)}
          style={{ animationDelay: '0.5s' }}
        >
          <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-secondary mb-2" />
          <p className="font-medium text-xs md:text-sm">Journal Entry</p>
        </Button>

        <Button
          data-testid="button-book-therapy"
          variant="ghost"
          className="glassmorphic rounded-xl p-3 md:p-4 text-center card-hover h-auto flex flex-col animate-fade-in-up hover:scale-105 transition-all duration-300"
          onClick={() => setShowTherapists(true)}
          style={{ animationDelay: '0.6s' }}
        >
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
          <p className="font-medium text-xs md:text-sm">Book Therapy</p>
        </Button>

        <Button
          data-testid="button-learn"
          variant="ghost"
          className="glassmorphic rounded-xl p-3 md:p-4 text-center card-hover h-auto flex flex-col animate-fade-in-up hover:scale-105 transition-all duration-300"
          onClick={() => setActiveSection('learn')}
          style={{ animationDelay: '0.7s' }}
        >
          <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-accent mb-2" />
          <p className="font-medium text-xs md:text-sm">Learn</p>
        </Button>

        <Button
          data-testid="button-vent-space"
          variant="ghost"
          className="glassmorphic rounded-xl p-3 md:p-4 text-center card-hover h-auto flex flex-col animate-fade-in-up hover:scale-105 transition-all duration-300"
          onClick={() => setShowRants(true)}
          style={{ animationDelay: '0.8s' }}
        >
          <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-ring mb-2" />
          <p className="font-medium text-xs md:text-sm">Vent Space</p>
        </Button>
      </div>

      {/* Featured Resources */}
      <GlassmorphicCard className="mb-6 md:mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-foreground">Today's Wellness Insight</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection('resources')}
            className="text-primary hover:text-primary/80 font-medium"
          >
            View All →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm md:text-base mb-1">5 Common Myths About Mental Health</h4>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">Debunking misconceptions that prevent people from seeking help</p>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto font-medium text-xs">
                  Read More →
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-accent/5 to-primary/5 rounded-lg border border-accent/10">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm md:text-base mb-1">Understanding Anxiety vs. Normal Worry</h4>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">Learn to distinguish between healthy concern and anxiety disorders</p>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 p-0 h-auto font-medium text-xs">
                  Read More →
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <span>15+ articles available</span>
                </div>
                <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-secondary" />
                <span>Weekly newsletter</span>
                </div>
                <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                <span>Personalized recommendations</span>
                </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('resources')}
              className="text-xs md:text-sm"
            >
              Explore Resources
            </Button>
          </div>
        </div>
      </GlassmorphicCard>

      {/* Recent Activity */}
      <GlassmorphicCard className="animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">Recent Activity</h3>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse-gentle"></div>
            <span className="text-muted-foreground text-sm md:text-base">Completed breathing exercise</span>
            <span className="text-xs md:text-sm text-muted-foreground ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-gentle"></div>
            <span className="text-muted-foreground text-sm md:text-base">Journaled about gratitude</span>
            <span className="text-xs md:text-sm text-muted-foreground ml-auto">Yesterday</span>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle"></div>
            <span className="text-muted-foreground text-sm md:text-base">Matched with wellness buddy</span>
            <span className="text-xs md:text-sm text-muted-foreground ml-auto">2 days ago</span>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );

  const renderLearnSection = () => (
    <div className="space-y-6 md:space-y-8">
      <div className="mb-6 md:mb-8 animate-fade-in-up">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Micro-Learning & Courses</h2>
        <p className="text-muted-foreground text-sm md:text-base">Build resilience and life skills with our structured learning paths</p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {courses.map((course, index) => (
          <GlassmorphicCard key={course.id} className="p-4 md:p-6 animate-fade-in-up hover:scale-105 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">{course.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base">{course.modules} modules</p>
              </div>
              <Star className="w-6 h-6 md:w-8 md:h-8 text-accent animate-float-gentle" />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs md:text-sm mb-2">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300 animate-shimmer"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
            <Button className="w-full font-semibold hover:scale-105 transition-all duration-300" variant="outline">
              Continue Learning
            </Button>
          </GlassmorphicCard>
        ))}
      </div>

      {/* Scheduled Practices */}
      <GlassmorphicCard className="p-4 md:p-6 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">Today's Scheduled Practices</h3>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg animate-fade-in-up hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center space-x-2 md:space-x-3">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse-gentle" />
              <div>
                <p className="font-medium text-sm md:text-base">Morning Mindfulness</p>
                <p className="text-xs md:text-sm text-muted-foreground">5-minute meditation</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="font-semibold hover:scale-105 transition-all duration-300">Start</Button>
          </div>
          <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg animate-fade-in-up hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center space-x-2 md:space-x-3">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-accent animate-pulse-gentle" />
              <div>
                <p className="font-medium text-sm md:text-base">Resilience Building</p>
                <p className="text-xs md:text-sm text-muted-foreground">10-minute exercise</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="font-semibold hover:scale-105 transition-all duration-300">Start</Button>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );

  const renderRelaxSection = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Relaxation & Guided Sessions</h2>
        <p className="text-muted-foreground">Find peace and calm with our guided relaxation techniques</p>
      </div>

      {/* Guided Sessions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {guidedSessions.map((session) => (
          <GlassmorphicCard key={session.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                <p className="text-muted-foreground">{session.duration}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={currentGuidedSession === session.id && isPlaying ? "default" : "outline"}
                  onClick={() => {
                    if (session.id === 'breathing') {
                      setBreathingType('4-7-8');
                      setShowBreathingExercise(true);
                    } else {
                      setCurrentGuidedSession(session.id);
                      setIsPlaying(!isPlaying);
                    }
                  }}
                >
                  {currentGuidedSession === session.id && isPlaying ? <Settings className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{session.type}</Badge>
              <Button size="sm" variant="ghost">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </GlassmorphicCard>
        ))}
      </div>

      {/* Relaxation Techniques */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Relaxation Techniques</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {relaxationTechniques.map((technique) => (
            <div key={technique.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <h4 className="font-medium mb-2">{technique.title}</h4>
              <p className="text-sm text-muted-foreground">{technique.description}</p>
              <Button 
                size="sm" 
                variant="ghost" 
                className="mt-2"
                onClick={() => {
                  if (technique.id === 'box-breathing') {
                    setBreathingType('box');
                    setShowBreathingExercise(true);
                  }
                }}
              >
                Try Now
              </Button>
            </div>
          ))}
        </div>
      </GlassmorphicCard>

      {/* Journaling Section */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Journaling & Reflection</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="p-4 h-auto flex flex-col items-center"
            onClick={() => setShowJournaling(true)}
          >
            <Settings className="w-8 h-8 mb-2" />
            <span>Free Write</span>
          </Button>
          <Button variant="outline" className="p-4 h-auto flex flex-col items-center">
            <Star className="w-8 h-8 mb-2" />
            <span>Gratitude</span>
          </Button>
          <Button variant="outline" className="p-4 h-auto flex flex-col items-center">
            <Lightbulb className="w-8 h-8 mb-2" />
            <span>Insights</span>
          </Button>
        </div>
      </GlassmorphicCard>
    </div>
  );

  const renderConnectSection = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Connect & Community</h2>
        <p className="text-muted-foreground">Find support and connection with others on similar journeys</p>
      </div>

      {/* Buddy Matching */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Find Your Wellness Buddy</h3>
        <p className="text-muted-foreground mb-6">Connect with someone who shares similar wellness goals and experiences</p>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Shield className="w-12 h-12 mx-auto mb-2 text-primary" />
            <p className="font-medium">Similar Interests</p>
            <p className="text-sm text-muted-foreground">Meditation, Running</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Star className="w-12 h-12 mx-auto mb-2 text-accent" />
            <p className="font-medium">Same Timezone</p>
            <p className="text-sm text-muted-foreground">Morning sessions</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Star className="w-12 h-12 mx-auto mb-2 text-secondary" />
            <p className="font-medium">Shared Goals</p>
            <p className="text-sm text-muted-foreground">Stress reduction</p>
          </div>
        </div>
        <Button className="w-full">Find My Buddy</Button>
      </GlassmorphicCard>

      {/* Community Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassmorphicCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">Anonymous Vent Space</h3>
          <p className="text-muted-foreground mb-4">Share your thoughts safely and anonymously</p>
          <Button variant="outline" className="w-full" onClick={() => setShowRants(true)}>
            Enter Vent Space
          </Button>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">Community Forums</h3>
          <p className="text-muted-foreground mb-4">Join moderated discussions and support groups</p>
          <Button variant="outline" className="w-full">
            Browse Forums
          </Button>
        </GlassmorphicCard>
      </div>
    </div>
  );

  const renderSupportSection = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Professional Support</h2>
        <p className="text-muted-foreground">Connect with licensed therapists and mental health professionals</p>
      </div>

      {/* Therapist Directory */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Find a Therapist</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">Dr</span>
              </div>
              <div>
                <p className="font-medium">Dr. Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Clinical Psychologist</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">4.9 (127 reviews)</span>
            </div>
            <Button size="sm" className="w-full" onClick={() => setShowTherapists(true)}>
              Book Session
            </Button>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">Ms</span>
              </div>
              <div>
                <p className="font-medium">Ms. Maria Garcia</p>
                <p className="text-sm text-muted-foreground">Licensed Therapist</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">4.8 (89 reviews)</span>
            </div>
            <Button size="sm" className="w-full" onClick={() => setShowTherapists(true)}>
              Book Session
            </Button>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">Mr</span>
              </div>
              <div>
                <p className="font-medium">Mr. David Chen</p>
                <p className="text-sm text-muted-foreground">Counseling Psychologist</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">4.7 (156 reviews)</span>
            </div>
            <Button size="sm" className="w-full" onClick={() => setShowTherapists(true)}>
              Book Session
            </Button>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setShowTherapists(true)}>
          View All Therapists
        </Button>
      </GlassmorphicCard>

      {/* Upcoming Sessions */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Upcoming Sessions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Session with Dr. Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <Button size="sm" variant="outline">Join</Button>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );

  const renderWellnessSection = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Wellness Assessments</h2>
        <p className="text-muted-foreground">Track your mental health progress with validated assessments</p>
      </div>

      {/* Wellbeing Survey */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Mental Health Assessment</h3>
        <p className="text-muted-foreground mb-6">Complete our comprehensive wellbeing survey to track your progress</p>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Star className="w-5 h-5 text-green-500" />
              <span>PHQ-9 Depression Scale</span>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="w-5 h-5 text-green-500" />
              <span>GAD-7 Anxiety Scale</span>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="w-5 h-5 text-green-500" />
              <span>WHO-5 Wellbeing Index</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-blue-500" />
              <span>10-15 minutes</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>100% Anonymous</span>
            </div>
            <div className="flex items-center space-x-3">
              <ChevronRight className="w-5 h-5 text-blue-500" />
              <span>Track Progress</span>
            </div>
          </div>
        </div>
        <Button className="w-full" onClick={() => setShowWellnessAssessment(true)}>
          Start Assessment
        </Button>
      </GlassmorphicCard>

      {/* Progress Tracking */}
      <GlassmorphicCard className="p-6">
        <h3 className="text-xl font-semibold mb-4">Your Progress</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {latestAssessment?.totalScore?.toFixed(1) || wellnessScore}
            </div>
            <p className="text-muted-foreground">Wellness Score</p>
            <p className="text-sm text-green-500">
              {latestAssessment ? `From assessment` : `↗ +0.3 this week`}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">
              {latestAssessment ? '1' : '23'}
            </div>
            <p className="text-muted-foreground">
              {latestAssessment ? 'Assessment Completed' : 'Sessions Completed'}
            </p>
            <p className="text-sm text-green-500">
              {latestAssessment ? 'Latest assessment' : '+5 this week'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{wellnessStreak}</div>
            <p className="text-muted-foreground">Day Streak</p>
            <p className="text-sm text-green-500">Personal best!</p>
          </div>
        </div>

        {/* Show recommendations if available */}
        {latestAssessment?.recommendations && latestAssessment.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <h4 className="font-semibold mb-2 text-primary">Personalized Recommendations</h4>
            <ul className="space-y-1">
              {latestAssessment.recommendations.slice(0, 3).map((rec: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );

  const renderResourcesSection = () => (
    <div className="space-y-6 md:space-y-8">
      <div className="mb-6 md:mb-8 animate-fade-in-up">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Educational Resources & Insights</h2>
        <p className="text-muted-foreground text-sm md:text-base">Evidence-based articles, research insights, and practical tools for mental wellness</p>
      </div>

      {/* Featured Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <GlassmorphicCard className="p-4 md:p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">5 Common Myths About Mental Health</h3>
              <p className="text-muted-foreground mb-3 text-sm md:text-base">Debunking misconceptions that prevent people from seeking help and understanding the truth about mental wellness</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">5 min read • Dr. Sarah Johnson</span>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-medium">Read More →</Button>
              </div>
            </div>
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-4 md:p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 md:w-8 md:h-8 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Understanding Anxiety vs. Normal Worry</h3>
              <p className="text-muted-foreground mb-3 text-sm md:text-base">Learn to distinguish between healthy concern and anxiety disorders with practical examples and coping strategies</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">7 min read • Prof. Michael Chen</span>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 font-medium">Read More →</Button>
              </div>
            </div>
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-4 md:p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Building Emotional Resilience</h3>
              <p className="text-muted-foreground mb-3 text-sm md:text-base">Practical techniques to bounce back from setbacks and maintain mental strength during challenging times</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">6 min read • Dr. Amanda Torres</span>
                <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80 font-medium">Read More →</Button>
              </div>
            </div>
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-4 md:p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-ring/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 md:w-8 md:h-8 text-ring" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">The Science of Gratitude</h3>
              <p className="text-muted-foreground mb-3 text-sm md:text-base">Research-backed benefits of gratitude practices and how to incorporate them into your daily routine</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">4 min read • Dr. Lisa Park</span>
                <Button variant="ghost" size="sm" className="text-ring hover:text-ring/80 font-medium">Read More →</Button>
              </div>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Resource Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <GlassmorphicCard className="p-3 md:p-4 text-center hover:scale-105 transition-all duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Brain className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h4 className="font-semibold text-xs md:text-sm mb-1">Mental Health 101</h4>
          <p className="text-xs text-muted-foreground">12 articles</p>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-3 md:p-4 text-center hover:scale-105 transition-all duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-accent" />
          </div>
          <h4 className="font-semibold text-xs md:text-sm mb-1">Coping Strategies</h4>
          <p className="text-xs text-muted-foreground">8 articles</p>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-3 md:p-4 text-center hover:scale-105 transition-all duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
          </div>
          <h4 className="font-semibold text-xs md:text-sm mb-1">Relationships</h4>
          <p className="text-xs text-muted-foreground">6 articles</p>
        </GlassmorphicCard>

        <GlassmorphicCard className="p-3 md:p-4 text-center hover:scale-105 transition-all duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-ring/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Star className="w-4 h-4 md:w-5 md:h-5 text-ring" />
          </div>
          <h4 className="font-semibold text-xs md:text-sm mb-1">Wellness Tips</h4>
          <p className="text-xs text-muted-foreground">15 articles</p>
        </GlassmorphicCard>
      </div>

      {/* Newsletter Signup */}
      <GlassmorphicCard className="p-4 md:p-6 animate-fade-in-up">
        <div className="text-center mb-4">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Weekly Wellness Newsletter</h3>
          <p className="text-muted-foreground text-sm md:text-base">Get evidence-based mental health tips, research updates, and community stories delivered to your inbox every Tuesday</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-lg bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
            placeholder="your@email.com"
          />
          <Button className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">
            <AlertCircle className="w-4 h-4 mr-2" />
            Subscribe
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">No spam. Unsubscribe anytime. 📧</p>
      </GlassmorphicCard>

      {/* Quick Reads */}
      <GlassmorphicCard className="p-4 md:p-6 animate-fade-in-up">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">Quick Reads (2-5 minutes)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
            <div className="flex-1">
              <p className="font-medium text-sm md:text-base">The Science of Sleep and Mental Health</p>
              <p className="text-xs md:text-sm text-muted-foreground">How quality sleep affects your emotional wellbeing</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-xs text-muted-foreground">3 min</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
            <div className="flex-1">
              <p className="font-medium text-sm md:text-base">Building Healthy Boundaries</p>
              <p className="text-xs md:text-sm text-muted-foreground">Protect your mental energy and emotional health</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-xs text-muted-foreground">5 min</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
            <div className="flex-1">
              <p className="font-medium text-sm md:text-base">Mindfulness for Beginners</p>
              <p className="text-xs md:text-sm text-muted-foreground">Simple techniques to reduce stress and anxiety</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-xs text-muted-foreground">4 min</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'learn': return renderLearnSection();
      case 'relax': return renderRelaxSection();
      case 'connect': return renderConnectSection();
      case 'support': return renderSupportSection();
      case 'wellness': return renderWellnessSection();
      case 'resources': return renderResourcesSection();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-sm border-r border-border transform transition-all duration-300 ease-in-out shadow-xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">For Your Mind</h1>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">Individual</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden hover:bg-muted rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          <div className="px-6 py-2 border-b border-border/50">
            <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> to close</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full justify-start h-12 transition-all duration-200 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg transform scale-[1.02]'
                        : 'hover:bg-muted hover:scale-[1.01] hover:shadow-md'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                    {activeSection === item.id && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="w-full justify-start hover:bg-muted rounded-lg transition-colors"
              >
                <Brain className="w-4 h-4 mr-3" />
                Profile Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'md:ml-64' : ''
      }`}>
        {/* Top Bar */}
        <div className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-muted rounded-lg transition-colors p-2"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md animate-pulse-gentle">
                  <Brain className="text-white w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">For Your Mind</h1>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">Individual</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              <Button variant="ghost" size="sm" className="relative hover:bg-muted rounded-lg p-2">
                <AlertCircle className="text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-secondary rounded-full animate-pulse"></span>
              </Button>
              <div className="w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowProfile(true)}>
                <span className="text-xs md:text-sm font-semibold text-white">
                  {user?.displayName?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto px-6 py-8">
            {renderActiveSection()}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modals */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
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
      <BreathingExerciseModal
        isOpen={showBreathingExercise}
        onClose={() => setShowBreathingExercise(false)}
        breathingType={breathingType}
      />
      <WellnessAssessmentModal
        isOpen={showWellnessAssessment}
        onClose={() => setShowWellnessAssessment(false)}
        onComplete={(score, recommendations) => {
          // Update wellness score and show recommendations
          queryClient.invalidateQueries({ queryKey: ["/mood"] });
          toast({
            title: "Assessment completed!",
            description: `Your wellness score: ${score}/10`,
          });
        }}
      />

      {/* Chatbot */}
      <ChatbotWidget
        userName={user?.displayName}
        onOpenJournal={() => setShowJournaling(true)}
        onOpenTherapists={() => setShowTherapists(true)}
        onOpenAssessment={() => setShowWellnessAssessment(true)}
        onOpenLearn={() => setActiveSection('learn')}
      />
    </div>
  );
}
