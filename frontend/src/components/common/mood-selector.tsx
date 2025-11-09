import { useState } from "react";

interface MoodSelectorProps {
  onMoodSelect?: (mood: number) => void;
  selectedMood?: number;
  size?: "sm" | "md" | "lg";
}

const moodEmojis = ["😢", "😕", "😐", "🙂", "😊"];

export default function MoodSelector({ 
  onMoodSelect, 
  selectedMood, 
  size = "md" 
}: MoodSelectorProps) {
  const [selected, setSelected] = useState<number | undefined>(selectedMood);

  const handleMoodClick = (mood: number) => {
    setSelected(mood);
    onMoodSelect?.(mood);
  };

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex justify-center space-x-4">
      {moodEmojis.map((emoji, index) => (
        <button
          key={index}
          data-testid={`mood-emoji-${index + 1}`}
          className={`mood-emoji ${sizeClasses[size]} ${
            selected === index + 1 ? 'scale-125' : ''
          }`}
          onClick={() => handleMoodClick(index + 1)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
