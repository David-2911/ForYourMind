import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User, MessageCircle, Calendar, Shield, Settings, Bell, Lock, Brain } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
  });
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    apiRequest("GET", "/api/user/profile").then((res: any) => {
      setProfile(res);
      setFormData({
        displayName: res?.displayName || "",
        email: res?.email || "",
      });
    }).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, [isOpen]);

  const handleSave = async () => {
    try {
      await apiRequest("PUT", "/api/user/profile", formData);
      setProfile({ ...profile, ...formData });
      setEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: profile?.displayName || "",
      email: profile?.email || "",
    });
    setEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-2xl max-h-[90vh] animate-slide-up border-none bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className="text-center pb-6 flex-shrink-0">
          <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">Profile Settings</DialogTitle>
          <p className="text-muted-foreground text-sm md:text-base mt-2">Manage your account and preferences</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <GlassmorphicCard className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl md:text-2xl font-bold text-white">
                      {profile.displayName?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">{profile.displayName}</h3>
                    <p className="text-muted-foreground flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {profile.email}
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        <Shield className="w-3 h-3 mr-1" />
                        {profile.role || "Individual"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(!editing)}
                    className="hover:scale-105 transition-all duration-300"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {editing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </GlassmorphicCard>

              {/* Edit Form */}
              {editing && (
                <GlassmorphicCard className="p-6 animate-fade-in-up">
                  <h4 className="text-lg font-semibold mb-4 text-foreground">Edit Profile</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-foreground font-medium">Full Name</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="mt-2 bg-background/60 border-border/60 focus:border-primary"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-2 bg-background/60 border-border/60 focus:border-primary"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <Button onClick={handleSave} className="flex-1 btn-primary">
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </GlassmorphicCard>
              )}

              {/* Account Information */}
              <GlassmorphicCard className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Account Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Account status</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Last login</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </GlassmorphicCard>

              {/* Preferences */}
              <GlassmorphicCard className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Preferences
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive wellness tips and updates</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Privacy Settings</p>
                        <p className="text-sm text-muted-foreground">Control your data and privacy</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </div>
                </div>
              </GlassmorphicCard>

              {/* Support */}
              <GlassmorphicCard className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Support & Help
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <Brain className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">Help Center</p>
                      <p className="text-sm text-muted-foreground">Find answers to common questions</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <MessageCircle className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">Contact Support</p>
                      <p className="text-sm text-muted-foreground">Get help from our team</p>
                    </div>
                  </Button>
                </div>
              </GlassmorphicCard>

              {/* Logout */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  onClick={logout}
                  className="w-full hover:scale-105 transition-all duration-300"
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Unable to load profile information.</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
