import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, ArrowRight, X, Brain, AlertCircle, Book, Shield, Star } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

interface ChatbotWidgetProps {
  userName?: string;
  onOpenJournal?: () => void;
  onOpenTherapists?: () => void;
  onOpenAssessment?: () => void;
  onOpenLearn?: () => void;
}

export default function ChatbotWidget({ userName, onOpenJournal, onOpenTherapists, onOpenAssessment, onOpenLearn }: ChatbotWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const genId = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  // Seed a friendly greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const name = userName?.split(" ")[0] || "there";
      setMessages([
        { id: genId(), role: "bot", text: `Hi ${name} 👋 I can help you explore For Your Mind. Try: journal, book therapy, take assessment, or learn basics.` },
      ]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const quickActions = useMemo(() => ([
    { label: "Journal", icon: Book, action: () => { onOpenJournal?.(); botReply("Opening your journal ✍️"); } },
    { label: "Book Therapy", icon: Shield, action: () => { onOpenTherapists?.(); botReply("Let’s find a therapist for you 🧑‍⚕️"); } },
    { label: "Assessment", icon: Star, action: () => { onOpenAssessment?.(); botReply("Starting a quick wellbeing check ✅"); } },
    { label: "Learn Basics", icon: Book, action: () => { onOpenLearn?.(); botReply("Here are some beginner resources 📚"); } },
  ]), [onOpenJournal, onOpenTherapists, onOpenAssessment, onOpenLearn]);

  const send = (text: string) => {
    if (!text.trim()) return;
  const userMsg: ChatMessage = { id: genId(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTimeout(() => handleIntent(text), 200);
  };

  const botReply = (text: string) => {
  setMessages(prev => [...prev, { id: genId(), role: "bot", text }]);
  };

  const handleIntent = (text: string) => {
    const t = text.toLowerCase();
    if (/(journal|write|diary)/.test(t)) {
      onOpenJournal?.();
      return botReply("Opening your journal. Tip: you can tag entries like #gratitude to find them later.");
    }
    if (/(therap|counsel|book)/.test(t)) {
      onOpenTherapists?.();
      return botReply("Showing therapists. You can filter by specialization and availability.");
    }
    if (/(assess|test|phq|gad|wellness)/.test(t)) {
      onOpenAssessment?.();
      return botReply("Starting a short, evidence-based assessment. It takes about 10 minutes.");
    }
    if (/(learn|course|education|basics|resources)/.test(t)) {
      onOpenLearn?.();
      return botReply("Taking you to learning resources. Try ‘Mindfulness Basics’ to start.");
    }
    if (/(breathe|calm|relax)/.test(t)) {
      return botReply("Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. You’ll find it under Relax → Guided Sessions.");
    }
    if (/(buddy|connect|community|vent)/.test(t)) {
      return botReply("You can find a wellness buddy under Connect, and Vent Space for anonymous sharing.");
    }
    // Default help
    botReply("I can help you: 1) Journal, 2) Book Therapy, 3) Take Assessment, 4) Learn Basics. What would you like to do?");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
    {!open && (
        <Button onClick={() => setOpen(true)} className="rounded-full h-12 w-12 shadow-lg btn-primary p-0">
      <MessageCircle className="w-5 h-5" />
        </Button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="w-[320px] sm:w-[360px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Wellness Guide</div>
                <div className="text-xs text-muted-foreground">Here to help</div>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="h-64">
            <ScrollArea className="h-full p-3">
              {messages.map(m => (
                <div key={m.id} className={`mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-muted'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </ScrollArea>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 border-t border-border flex flex-wrap gap-2">
            {quickActions.map(({ label, icon: Icon, action }) => (
              <Button key={label} size="sm" variant="outline" className="text-xs" onClick={action}>
                <Icon className="w-3.5 h-3.5 mr-1.5" /> {label}
              </Button>
            ))}
            <div className="ml-auto text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-border flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about journaling, therapy, assessment..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(input);
              }}
            />
            <Button onClick={() => send(input)} size="icon" className="btn-primary">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
