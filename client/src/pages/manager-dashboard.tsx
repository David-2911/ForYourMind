import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { useAuth } from "@/lib/auth";
import ProfileModal from "@/components/common/profile-modal";
import { useQuery } from "@tanstack/react-query";
import { WellnessMetrics } from "@/types";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  // Fetch wellness metrics for organization
  const { data: metrics } = useQuery<WellnessMetrics>({
    queryKey: ["/admin/wellness-metrics/org-123"], // Mock org ID
  });

  const departmentColors = {
    good: "bg-green-100",
    fair: "bg-yellow-100", 
    "needs-attention": "bg-red-100",
  };

  return (
    <div className="min-h-screen">
      <title>Manager Dashboard - For Your Mind</title>
      <meta name="description" content="Team wellness insights and management dashboard for monitoring employee wellbeing metrics and creating action plans." />

      {/* Navigation */}
      <nav className="bg-card border-b border-border p-3 md:p-4 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-white/5 animate-pulse-gentle">
              <Brain className="text-foreground w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-foreground hidden sm:block">For Your Mind</h1>
            <Badge className="bg-accent text-accent-foreground text-xs">Manager</Badge>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm text-muted-foreground hidden md:block">TechCorp Inc.</span>
            <button
              data-testid="button-profile"
              onClick={() => setShowProfile(true)}
              className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
              title="Profile Settings"
            >
              <span className="text-xs md:text-sm font-semibold text-white">
                {user?.displayName?.charAt(0) || "M"}
              </span>
            </button>
            <button
              data-testid="button-logout"
              onClick={logout}
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* Manager Content */}
      <div className="container mx-auto p-4 md:p-6">
        {/* Manager Header */}
        <div className="mb-4 md:mb-6 lg:mb-8 animate-fade-in-up">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-foreground">Team Wellness Dashboard</h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Monitor and support your team's wellbeing</p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
          <GlassmorphicCard className="p-2 sm:p-3 md:p-4 text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-ring mb-1 md:mb-2">
              {metrics?.teamWellness?.toFixed(1) || "7.8"}
            </div>
            <h4 className="font-semibold mb-0 md:mb-1 text-xs md:text-sm">Team Wellness</h4>
            <p className="text-xs text-muted-foreground">↗ +0.5 this month</p>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-2 sm:p-3 md:p-4 text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-secondary mb-1 md:mb-2">
              {metrics ? `${Math.round(metrics.engagement * 100)}%` : "89%"}
            </div>
            <h4 className="font-semibold mb-0 md:mb-1 text-xs md:text-sm">Engagement</h4>
            <p className="text-xs text-muted-foreground">24/27 active users</p>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-2 sm:p-3 md:p-4 text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-accent mb-1 md:mb-2">
              {metrics?.sessionsThisWeek || "156"}
            </div>
            <h4 className="font-semibold mb-0 md:mb-1 text-xs md:text-sm">Sessions</h4>
            <p className="text-xs text-muted-foreground">This week</p>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-2 sm:p-3 md:p-4 text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-1 md:mb-2">
              {metrics?.atRiskCount || "3"}
            </div>
            <h4 className="font-semibold mb-0 md:mb-1 text-xs md:text-sm">At Risk</h4>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </GlassmorphicCard>
        </div>

        {/* Team Wellness Heatmap */}
        <GlassmorphicCard className="p-3 md:p-6 mb-4 md:mb-8 animate-fade-in-up">
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-foreground">Department Wellness Overview</h3>
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300"
            alt="Collaborative team wellness meeting in bright modern office"
            className="rounded-xl mb-3 md:mb-4 w-full h-24 md:h-32 lg:h-48 object-cover animate-float-gentle"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {metrics?.departments?.map((dept, index) => (
              <div
                key={index}
                className={`text-center p-2 md:p-4 rounded-xl animate-fade-in-up hover:scale-105 transition-all duration-300 ${departmentColors[dept.status as keyof typeof departmentColors] || 'bg-gray-100'}`}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <div className="font-semibold text-sm md:text-base">{dept.name}</div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {dept.average} avg
                </div>
              </div>
            )) || (
              <>
                <div className="text-center p-2 md:p-4 rounded-xl bg-green-100">
                  <div className="font-semibold text-sm md:text-base">Engineering</div>
                  <div className="text-xs md:text-sm text-muted-foreground">8.2 avg</div>
                </div>
                <div className="text-center p-2 md:p-4 rounded-xl bg-yellow-100">
                  <div className="font-semibold text-sm md:text-base">Marketing</div>
                  <div className="text-xs md:text-sm text-muted-foreground">7.1 avg</div>
                </div>
                <div className="text-center p-2 md:p-4 rounded-xl bg-green-100">
                  <div className="font-semibold text-sm md:text-base">Sales</div>
                  <div className="text-xs md:text-sm text-muted-foreground">8.0 avg</div>
                </div>
                <div className="text-center p-2 md:p-4 rounded-xl bg-red-100">
                  <div className="font-semibold text-sm md:text-base">Support</div>
                  <div className="text-xs md:text-sm text-muted-foreground">6.3 avg</div>
                </div>
              </>
            )}
          </div>
        </GlassmorphicCard>

        {/* Recent Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <GlassmorphicCard className="p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Anonymous Feedback</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="border-l-4 border-secondary pl-2 md:pl-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  "Work-life balance has improved significantly since using the platform."
                </p>
                <span className="text-xs text-muted-foreground">
                  Engineering • 2 days ago
                </span>
              </div>
              <div className="border-l-4 border-accent pl-2 md:pl-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  "The breathing exercises really help during stressful deadlines."
                </p>
                <span className="text-xs text-muted-foreground">
                  Marketing • 3 days ago
                </span>
              </div>
              <div className="border-l-4 border-red-400 pl-2 md:pl-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  "Feeling overwhelmed with current workload and need support."
                </p>
                <span className="text-xs text-muted-foreground">
                  Support • 1 day ago
                </span>
              </div>
            </div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Action Items</h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between p-2 md:p-3 border border-border rounded-xl">
                <span className="text-xs md:text-sm">Schedule Support team check-in</span>
                <Badge className="bg-red-100 text-red-800 text-xs">High</Badge>
              </div>
              <div className="flex items-center justify-between p-2 md:p-3 border border-border rounded-xl">
                <span className="text-xs md:text-sm">Review wellness survey results</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>
              </div>
              <div className="flex items-center justify-between p-2 md:p-3 border border-border rounded-xl">
                <span className="text-xs md:text-sm">Plan team building activity</span>
                <Badge className="bg-green-100 text-green-800 text-xs">Low</Badge>
              </div>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
}
