import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlassmorphicCard from "@/components/common/glassmorphic-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WellnessAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (score: number, recommendations: string[]) => void;
}

interface Question {
  id: string;
  question: string;
  type: 'scale' | 'multiple-choice' | 'text';
  options?: string[];
  category: string;
}

interface Assessment {
  id: string;
  title: string;
  questions: Question[];
}

export default function WellnessAssessmentModal({
  isOpen,
  onClose,
  onComplete
}: WellnessAssessmentModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  // Fetch assessment when modal opens
  React.useEffect(() => {
    if (isOpen && !assessment) {
      fetchAssessment();
    }
  }, [isOpen, assessment]);

  const fetchAssessment = async () => {
    try {
      const assessments = await apiRequest("GET", "/wellness-assessments");
      if (assessments && assessments.length > 0) {
        setAssessment(assessments[0]);
      }
    } catch (error) {
      toast({
        title: "Failed to load assessment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    setIsSubmitting(true);
    try {
      const result = await apiRequest("POST", `/wellness-assessments/${assessment.id}/submit`, {
        responses
      });

      setIsCompleted(true);
      toast({
        title: "Assessment completed!",
        description: `Your wellness score: ${result.totalScore}/10`,
      });

      if (onComplete) {
        onComplete(result.totalScore, result.recommendations);
      }
    } catch (error) {
      toast({
        title: "Failed to submit assessment",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setAssessment(null);
    setIsCompleted(false);
    onClose();
  };

  if (!assessment) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="glassmorphic max-w-2xl animate-slide-up border-none bg-card/95 backdrop-blur-xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const canProceed = responses[currentQuestion.id] !== undefined;

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="glassmorphic max-w-2xl animate-slide-up border-none bg-card/95 backdrop-blur-xl">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Check className="w-8 h-8 text-green-500" />
              Assessment Complete!
            </DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for completing your wellness assessment. Your responses have been saved and will help track your progress over time.
            </p>

            <div className="flex justify-center gap-4">
              <Button onClick={handleClose} className="btn-primary">
                View Results
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glassmorphic max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up border-none bg-card/95 backdrop-blur-xl [&>button]:hidden">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-2xl font-bold">{assessment.title}</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="text-xl" />
          </Button>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </span>
            <Badge variant="secondary">{currentQuestion.category}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <GlassmorphicCard className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            {currentQuestion.question}
          </h3>

          {currentQuestion.type === 'scale' && currentQuestion.options && (
            <RadioGroup
              value={responses[currentQuestion.id]?.toString() || ""}
              onValueChange={(value) => handleResponseChange(currentQuestion.id, parseInt(value))}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </GlassmorphicCard>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {Object.keys(responses).length} of {assessment.questions.length} answered
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? "Submitting..." : "Complete Assessment"}
              <Check className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
