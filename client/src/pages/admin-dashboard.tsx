import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { useAuth } from "@/lib/auth";
import ProfileModal from "@/components/common/profile-modal";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("organizations");
  const [showProfile, setShowProfile] = useState(false);

  // Mock data for admin dashboard - in real implementation this would come from API
  const systemMetrics = {
    totalUsers: 1247,
    organizations: 34,
    uptime: 98.7,
    therapists: 156,
    monthlyRevenue: 47000,
  };

  const recentOrganizations = [
    {
      id: "1",
      name: "TechCorp Inc.",
      employees: 127,
      wellnessScore: 8.2,
      status: "Active",
    },
    {
      id: "2", 
      name: "Innovation Labs",
      employees: 89,
      wellnessScore: 7.6,
      status: "Active",
    },
    {
      id: "3",
      name: "Global Solutions",
      employees: 203,
      wellnessScore: 6.9,
      status: "Trial",
    },
  ];

  const platformStats = {
    dailyActiveUsers: 834,
    sessionsToday: 2156,
    avgSessionDuration: 12.4,
    therapistBookings: 47,
    anonymousRants: 23,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Trial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "organizations", label: "Organizations" },
    { id: "users", label: "Users" },
    { id: "analytics", label: "Analytics" },
    { id: "system", label: "System Health" },
  ];

  return (
    <div className="min-h-screen">
      <title>Admin Dashboard - For Your Mind</title>
      <meta name="description" content="Platform administration dashboard for managing organizations, users, and system health across the For Your Mind wellness platform." />

      {/* Navigation */}
      <nav className="bg-card border-b border-border p-3 md:p-4 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-white/5 animate-pulse-gentle">
              <Brain className="text-foreground w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-foreground hidden sm:block">For Your Mind</h1>
            <Badge className="bg-accent text-accent-foreground text-xs">Admin</Badge>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm text-muted-foreground hidden md:block">System Administrator</span>
            <Button
              data-testid="button-profile"
              variant="ghost"
              size="sm"
              onClick={() => setShowProfile(true)}
              className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer p-0"
              title="Profile Settings"
            >
              <span className="text-xs md:text-sm font-semibold text-white">
                {user?.displayName?.charAt(0) || "A"}
              </span>
            </Button>
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-all duration-300"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* Admin Content */}
      <div className="container mx-auto p-4 md:p-6">
        {/* Admin Header */}
        <div className="mb-6 md:mb-8 animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Platform Administration</h2>
          <p className="text-muted-foreground text-sm md:text-base">Manage organizations, users, and system health</p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          <GlassmorphicCard className="text-center animate-fade-in-up hover:scale-105 transition-all duration-300">
            <div className="text-xl md:text-2xl font-bold text-ring mb-2">
              {systemMetrics.totalUsers.toLocaleString()}
            </div>
            <h4 className="font-semibold text-sm">Total Users</h4>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-2xl font-bold text-secondary mb-2">
              {systemMetrics.organizations}
            </div>
            <h4 className="font-semibold text-sm">Organizations</h4>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-2xl font-bold text-accent mb-2">
              {systemMetrics.uptime}%
            </div>
            <h4 className="font-semibold text-sm">Uptime</h4>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {systemMetrics.therapists}
            </div>
            <h4 className="font-semibold text-sm">Therapists</h4>
          </GlassmorphicCard>

          <GlassmorphicCard className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              ${(systemMetrics.monthlyRevenue / 1000).toFixed(0)}k
            </div>
            <h4 className="font-semibold text-sm">Monthly Revenue</h4>
          </GlassmorphicCard>
        </div>

        {/* Admin Tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-border">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                variant="ghost"
                className={`nav-tab px-4 py-2 font-medium ${
                  activeTab === tab.id ? "active" : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "organizations" && (
          <div className="grid md:grid-cols-2 gap-6">
            <GlassmorphicCard>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Recent Organizations</h3>
                <Button
                  data-testid="button-add-organization"
                  className="btn-primary text-white text-sm"
                >
                  Add New
                </Button>
              </div>
              <img
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
                alt="Successful corporate wellness program presentation in modern boardroom"
                className="rounded-xl mb-4 w-full h-32 object-cover"
              />
              <div className="space-y-3">
                {recentOrganizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex justify-between items-center p-3 border border-border rounded-xl"
                  >
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {org.employees} employees • {org.wellnessScore} wellness score
                      </div>
                    </div>
                    <Badge className={getStatusColor(org.status)}>
                      {org.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </GlassmorphicCard>

            <GlassmorphicCard>
              <h3 className="text-xl font-semibold mb-4">Platform Statistics</h3>
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
                alt="Peaceful mindfulness session in serene natural environment"
                className="rounded-xl mb-4 w-full h-32 object-cover"
              />
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Active Users</span>
                  <span className="font-semibold">{platformStats.dailyActiveUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions Today</span>
                  <span className="font-semibold">{platformStats.sessionsToday.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Session Duration</span>
                  <span className="font-semibold">{platformStats.avgSessionDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Therapist Bookings</span>
                  <span className="font-semibold">{platformStats.therapistBookings} today</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anonymous Rants</span>
                  <span className="font-semibold">{platformStats.anonymousRants} pending</span>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        )}

        {activeTab === "users" && (
          <GlassmorphicCard>
            <h3 className="text-xl font-semibold mb-4">User Management</h3>
            <p className="text-muted-foreground">User management interface would be implemented here.</p>
          </GlassmorphicCard>
        )}

        {activeTab === "analytics" && (
          <GlassmorphicCard>
            <h3 className="text-xl font-semibold mb-4">Platform Analytics</h3>
            <p className="text-muted-foreground">Advanced analytics dashboard would be implemented here.</p>
          </GlassmorphicCard>
        )}

        {activeTab === "system" && (
          <GlassmorphicCard>
            <h3 className="text-xl font-semibold mb-4">System Health</h3>
            <p className="text-muted-foreground">System health monitoring interface would be implemented here.</p>
          </GlassmorphicCard>
        )}
      </div>
    </div>
  );
}
