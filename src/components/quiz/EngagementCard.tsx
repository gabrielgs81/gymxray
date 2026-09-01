import { Sparkles } from "lucide-react";

import type { QuizEngagement } from "@/lib/quiz/engagement";

export function EngagementCard({ engagement }: { engagement: QuizEngagement }) {
  return (
    <div className="engagement-enter space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {engagement.eyebrow}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {engagement.encouragement}
        </p>
      </div>

      {engagement.insight && (
        <div
          className="insight-unlocked relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-glow"
          role="status"
          aria-live="polite"
        >
          <div className="absolute -right-6 -top-8 size-24 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Descoberta liberada
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{engagement.insight.label}</p>
              <p className="text-2xl font-bold tracking-tight">{engagement.insight.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {engagement.insight.detail}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
