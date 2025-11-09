import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Clock, BookOpen, NotebookPen } from "lucide-react";

interface Journal {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface JournalingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function JournalingModal({ isOpen, onClose }: JournalingModalProps = {}) {
  const [newJournal, setNewJournal] = useState({ title: "", content: "" });
  const { toast } = useToast();

  // ✅ Fetch existing journals
  const { data: journals = [], isLoading, refetch } = useQuery<Journal[]>({
    queryKey: ["journals"],
    queryFn: async () => {
      const res = await fetch("/api/journals", {
        method: "GET",
        credentials: "include",
      });
      return res.ok ? res.json() : [];
    },
  });

  // ✅ Add new journal entry
  const { mutate: addJournal, isPending: adding } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newJournal),
      });
      if (!res.ok) throw new Error("Failed to add journal");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Journal saved", description: "Your entry has been added successfully." });
      setNewJournal({ title: "", content: "" });
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <NotebookPen size={18} />
          Journal
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Personal Journals
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-2" />

        {/* 📝 Journal Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Journal Title"
              value={newJournal.title}
              onChange={(e) => setNewJournal({ ...newJournal, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your thoughts..."
              rows={4}
              value={newJournal.content}
              onChange={(e) => setNewJournal({ ...newJournal, content: e.target.value })}
            />
          </div>

          <Button
            onClick={() => addJournal()}
            disabled={adding || !newJournal.title.trim() || !newJournal.content.trim()}
          >
            {adding ? "Saving..." : "Save Journal"}
          </Button>
        </div>

        <Separator className="my-4" />

        {/* 📜 Journal List */}
        <ScrollArea className="h-64 pr-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : journals.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center">
              No journal entries yet.
            </p>
          ) : (
            <div className="space-y-3">
              {journals.map((journal) => (
                <div
                  key={journal.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <h4 className="font-medium flex items-center gap-2">
                    <BookOpen size={16} />
                    {journal.title}
                  </h4>
                  <p className="text-sm mt-1">{journal.content}</p>
                  <div className="text-xs text-gray-500 flex gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />{" "}
                      {new Date(journal.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {new Date(journal.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ScrollBar />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
