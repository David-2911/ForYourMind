import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { WellnessMetrics } from "@/types";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();

  // Fetch wellness metrics for organization
  const { data: metrics } = useQuery<WellnessMetrics>({
    queryKey: ["/api/admin/wellness-metrics/org-123"], // Mock org ID
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
      <nav className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Brain className="text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold">For Your Mind</h1>
            <Badge className="bg-accent text-accent-foreground">Manager</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">TechCorp Inc.</span>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user?.displayName?.charAt(0) || "M"}
              </span>
            </div>
            <button
              data-testid="button-logout"
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Manager Content */}
      <div className="container mx-auto p-6">
        {/* Manager Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Team Wellness Dashboard</h2>
          <p className="text-muted-foreground">Monitor and support your team's wellbeing</p>
        </div>

        {/* Metrics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassmorphicCard className="text-center">
            <div className="text-3xl font-bold text-ring mb-2">
              {metrics?.teamWellness?.toFixed(1) || "7.8"}
            </div>
            <h4 className="font-semibold mb-1">Team Wellness</h4>
            <p className="text-sm text-muted-foreground">↗ +0.5 this month</p>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-3xl font-bold text-secondary mb-2">
              {metrics ? `${Math.round(metrics.engagement * 100)}%` : "89%"}
            </div>
            <h4 className="font-semibold mb-1">Engagement</h4>
            <p className="text-sm text-muted-foreground">24/27 active users</p>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">
              {metrics?.sessionsThisWeek || "156"}
            </div>
            <h4 className="font-semibold mb-1">Sessions</h4>
            <p className="text-sm text-muted-foreground">This week</p>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {metrics?.atRiskCount || "3"}
            </div>
            <h4 className="font-semibold mb-1">At Risk</h4>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </GlassmorphicCard>
        </div>

        {/* Team Wellness Heatmap */}
        <GlassmorphicCard className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Department Wellness Overview</h3>
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300"
            alt="Collaborative team wellness meeting in bright modern office"
            className="rounded-xl mb-4 w-full h-48 object-cover"
          />
          <div className="grid grid-cols-4 gap-4">
            {metrics?.departments?.map((dept, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-xl ${departmentColors[dept.status as keyof typeof departmentColors] || 'bg-gray-100'}`}
              >
                <div className="font-semibold">{dept.name}</div>
                <div className="text-sm text-muted-foreground">
                  {dept.average} avg
                </div>
              </div>
            )) || (
              <>
                <div className="text-center p-4 rounded-xl bg-green-100">
                  <div className="font-semibold">Engineering</div>
                  <div className="text-sm text-muted-foreground">8.2 avg</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-yellow-100">
                  <div className="font-semibold">Marketing</div>
                  <div className="text-sm text-muted-foreground">7.1 avg</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-100">
                  <div className="font-semibold">Sales</div>
                  <div className="text-sm text-muted-foreground">8.0 avg</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-100">
                  <div className="font-semibold">Support</div>
                  <div className="text-sm text-muted-foreground">6.3 avg</div>
                </div>
              </>
            )}
          </div>
        </GlassmorphicCard>

        {/* Recent Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <GlassmorphicCard>
            <h3 className="text-xl font-semibold mb-4">Anonymous Feedback</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-secondary pl-4">
                <p className="text-sm text-muted-foreground">
                  "Work-life balance has improved significantly since using the platform."
                </p>
                <span className="text-xs text-muted-foreground">
                  Engineering • 2 days ago
                </span>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <p className="text-sm text-muted-foreground">
                  "The breathing exercises really help during stressful deadlines."
                </p>
                <span className="text-xs text-muted-foreground">
                  Marketing • 3 days ago
                </span>
              </div>
              <div className="border-l-4 border-red-400 pl-4">
                <p className="text-sm text-muted-foreground">
                  "Feeling overwhelmed with current workload and need support."
                </p>
                <span className="text-xs text-muted-foreground">
                  Support • 1 day ago
                </span>
              </div>
            </div>
          </GlassmorphicCard>

          <GlassmorphicCard>
            <h3 className="text-xl font-semibold mb-4">Action Items</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                <span className="text-sm">Schedule Support team check-in</span>
                <Badge className="bg-red-100 text-red-800">High</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                <span className="text-sm">Review wellness survey results</span>
                <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                <span className="text-sm">Plan team building activity</span>
                <Badge className="bg-green-100 text-green-800">Low</Badge>
              </div>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
}
