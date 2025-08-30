import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Book, Users, GraduationCap, UserCheck, ChartLine, Vote, Lightbulb, Shield, Calendar, Video, Star } from "lucide-react";
import FloatingParticles from "@/components/common/floating-particles";
import BreathingCircle from "@/components/common/breathing-circle";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import RoleSelectionModal from "@/components/auth/role-selection-modal";
import LoginModal from "@/components/auth/login-modal";
import SignupModal from "@/components/auth/signup-modal";
import WatchDemoModal from "@/components/common/watch-demo-modal";

export default function LandingPage() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"individual" | "manager" | null>(null);

  const handleRoleSelect = (role: "individual" | "manager") => {
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
    <div className="relative overflow-hidden min-h-screen">
      {/* Animated gradient background (not a single color) */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-80" />
        <div className="absolute inset-0 bg-noise opacity-10" />
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float-gentle"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-secondary/10 rounded-full animate-float-gentle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-accent/10 rounded-full animate-float-gentle" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-primary/5 rounded-full animate-float-gentle" style={{ animationDelay: '1s' }}></div>
      </div>
  <style>{`
        :root {
          --bg-soft-1: #eef6f5; /* very pale teal */
          --bg-soft-2: #f6eef9; /* very pale pink */
          --bg-soft-3: #f7f9fb; /* near-white */
          --accent: #7ea6b8; /* muted teal */
          --muted-foreground: #6b7280;
          --card-bg: rgba(255,255,255,0.06);
          --btn-primary-bg: #9fbfc6; /* soft button */
          --btn-primary-hover: #8fb1b7;
        }

        /* Gentle animated background: slow, low-saturation, blurred bands */
        .animated-gradient {
          background: linear-gradient(180deg, var(--bg-soft-1) 0%, var(--bg-soft-3) 45%, var(--bg-soft-2) 100%);
          background-size: 100% 200%;
          animation: GradientBG 28s ease-in-out infinite;
          filter: blur(60px) saturate(0.95);
          opacity: 0.9;
        }

        @keyframes GradientBG {
          0% { background-position: 50% 0%; }
          50% { background-position: 50% 100%; }
          100% { background-position: 50% 0%; }
        }

        /* subtle grain / texture */
        .bg-noise { background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 4px 4px; }

        /* Headline accent: soft clipped gradient for text, desaturated */
        .hero-accent {
          background: linear-gradient(90deg, rgba(126,166,184,1) 0%, rgba(153,176,186,1) 50%, rgba(201,167,185,1) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Primary CTA gentle styling */
        .btn-primary {
          background: var(--btn-primary-bg) !important;
          color: #063238 !important;
          box-shadow: 0 6px 18px rgba(30,80,85,0.06);
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          background: var(--btn-primary-hover) !important;
          box-shadow: 0 10px 30px rgba(30,80,85,0.08);
        }

        /* Glass cards use a softer background */
        .glass-card {
          background: var(--card-bg);
          border: 1px solid rgba(255,255,255,0.04);
        }

  /* Full viewport section backgrounds with subtle color-changing effects */
  .vh-bg-1 { 
    background: linear-gradient(135deg, #f6fbfb 0%, #eef6f5 50%, #f0f8f7 100%);
    background-size: 200% 200%;
    animation: vh-bg-1-shift 25s ease-in-out infinite;
  }
  .vh-bg-2 { 
    background: linear-gradient(135deg, #fbf6fb 0%, #f6eef9 50%, #f8f0fa 100%);
    background-size: 200% 200%;
    animation: vh-bg-2-shift 30s ease-in-out infinite;
  }
  .vh-bg-3 { 
    background: linear-gradient(135deg, #fbfbf6 0%, #f9f9f0 50%, #fafaf4 100%);
    background-size: 200% 200%;
    animation: vh-bg-3-shift 35s ease-in-out infinite;
  }
  .vh-bg-4 { 
    background: linear-gradient(135deg, #f6f8fb 0%, #eef4f9 50%, #f0f6fa 100%);
    background-size: 200% 200%;
    animation: vh-bg-4-shift 28s ease-in-out infinite;
  }
  .vh-bg-5 { 
    background: linear-gradient(135deg, #f7f7fb 0%, #f1f1f9 50%, #f4f4fa 100%);
    background-size: 200% 200%;
    animation: vh-bg-5-shift 32s ease-in-out infinite;
  }
  .vh-bg-6 { 
    background: linear-gradient(135deg, #f9fbf8 0%, #f3f9f2 50%, #f6faf4 100%);
    background-size: 200% 200%;
    animation: vh-bg-6-shift 27s ease-in-out infinite;
  }

  @keyframes vh-bg-1-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes vh-bg-2-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes vh-bg-3-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes vh-bg-4-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes vh-bg-5-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes vh-bg-6-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .logo-placeholder { color: rgba(31,41,55,0.6); font-weight:600; }
  .avatar-initial { width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; background:rgba(0,0,0,0.06); color:rgba(0,0,0,0.7); font-weight:600 }
      `}</style>
      <title>For Your Mind - Digital Wellbeing Platform</title>
      <meta name="description" content="A comprehensive digital wellbeing platform that supports both individuals and organizations in their mental health journey through personalized tools, professional support, and community connection." />

  <FloatingParticles />

      {/* Navigation */}
      <nav className="relative z-10 p-4 md:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3 animate-fade-in-up">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-white/5 animate-pulse-gentle">
              <Brain className="text-foreground w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">For Your Mind</h1>
          </div>
          <div className="flex space-x-2 md:space-x-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              data-testid="button-sign-in" 
              variant="ghost" 
              onClick={handleSignIn} 
              className="text-foreground hover:text-ring font-semibold hover:scale-105 transition-all duration-300 text-sm md:text-base"
            >
              Sign In
            </Button>
            <Button 
              data-testid="button-get-started" 
              onClick={handleGetStarted} 
              className="btn-primary text-white font-semibold hover:scale-105 transition-all duration-300 text-sm md:text-base"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen vh-bg-1 relative z-10 flex items-center">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 md:space-y-8 animate-fade-in text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              <span className="hero-accent">Mental Wellness for Individuals in Nigeria</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Private journaling, mood tracking, peer support, and access to licensed therapists — built for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Button
                data-testid="button-start-free-trial"
                onClick={handleGetStarted}
                className="btn-primary text-base md:text-lg px-6 md:px-8 py-3 md:py-4 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Start Free Trial
                <span className="ml-2 md:ml-3 animate-arrow">→</span>
              </Button>

              <Button
                data-testid="button-individual"
                variant="ghost"
                className="text-base md:text-lg px-4 md:px-6 py-3 md:py-4 border rounded-md hover:bg-foreground/5 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                onClick={() => { setSelectedRole('individual'); setShowLoginModal(true); }}
              >
                I'm an Individual
              </Button>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 md:gap-4 mt-4 md:mt-6 text-xs md:text-sm text-muted-foreground">
              <div className="inline-flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2 glass-card rounded-full">
                <Shield className="w-3 h-3 md:w-4 md:h-4" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="inline-flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2 glass-card rounded-full">
                <ChartLine className="w-3 h-3 md:w-4 md:h-4" />
                <span>Anonymous Analytics</span>
              </div>
              <div className="inline-flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2 glass-card rounded-full">
                <Star className="w-3 h-3 md:w-4 md:h-4" />
                <span>#1 in Nigeria</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center relative mt-8 lg:mt-0">
            <div className="w-full max-w-sm md:max-w-md">
              {/* breathing circle moved inside flow to avoid overlap */}
              <div className="opacity-70">
                <BreathingCircle />
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="min-h-screen vh-bg-2 relative z-10 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Comprehensive Wellbeing Support</h3>
            <p className="text-base md:text-xl text-muted-foreground">Everything you need for mental health in one integrated platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Individual Features */}
            <GlassmorphicCard hover className="p-6 md:p-8">
              <img
                src="https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
                alt="Peaceful meditation garden with soft morning light"
                className="rounded-xl mb-4 md:mb-6 w-full h-32 md:h-48 object-cover"
              />
              <h4 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-ring">Personal Wellness</h4>
              <ul className="space-y-2 md:space-y-3 text-muted-foreground text-sm md:text-base">
                <li className="flex items-center">
                  <Heart className="text-secondary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Daily mood tracking
                </li>
                <li className="flex items-center">
                  <Book className="text-secondary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Private journaling
                </li>
                <li className="flex items-center">
                  <Users className="text-secondary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Peer support matching
                </li>
                <li className="flex items-center">
                  <GraduationCap className="text-secondary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Learning modules
                </li>
              </ul>
            </GlassmorphicCard>

            {/* Manager Features */}
            <GlassmorphicCard hover className="p-6 md:p-8">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
                alt="Professional team wellness meeting in modern office"
                className="rounded-xl mb-4 md:mb-6 w-full h-32 md:h-48 object-cover"
              />
              <h4 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-ring">Team Analytics</h4>
              <ul className="space-y-2 md:space-y-3 text-muted-foreground text-sm md:text-base">
                <li className="flex items-center">
                  <ChartLine className="text-accent mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Wellness metrics
                </li>
                <li className="flex items-center">
                  <Vote className="text-accent mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Anonymous surveys
                </li>
                <li className="flex items-center">
                  <Lightbulb className="text-accent mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Action plan insights
                </li>
                <li className="flex items-center">
                  <Shield className="text-accent mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Privacy protection
                </li>
              </ul>
            </GlassmorphicCard>

            {/* Professional Support */}
            <GlassmorphicCard hover className="p-6 md:p-8">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200"
                alt="Warm and welcoming therapy session environment"
                className="rounded-xl mb-4 md:mb-6 w-full h-32 md:h-48 object-cover"
              />
              <h4 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-ring">Professional Care</h4>
              <ul className="space-y-2 md:space-y-3 text-muted-foreground text-sm md:text-base">
                <li className="flex items-center">
                  <UserCheck className="text-primary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Therapist directory
                </li>
                <li className="flex items-center">
                  <Calendar className="text-primary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Easy scheduling
                </li>
                <li className="flex items-center">
                  <Video className="text-primary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Video sessions
                </li>
                <li className="flex items-center">
                  <Star className="text-primary mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Verified professionals
                </li>
              </ul>
            </GlassmorphicCard>
          </div>
        </div>
        </div>
      </section>
  {/* Problem / Solution Section */}
  <section className="min-h-screen vh-bg-3 relative z-10 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 leading-tight">70% of employees struggle with mental health in silence</h3>
            <ul className="space-y-3 md:space-y-4 text-base md:text-lg text-muted-foreground">
              <li>Managers can't see team wellbeing until it's too late</li>
              <li>Employees fear judgment when seeking help</li>
              <li>Traditional therapy is expensive and inaccessible</li>
              <li>No safe space to express workplace frustrations</li>
            </ul>
          </div>

          <div className="space-y-6 md:space-y-8">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 leading-tight">One platform. Total wellness. Complete privacy.</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <GlassmorphicCard className="p-4 md:p-6">
                <Brain className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <h4 className="font-semibold mt-2 text-sm md:text-base">Clinical Support</h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Licensed therapists, validated assessments (PHQ-9, GAD-7), and instant booking.</p>
              </GlassmorphicCard>

              <GlassmorphicCard className="p-4 md:p-6">
                <ChartLine className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <h4 className="font-semibold mt-2 text-sm md:text-base">Anonymous Insights</h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Managers see trends without accessing personal data. 100% privacy guaranteed.</p>
              </GlassmorphicCard>

              <GlassmorphicCard className="p-4 md:p-6">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <h4 className="font-semibold mt-2 text-sm md:text-base">Peer Support</h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">AI-matched buddies, anonymous rant space, and moderated community forums.</p>
              </GlassmorphicCard>

              <GlassmorphicCard className="p-4 md:p-6">
                <Book className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <h4 className="font-semibold mt-2 text-sm md:text-base">Micro-Learning</h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">2-minute daily practices, emotional intelligence courses, and personalized growth paths.</p>
              </GlassmorphicCard>
            </div>
          </div>
        </div>
        </div>
  </section>

      {/* Social Proof */}
      <section className="min-h-screen vh-bg-4 relative z-10 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Trusted by 50+ Organizations and 10,000+ Individuals</h3>
            <p className="text-base md:text-lg text-muted-foreground">Join thousands who have transformed their mental wellness journey</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-12 md:mb-16">
            <div className="logo-placeholder px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">TechCorp</div>
            <div className="logo-placeholder px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">HealthCo</div>
            <div className="logo-placeholder px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">WellNest</div>
            <div className="logo-placeholder px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">CareTeam</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <GlassmorphicCard className="p-6 md:p-8">
              <p className="italic text-base md:text-lg leading-relaxed">"Our team's wellness score improved by 40% in just 2 months. The anonymous insights helped us address burnout before it happened."</p>
              <div className="mt-4 md:mt-6 flex items-center">
                <div className="avatar-initial mr-3 md:mr-4 text-sm md:text-base">SC</div>
                <div>
                  <div className="font-semibold text-base md:text-lg">Sarah Chen</div>
                  <div className="text-xs md:text-sm text-muted-foreground">HR Director, TechCorp</div>
                </div>
              </div>
            </GlassmorphicCard>

            <GlassmorphicCard className="p-6 md:p-8">
              <p className="italic text-base md:text-lg leading-relaxed">"Finally, a safe space to journal and connect with others who understand. The buddy matching changed my life."</p>
              <div className="mt-4 md:mt-6 flex items-center">
                <div className="avatar-initial mr-3 md:mr-4 text-sm md:text-base">AU</div>
                <div>
                  <div className="font-semibold text-base md:text-lg">Anonymous User</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Individual Member</div>
                </div>
              </div>
            </GlassmorphicCard>

            <GlassmorphicCard className="p-6 md:p-8">
              <p className="italic text-base md:text-lg leading-relaxed">"The ROI is clear: 60% reduction in sick days, 3x increase in employee satisfaction scores."</p>
              <div className="mt-4 md:mt-6 flex items-center">
                <div className="avatar-initial mr-3 md:mr-4 text-sm md:text-base">DO</div>
                <div>
                  <div className="font-semibold text-base md:text-lg">David Okonkwo</div>
                  <div className="text-xs md:text-sm text-muted-foreground">CEO, FinTech</div>
                </div>
              </div>
            </GlassmorphicCard>
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-primary">95%</div>
              <div className="text-xs md:text-sm text-muted-foreground">User Satisfaction</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-primary">2M+</div>
              <div className="text-xs md:text-sm text-muted-foreground">Wellness Sessions</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-primary">24/7</div>
              <div className="text-xs md:text-sm text-muted-foreground">Support Available</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-primary">100%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Anonymous Option</div>
            </div>
          </div>
        </div>
        </div>
      </section>

  {/* Demo / Showcase */}
  <section className="py-20 md:py-32 vh-bg-5 relative z-10">
        <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Experience Serene Wellness</h3>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">Join thousands of individuals and organizations already transforming their mental health journey</p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button onClick={() => setShowDemo(true)} className="btn-primary text-base md:text-lg px-6 md:px-8 py-3 md:py-4 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              Watch Demo
            </Button>
            <Button variant="outline" onClick={handleGetStarted} className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              Start Free Trial
            </Button>
          </div>
        </div>
        </div>
  </section>

  {/* Pricing / CTA */}
  <section className="min-h-screen vh-bg-6 relative z-10 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Start Your Wellness Journey Today</h3>
            <p className="text-base md:text-lg text-muted-foreground">Choose the plan that fits your needs and begin your transformation</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            <GlassmorphicCard className="p-6 md:p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-semibold mb-2">Individual</div>
                <div className="text-3xl md:text-4xl font-bold my-3 md:my-4 text-primary">Free</div>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">Perfect for personal mental wellness</p>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Personal journal & mood tracking</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Anonymous rant space</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Basic buddy matching</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 1 therapist session/month</li>
                </ul>
                <Button className="w-full text-sm md:text-base py-2 md:py-3" onClick={() => { setSelectedRole('individual'); setShowLoginModal(true); }}>Get Started Free</Button>
              </div>
            </GlassmorphicCard>

            <GlassmorphicCard className="p-6 md:p-8 border-2 border-primary hover:scale-105 transition-transform duration-300 relative">
              <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold">Most Popular</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-semibold mb-2">Organization</div>
                <div className="flex items-center justify-center my-3 md:my-4">
                  <div className="text-3xl md:text-4xl font-bold text-primary">₦5,000</div>
                  <span className="text-muted-foreground ml-2 text-sm md:text-base">/month</span>
                </div>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">Complete team wellness solution</p>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Manager dashboard & analytics</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited surveys</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Priority support</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Custom workshops</li>
                </ul>
                <Button className="w-full btn-primary text-sm md:text-base py-2 md:py-3" onClick={handleGetStarted}>Start 30-Day Trial</Button>
              </div>
            </GlassmorphicCard>

            <GlassmorphicCard className="p-6 md:p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-semibold mb-2">Enterprise</div>
                <div className="text-3xl md:text-4xl font-bold my-3 md:my-4">Custom</div>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">Tailored for large organizations</p>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> SSO & advanced security</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> API access</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Dedicated success manager</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Custom integrations</li>
                </ul>
                <Button variant="outline" className="w-full text-sm md:text-base py-2 md:py-3">Contact Sales</Button>
              </div>
            </GlassmorphicCard>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 glass-card rounded-full text-sm">
              <span>Ideas Festival Special: 50% off for first 100 organizations — offer ends in:</span>
              <span className="font-semibold text-primary">48:23:15</span>
            </div>
          </div>
        </div>
        </div>
  </section>

  {/* About / Team */}
  <section className="relative z-10 container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-6 md:mb-8">
          <h3 className="text-2xl md:text-3xl font-bold">Built by Wellness Advocates Who Understand</h3>
          <p className="text-sm md:text-base text-muted-foreground">We believe mental wellness is a human right.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <GlassmorphicCard>
            <div className="w-full h-40 bg-white/3 rounded-md mb-4 flex items-center justify-center">
              <div className="text-lg font-semibold">Dr. Amara Johnson</div>
            </div>
            <div className="font-semibold">Dr. Amara Johnson</div>
            <div className="text-sm text-muted-foreground">Founder & Clinical Psychologist</div>
          </GlassmorphicCard>

          <GlassmorphicCard>
            <div className="w-full h-40 bg-white/3 rounded-md mb-4 flex items-center justify-center">
              <div className="text-lg font-semibold">Kemi Adeleke</div>
            </div>
            <div className="font-semibold">Kemi Adeleke</div>
            <div className="text-sm text-muted-foreground">CTO & Privacy Advocate</div>
          </GlassmorphicCard>

          <GlassmorphicCard>
            <div className="w-full h-40 bg-white/3 rounded-md mb-4 flex items-center justify-center">
              <div className="text-lg font-semibold">Prof. David Okafor</div>
            </div>
            <div className="font-semibold">Prof. David Okafor</div>
            <div className="text-sm text-muted-foreground">Medical Advisor</div>
          </GlassmorphicCard>
        </div>
      </section>

  {/* FAQ */}
  <section className="relative z-10 container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-6 md:mb-8">
          <h3 className="text-2xl md:text-3xl font-bold">Questions? We've Got Answers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <GlassmorphicCard>
            <h4 className="font-semibold">Is my data really anonymous?</h4>
            <p className="text-sm text-muted-foreground">Yes! We use military-grade encryption and anonymous tokens. Managers only see aggregated data, never individual responses.</p>
          </GlassmorphicCard>
          <GlassmorphicCard>
            <h4 className="font-semibold">How quickly can we implement this?</h4>
            <p className="text-sm text-muted-foreground">Setup takes less than 24 hours. Most teams see engagement within the first week.</p>
          </GlassmorphicCard>
          <GlassmorphicCard>
            <h4 className="font-semibold">Do you work with our existing HR tools?</h4>
            <p className="text-sm text-muted-foreground">Yes, we integrate with Slack, Microsoft Teams, BambooHR, and most major HRIS systems.</p>
          </GlassmorphicCard>
          <GlassmorphicCard>
            <h4 className="font-semibold">Can we customize the platform?</h4>
            <p className="text-sm text-muted-foreground">Yes! Add your branding, custom surveys, and specific wellness programs for your industry.</p>
          </GlassmorphicCard>
        </div>
      </section>

  {/* Footer */}
  <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-white/5">
                <Brain className="text-foreground w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h3 className="text-lg md:text-xl font-bold">For Your Mind</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              Clinical-grade mental health support, peer connections, and data-driven insights — all in one serene platform.
            </p>
            <div className="flex space-x-3 md:space-x-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <span className="text-xs md:text-sm">📧</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <span className="text-xs md:text-sm">🐦</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <span className="text-xs md:text-sm">💼</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-4">
              <h5 className="font-semibold text-foreground">Product</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-foreground">Company</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press Kit</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-foreground">Support</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
          <div className="max-w-md mx-auto text-center space-y-3 md:space-y-4">
            <h4 className="text-base md:text-lg font-semibold">Get Weekly Wellness Tips</h4>
            <p className="text-xs md:text-sm text-muted-foreground">No spam. Unsubscribe anytime.</p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input 
                className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base" 
                placeholder="your@email.com" 
              />
              <Button className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="text-muted-foreground text-sm md:text-base">
              © 2025 Serene Wellness. Made with care in Lagos
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="px-2 md:px-3 py-1 bg-white/5 rounded-full text-xs md:text-sm">HIPAA Compliant</div>
              <div className="px-2 md:px-3 py-1 bg-white/5 rounded-full text-xs md:text-sm">ISO 27001</div>
              <div className="px-2 md:px-3 py-1 bg-white/5 rounded-full text-xs md:text-sm">SOC 2 Type II</div>
              <div className="px-2 md:px-3 py-1 bg-white/5 rounded-full text-xs md:text-sm">GDPR Ready</div>
            </div>
          </div>
        </div>
        </div>
  </footer>

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
      <WatchDemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
}
