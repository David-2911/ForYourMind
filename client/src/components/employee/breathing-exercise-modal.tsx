import { useState, useEffect, useRef } from "react";
import { Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";

type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'idle';

interface BreathingExerciseProps {
  breathingType: 'box' | '4-7-8';
  isOpen: boolean;
  onClose: () => void;
}

export default function BreathingExerciseModal({ breathingType = 'box', isOpen, onClose }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Define durations based on breathing type
  const durations: Record<BreathingPhase, number> = breathingType === 'box' 
    ? { inhale: 4, hold1: 4, exhale: 4, hold2: 4, idle: 0 } 
    : { inhale: 4, hold1: 7, exhale: 8, hold2: 0, idle: 0 };
  
  const totalCycles = 3;
  const phaseOrder: BreathingPhase[] = breathingType === 'box' 
    ? ['inhale', 'hold1', 'exhale', 'hold2'] 
    : ['inhale', 'hold1', 'exhale'];

  const resetExercise = () => {
    setPhase('idle');
    setIsActive(false);
    setTimer(0);
    setCycleCount(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    lastTimeRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) {
      resetExercise();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isActive) return;

    let currentPhaseIndex = phaseOrder.indexOf(phase);
    if (currentPhaseIndex === -1) {
      currentPhaseIndex = 0;
      setPhase(phaseOrder[0]);
    }

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isActive) {
        setTimer(prevTimer => {
          const newTimer = prevTimer + deltaTime / 1000;
          const currentPhaseDuration = durations[phase];

          if (newTimer >= currentPhaseDuration) {
            // Move to next phase
            currentPhaseIndex = (currentPhaseIndex + 1) % phaseOrder.length;
            
            // If we completed a full cycle
            if (currentPhaseIndex === 0) {
              setCycleCount(prev => {
                const newCount = prev + 1;
                if (newCount >= totalCycles) {
                  // Exercise completed
                  setTimeout(() => {
                    resetExercise();
                  }, 500);
                  return newCount;
                }
                return newCount;
              });
            }

            setPhase(phaseOrder[currentPhaseIndex]);
            return 0; // Reset timer for new phase
          }
          return newTimer;
        });
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, phase, durations, phaseOrder]);

  // Calculate progress percentage for the current phase
  const progress = phase !== 'idle' ? Math.min(timer / durations[phase], 1) * 100 : 0;

  // Get instruction text based on the current phase
  const getInstructionText = () => {
    if (phase === 'idle') return "Press Start";
    if (phase === 'inhale') return "Inhale";
    if (phase === 'hold1') return "Hold";
    if (phase === 'exhale') return "Exhale";
    if (phase === 'hold2') return "Hold";
    return "";
  };

  const getTitle = () => {
    return breathingType === 'box' ? 'Box Breathing' : '4-7-8 Breathing';
  };

  const getDescription = () => {
    if (breathingType === 'box') {
      return 'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds.';
    } else {
      return 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds.';
    }
  };

  const getInfoContent = () => {
    if (breathingType === 'box') {
      return (
        <>
          <p className="mb-2">Box breathing is a powerful stress-relieving technique used by Navy SEALs, athletes, and mindfulness practitioners.</p>
          <h4 className="font-semibold mt-4 mb-2">Benefits:</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>Reduces stress and anxiety</li>
            <li>Improves concentration</li>
            <li>Helps regulate emotions</li>
            <li>Can lower blood pressure</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2">Instructions:</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Inhale through your nose for 4 seconds</li>
            <li>Hold your breath for 4 seconds</li>
            <li>Exhale completely through your mouth for 4 seconds</li>
            <li>Hold your breath for 4 seconds</li>
            <li>Repeat for at least 3 cycles</li>
          </ol>
        </>
      );
    } else {
      return (
        <>
          <p className="mb-2">The 4-7-8 breathing technique was developed by Dr. Andrew Weil as a natural tranquilizer for the nervous system.</p>
          <h4 className="font-semibold mt-4 mb-2">Benefits:</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>Helps fall asleep faster</li>
            <li>Reduces anxiety</li>
            <li>Manages cravings</li>
            <li>Controls emotional responses</li>
          </ul>
          <h4 className="font-semibold mt-4 mb-2">Instructions:</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Inhale quietly through your nose for 4 seconds</li>
            <li>Hold your breath for 7 seconds</li>
            <li>Exhale completely through your mouth for 8 seconds</li>
            <li>Repeat for at least 3 cycles</li>
          </ol>
        </>
      );
    }
  };

  // Calculate circle scale based on the current phase
  const getCircleScale = () => {
    if (phase === 'idle') return 1;
    if (phase === 'inhale') return 1 + (progress / 100) * 0.3;
    if (phase === 'exhale') return 1.3 - (progress / 100) * 0.3;
    return phase === 'hold1' || phase === 'hold2' ? 1.3 : 1;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphic max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInfoOpen(true)}
            className="ml-auto"
          >
            <div className="h-5 w-5 rounded-full border border-current flex items-center justify-center">
              <span className="font-semibold text-sm">i</span>
            </div>
          </Button>
        </DialogHeader>

        <DialogDescription className="text-center mb-6">
          {getDescription()}
        </DialogDescription>

        <div className="flex flex-col items-center justify-center py-8">
          <div 
            className="breathing-circle-exercise relative w-64 h-64 rounded-full flex items-center justify-center shadow-2xl mb-8"
            style={{ 
              transform: `scale(${getCircleScale()})`,
              transition: 'transform 0.3s ease-out',
              background: `radial-gradient(circle, 
                rgba(230, 230, 250, ${phase === 'idle' ? '0.8' : '0.9'}) 0%, 
                rgba(135, 206, 235, ${phase === 'idle' ? '0.6' : '0.7'}) 100%)`
            }}
          >
            <div className="text-center space-y-4">
              <Leaf className="w-12 h-12 mx-auto text-primary-foreground opacity-80" />
              <p className="text-primary-foreground font-semibold text-xl">
                {getInstructionText()}
              </p>
              {phase !== 'idle' && (
                <p className="text-primary-foreground font-medium">
                  {Math.floor(timer)}/{durations[phase]}s
                </p>
              )}
            </div>
            
            {/* Progress circle */}
            {phase !== 'idle' && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="4"
                  className="w-full h-full"
                  style={{ 
                    transformOrigin: 'center',
                    transform: 'scale(4)',
                  }}
                />
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
                  className="w-full h-full"
                  style={{ 
                    transformOrigin: 'center',
                    transform: 'scale(4)',
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
              </svg>
            )}
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="text-center mb-2">
              <span className="text-sm text-muted-foreground">
                Cycle {cycleCount} of {totalCycles}
              </span>
            </div>
            
            <div className="space-x-4">
              <Button
                variant="default"
                onClick={() => setIsActive(!isActive)}
                disabled={cycleCount >= totalCycles}
                className="px-8"
              >
                {isActive ? "Pause" : phase === 'idle' ? "Start" : "Resume"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetExercise}
                className="px-8"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="glassmorphic max-w-md">
          <DialogHeader>
            <DialogTitle>About {getTitle()}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {getInfoContent()}
          </div>
          <DialogClose asChild>
            <Button className="w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
