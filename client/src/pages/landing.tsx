import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Book, Users, GraduationCap, UserCheck, ChartLine, Vote, Lightbulb, Shield, Calendar, Video, Star } from "lucide-react";
import FloatingParticles from "@/components/common/floating-particles";
import BreathingCircle from "@/components/common/breathing-circle";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import RoleSelectionModal from "@/components/auth/role-selection-modal";
import LoginModal from "@/components/auth/login-modal";
import SignupModal from "@/components/auth/signup-modal";

export default function LandingPage() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"individual" | "manager" | "admin" | null>(null);

  const handleRoleSelect = (role: "individual" | "manager" | "admin") => {
    setSelectedRole(role);
    setShowRoleModal(false);
    setShowLoginModal(true);
  };

  const handleSignIn = () => {
    setShowRoleModal(true);
  };

  const handleGetStarted = () => {
    setShowRoleModal(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>For Your Mind - Digital Wellbeing Platform</title>
      <meta name="description" content="A comprehensive digital wellbeing platform that supports both individuals and organizations in their mental health journey through personalized tools, professional support, and community connection." />

      <FloatingParticles />

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Brain className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">For Your Mind</h1>
          </div>
          <div className="flex space-x-4">
            <Button
              data-testid="button-sign-in"
              variant="ghost"
              onClick={handleSignIn}
              className="text-foreground hover:text-ring"
            >
              Sign In
            </Button>
            <Button
              data-testid="button-get-started"
              onClick={handleGetStarted}
              className="btn-primary text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              <span className="gradient-bg bg-clip-text text-transparent">Transform</span><br />
              Your Digital<br />
              Wellbeing
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A comprehensive platform that supports both individuals and organizations in their mental health journey through personalized tools, professional support, and community connection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                data-testid="button-start-journey"
                onClick={handleGetStarted}
                className="btn-primary text-white text-lg px-8 py-4"
              >
                Start Your Journey
              </Button>
              <Button
                data-testid="button-watch-demo"
                variant="outline"
                className="text-lg px-8 py-4"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <BreathingCircle />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold mb-4">Comprehensive Wellbeing Support</h3>
          <p className="text-xl text-muted-foreground">Everything you need for mental health in one integrated platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Individual Features */}
          <GlassmorphicCard hover>
            <img
              src="https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
              alt="Peaceful meditation garden with soft morning light"
              className="rounded-xl mb-6 w-full h-48 object-cover"
            />
            <h4 className="text-2xl font-semibold mb-4 text-ring">Personal Wellness</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center">
                <Heart className="text-secondary mr-3 w-5 h-5" />
                Daily mood tracking
              </li>
              <li className="flex items-center">
                <Book className="text-secondary mr-3 w-5 h-5" />
                Private journaling
              </li>
              <li className="flex items-center">
                <Users className="text-secondary mr-3 w-5 h-5" />
                Peer support matching
              </li>
              <li className="flex items-center">
                <GraduationCap className="text-secondary mr-3 w-5 h-5" />
                Learning modules
              </li>
            </ul>
          </GlassmorphicCard>

          {/* Manager Features */}
          <GlassmorphicCard hover>
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
              alt="Professional team wellness meeting in modern office"
              className="rounded-xl mb-6 w-full h-48 object-cover"
            />
            <h4 className="text-2xl font-semibold mb-4 text-ring">Team Analytics</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center">
                <ChartLine className="text-accent mr-3 w-5 h-5" />
                Wellness metrics
              </li>
              <li className="flex items-center">
                <Vote className="text-accent mr-3 w-5 h-5" />
                Anonymous surveys
              </li>
              <li className="flex items-center">
                <Lightbulb className="text-accent mr-3 w-5 h-5" />
                Action plan insights
              </li>
              <li className="flex items-center">
                <Shield className="text-accent mr-3 w-5 h-5" />
                Privacy protection
              </li>
            </ul>
          </GlassmorphicCard>

          {/* Professional Support */}
          <GlassmorphicCard hover>
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
              alt="Warm and welcoming therapy session environment"
              className="rounded-xl mb-6 w-full h-48 object-cover"
            />
            <h4 className="text-2xl font-semibold mb-4 text-ring">Professional Care</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center">
                <UserCheck className="text-primary mr-3 w-5 h-5" />
                Therapist directory
              </li>
              <li className="flex items-center">
                <Calendar className="text-primary mr-3 w-5 h-5" />
                Easy scheduling
              </li>
              <li className="flex items-center">
                <Video className="text-primary mr-3 w-5 h-5" />
                Video sessions
              </li>
              <li className="flex items-center">
                <Star className="text-primary mr-3 w-5 h-5" />
                Verified professionals
              </li>
            </ul>
          </GlassmorphicCard>
        </div>
      </div>

      {/* Modals */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onRoleSelect={handleRoleSelect}
      />

      {selectedRole && (
        <>
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            role={selectedRole}
            onSwitchToSignup={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
          />
          
          <SignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            role={selectedRole}
            onSwitchToLogin={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
          />
        </>
      )}
    </div>
  );
}
