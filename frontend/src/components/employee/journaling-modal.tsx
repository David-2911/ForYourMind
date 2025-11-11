import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import { Calendar, Clock, BookOpen, NotebookPen, Edit, Trash2 } from "lucide-react";

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
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const { toast } = useToast();

  // ✅ Fetch existing journals
  const { data: journals = [], isLoading, refetch } = useQuery<Journal[]>({
    queryKey: ["/journals"],
  });

  // ✅ Add new journal entry
  const { mutate: addJournal, isPending: adding } = useMutation({
    mutationFn: async (journalData: { title: string; content: string }) => {
      return apiRequest("POST", "/journals", journalData);
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

  // ✅ Update journal entry
  const { mutate: updateJournal, isPending: updating } = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      return apiRequest("PUT", `/journals/${data.id}`, { title: data.title, content: data.content });
    },
    onSuccess: () => {
      toast({ title: "Journal updated", description: "Your entry has been updated successfully." });
      setEditingJournal(null);
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ✅ Delete journal entry
  const { mutate: deleteJournal } = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/journals/${id}`, undefined);
    },
    onSuccess: () => {
      toast({ title: "Journal deleted", description: "Your entry has been removed." });
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (editingJournal) {
      updateJournal({ id: editingJournal.id, title: newJournal.title, content: newJournal.content });
    } else {
      addJournal({ title: newJournal.title, content: newJournal.content });
    }
  };

  const startEdit = (journal: Journal) => {
    setEditingJournal(journal);
    setNewJournal({ title: journal.title, content: journal.content });
  };

  const cancelEdit = () => {
    setEditingJournal(null);
    setNewJournal({ title: "", content: "" });
  };

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

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={adding || updating || !newJournal.title.trim() || !newJournal.content.trim()}
            >
              {adding || updating ? "Saving..." : editingJournal ? "Update Journal" : "Save Journal"}
            </Button>
            {editingJournal && (
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
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
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium flex items-center gap-2">
                      <BookOpen size={16} />
                      {journal.title}
                    </h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(journal)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this journal entry?")) {
                            deleteJournal(journal.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
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
