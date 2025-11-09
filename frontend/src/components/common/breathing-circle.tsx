import { Leaf } from "lucide-react";

interface BreathingCircleProps {
  className?: string;
}

export default function BreathingCircle({ className = "" }: BreathingCircleProps) {
  return (
    <div className={`breathing-circle w-80 h-80 rounded-full flex items-center justify-center shadow-2xl ${className}`}>
      <div className="text-center space-y-4">
        <Leaf className="w-16 h-16 mx-auto text-primary-foreground opacity-80" />
        <p className="text-primary-foreground font-semibold">Breathe. Reflect. Grow.</p>
      </div>
    </div>
  );
}
