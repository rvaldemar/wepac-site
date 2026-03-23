// ===== ENUMS & CONSTANTS =====

export type UserRole = "artist" | "mentor" | "admin";
export type ArtistLevel = "seed" | "growth" | "signature" | "partner";
export type ArtistPhase = "diagnosis" | "structuring" | "development" | "activation" | "evaluation";
export type EvaluationType = "self" | "mentor";
export type EvaluationMoment = "entry" | "mid" | "exit";
export type GoalScope = "annual" | "quarterly";
export type GoalStatus = "not_started" | "in_progress" | "completed";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskOrigin = "plan" | "session" | "mentor" | "self";
export type SessionType = "individual" | "group";
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export const AREA_KEYS = ["physical", "emotional", "character", "spiritual", "intellectual", "social"] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

export const AREA_LABELS: Record<AreaKey, string> = {
  physical: "Físico",
  emotional: "Afetivo",
  character: "Caráter",
  spiritual: "Espiritual",
  intellectual: "Intelectual",
  social: "Social",
};

export const INDICATORS: Record<AreaKey, { key: string; label: string }[]> = {
  physical: [
    { key: "posture", label: "Postura" },
    { key: "breathing", label: "Respiração" },
    { key: "body_awareness", label: "Consciência corporal" },
    { key: "endurance", label: "Resistência / gestão de energia" },
    { key: "self_care", label: "Autocuidado" },
    { key: "stage_presence_physical", label: "Presença em palco (dimensão física)" },
    { key: "image", label: "Imagem e apresentação" },
  ],
  emotional: [
    { key: "emotional_management", label: "Gestão emocional" },
    { key: "authenticity", label: "Autenticidade" },
    { key: "expressiveness", label: "Expressividade" },
    { key: "resilience", label: "Resiliência" },
    { key: "feedback_relationship", label: "Relação com crítica e feedback" },
    { key: "stage_relationship", label: "Relação com palco" },
    { key: "vulnerability", label: "Vulnerabilidade" },
  ],
  character: [
    { key: "discipline", label: "Disciplina" },
    { key: "punctuality", label: "Pontualidade" },
    { key: "commitment", label: "Compromisso" },
    { key: "professional_ethics", label: "Ética profissional" },
    { key: "plan_follow_through", label: "Seguimento de planos" },
    { key: "responsibility", label: "Responsabilidade" },
    { key: "prolonged_effort", label: "Capacidade de esforço prolongado" },
  ],
  spiritual: [
    { key: "purpose_clarity", label: "Clareza de propósito" },
    { key: "art_life_coherence", label: "Coerência entre arte e vida" },
    { key: "depth_of_vision", label: "Profundidade de visão" },
    { key: "beauty_relationship", label: "Relação com o belo" },
    { key: "mission_sense", label: "Sentido de missão" },
    { key: "interiority", label: "Interioridade / práticas de silêncio e reflexão" },
  ],
  intellectual: [
    { key: "technical_knowledge", label: "Conhecimento técnico" },
    { key: "artistic_culture", label: "Cultura artística e referências" },
    { key: "analytical_capacity", label: "Capacidade analítica" },
    { key: "strategic_thinking", label: "Pensamento estratégico" },
    { key: "market_understanding", label: "Compreensão do mercado" },
    { key: "pedagogical_capacity", label: "Capacidade pedagógica" },
    { key: "repertoire_diversity", label: "Repertório / diversidade de oferta" },
  ],
  social: [
    { key: "communication", label: "Comunicação (clareza, assertividade, escuta)" },
    { key: "teamwork", label: "Trabalho em equipa" },
    { key: "audience_relationship", label: "Relação com público" },
    { key: "networking", label: "Networking" },
    { key: "context_reading", label: "Leitura de contexto" },
    { key: "collaboration", label: "Colaboração / co-criação" },
    { key: "community_presence", label: "Presença comunitária" },
  ],
};

export const SCORE_LABELS: Record<number, string> = {
  1: "Inicial",
  2: "Emergente",
  3: "Consistente",
  4: "Forte",
  5: "Referência",
};

export const STRATEGIC_SCORE_LABELS: Record<number, string> = {
  1: "Inexistente",
  2: "Esboço",
  3: "Definido",
  4: "Em execução",
  5: "Consolidado",
};

export const PHASE_LABELS: Record<ArtistPhase, string> = {
  diagnosis: "Diagnóstico",
  structuring: "Estruturação",
  development: "Desenvolvimento",
  activation: "Ativação",
  evaluation: "Avaliação",
};

export const LEVEL_LABELS: Record<ArtistLevel, string> = {
  seed: "Seed",
  growth: "Growth",
  signature: "Signature",
  partner: "Partner",
};

// ===== DATA MODELS =====

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  inviteToken?: string;
  onboarded: boolean;
  level: ArtistLevel;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  currentPhase: ArtistPhase;
  createdAt: string;
  updatedAt: string;
}

export interface Agreement {
  id: string;
  userId: string;
  version: string;
  acceptedAt: string;
}

export interface EvaluationScore {
  id: string;
  evaluationId: string;
  area: AreaKey;
  indicator: string;
  score: number;
  notes?: string;
}

export interface Evaluation {
  id: string;
  userId: string;
  evaluatorId: string;
  evaluationType: EvaluationType;
  moment: EvaluationMoment;
  completedAt?: string;
  scores: EvaluationScore[];
}

export interface StrategicMapScore {
  id: string;
  userId: string;
  evaluatorId: string;
  month: string;
  longTermScore: number;
  annualScore: number;
  quarterlyScore: number;
  monthlyScore: number;
  notes?: string;
}

export interface LifePlan {
  id: string;
  userId: string;
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  strategicPlanId: string;
  scope: GoalScope;
  title: string;
  description: string;
  successCriteria: string;
  deadline: string;
  status: GoalStatus;
}

export interface MonthlyAction {
  id: string;
  strategicPlanId: string;
  month: string;
  title: string;
  goalId?: string;
  deadline: string;
  status: TaskStatus;
}

export interface StrategicPlan {
  id: string;
  userId: string;
  quarter: string;
  longTermVision: string;
  positioning: string;
  focusAreas: AreaKey[];
  quarterlyReflection: string;
  goals: Goal[];
  monthlyActions: MonthlyAction[];
}

export interface Task {
  id: string;
  userId: string;
  assignedById?: string;
  title: string;
  description?: string;
  origin: TaskOrigin;
  goalId?: string;
  deadline: string;
  status: TaskStatus;
  comments: Comment[];
}

export interface Session {
  id: string;
  mentorId: string;
  sessionType: SessionType;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  notes?: string;
  notesPublished: boolean;
  discussionPoints?: string;
  attendees: SessionAttendee[];
}

export interface SessionAttendee {
  id: string;
  sessionId: string;
  userId: string;
  attended: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  commentableType: string;
  commentableId: string;
  body: string;
  createdAt: string;
}

// ===== COMPUTED TYPES =====

export interface AreaScore {
  area: AreaKey;
  selfScore?: number;
  mentorScore?: number;
  compositeScore: number;
}

export interface RadarData {
  areas: AreaScore[];
}

export interface StrategicRadarData {
  longTerm: number;
  annual: number;
  quarterly: number;
  monthly: number;
}
