interface FloatingParticlesProps {
  className?: string;
}

export default function FloatingParticles({ className = "" }: FloatingParticlesProps) {
  return (
    <div className={`absolute inset-0 z-0 ${className}`}>
      <div className="floating-particle absolute top-20 left-10 w-4 h-4 bg-primary rounded-full opacity-60"></div>
      <div 
        className="floating-particle absolute top-40 right-20 w-6 h-6 bg-secondary rounded-full opacity-40" 
        style={{ animationDelay: '1s' }}
      ></div>
      <div 
        className="floating-particle absolute bottom-40 left-20 w-3 h-3 bg-accent rounded-full opacity-50" 
        style={{ animationDelay: '2s' }}
      ></div>
      <div 
        className="floating-particle absolute bottom-20 right-40 w-5 h-5 bg-primary rounded-full opacity-30" 
        style={{ animationDelay: '3s' }}
      ></div>
    </div>
  );
}
