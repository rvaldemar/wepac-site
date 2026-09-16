export type UserRole = "member" | "admin";
export type GoalScope = "annual" | "quarterly";
export type GoalStatus = "not_started" | "in_progress" | "completed";
export type ActionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ActionOrigin = "self" | "plan" | "session_proposal";
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type TrailStatus = "active" | "paused" | "completed" | "abandoned";
export type StageKey = "easy_peasy" | "step_up" | "yup";
export type CycleStatus = "draft" | "published" | "active" | "completed" | "archived";

export const STAGE_LABELS: Record<StageKey, string> = {
  easy_peasy: "Easy Peasy",
  step_up: "Step Up",
  yup: "YUP",
};

export const PILLAR_KEYS = [
  "physical",
  "emotional",
  "character",
  "spiritual",
  "intellectual",
  "social",
] as const;
export type PillarKey = (typeof PILLAR_KEYS)[number];

export const PILLAR_LABELS: Record<PillarKey, string> = {
  physical: "Physical",
  emotional: "Emotional",
  character: "Character",
  spiritual: "Spiritual",
  intellectual: "Intellectual",
  social: "Social",
};

export const TRAIL_STATUS_LABELS: Record<TrailStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  abandoned: "Abandonado",
};

export const SESSION_KIND_KEYS = [
  "checkpoint",
  "recon",
  "basecamp",
  "rescue",
  "summit",
] as const;
export type SessionKind = (typeof SESSION_KIND_KEYS)[number];

export const SESSION_KIND_LABELS: Record<
  SessionKind,
  { label: string; description: string }
> = {
  checkpoint: {
    label: "Checkpoint",
    description: "Acompanhamento regular no trilho",
  },
  recon: {
    label: "Recon",
    description: "Mapear o terreno",
  },
  basecamp: {
    label: "Basecamp",
    description: "Planear a próxima etapa",
  },
  rescue: {
    label: "Rescue",
    description: "Apoio num momento difícil",
  },
  summit: {
    label: "Summit",
    description: "Fecho e celebração de uma etapa",
  },
};

export const SESSION_KIND_GLYPH: Record<SessionKind, string> = {
  checkpoint: "◆",
  recon: "▲",
  basecamp: "■",
  rescue: "●",
  summit: "★",
};

export const SESSION_KIND_COLOR: Record<SessionKind, string> = {
  checkpoint: "text-wepac-info",
  recon: "text-wepac-warning",
  basecamp: "text-wepac-text-secondary",
  rescue: "text-wepac-error",
  summit: "text-wepac-success",
};
