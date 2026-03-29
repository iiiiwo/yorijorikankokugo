interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "red" | "blue" | "gold" | "green";
}

export function ProgressBar({ value, max = 100, className = "", color = "red" }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClass = {
    red: "bg-korean-red",
    blue: "bg-korean-blue",
    gold: "bg-korean-gold",
    green: "bg-green-500",
  }[color];

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className={`${colorClass} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
