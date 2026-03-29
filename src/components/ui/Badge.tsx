interface BadgeProps {
  icon: string;
  name: string;
  description: string;
  earned?: boolean;
  earnedAt?: string;
  xpReward?: number;
}

export function BadgeCard({ icon, name, description, earned = false, earnedAt, xpReward }: BadgeProps) {
  return (
    <div className={`card text-center transition-all ${earned ? "" : "opacity-50 grayscale"}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-bold text-gray-800 text-sm mb-1">{name}</h3>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      {earned && earnedAt && (
        <p className="text-xs text-korean-gold font-medium">
          {new Date(earnedAt).toLocaleDateString("ja-JP")} 獲得
        </p>
      )}
      {xpReward && xpReward > 0 && (
        <p className="text-xs text-gray-400 mt-1">+{xpReward} XP</p>
      )}
      {!earned && (
        <p className="text-xs text-gray-400">未獲得</p>
      )}
    </div>
  );
}
