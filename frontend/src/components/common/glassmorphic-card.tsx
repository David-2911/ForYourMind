import { ReactNode } from "react";

interface GlassmorphicCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassmorphicCard({ 
  children, 
  className = "", 
  hover = false 
}: GlassmorphicCardProps) {
  return (
    <div className={`glassmorphic rounded-2xl p-6 ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}
