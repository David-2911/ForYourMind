import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";

interface WatchDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WatchDemoModal({ isOpen, onClose }: WatchDemoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-3xl animate-slide-up border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Product Demo</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
            {/* Placeholder video - use an embedded YouTube or local sample in prod */}
            <iframe
              title="Product Demo"
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
