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
export type Track = "artist" | "adult" | "clinic";

export const AREA_KEYS = ["physical", "emotional", "character", "spiritual", "intellectual", "social", "artistic"] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

export const AREA_LABELS: Record<AreaKey, string> = {
  physical: "Físico",
  emotional: "Afetivo",
  character: "Caráter",
  spiritual: "Espiritual",
  intellectual: "Intelectual",
  social: "Social",
  artistic: "Artístico-Cultural",
};

type Indicator = { key: string; label: string };

// Artist track — the integral-development indicators used by the WEPAC
// "Artista Alpha" programme (now including the 7th, artistic-cultural pillar).
const ARTIST_INDICATORS: Record<AreaKey, Indicator[]> = {
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
  artistic: [
    { key: "creative_voice", label: "Voz criativa própria" },
    { key: "technical_mastery", label: "Domínio técnico da linguagem" },
    { key: "imagination", label: "Imaginação e originalidade" },
    { key: "finish_quality", label: "Cuidado com o detalhe e acabamento" },
    { key: "creative_courage", label: "Coragem criativa / arriscar" },
    { key: "cultural_memory", label: "Memória cultural e referências" },
    { key: "beauty_relationship", label: "Relação com o belo e o património" },
  ],
};

// Adult track — indicators derived from the WEPAC Diagnóstico Integral
// instrument (diagnostico-integral-instrumento.md): each pillar's questions
// condensed into short, observable indicator labels (PT-PT).
const ADULT_INDICATORS: Record<AreaKey, Indicator[]> = {
  physical: [
    { key: "daily_rhythm", label: "Ritmo de dia e sono" },
    { key: "energy_stability", label: "Estabilidade de energia" },
    { key: "stress_regulation", label: "Regulação em stress / cansaço" },
    { key: "body_tension", label: "Tensão corporal crónica" },
    { key: "effort_rest", label: "Relação com esforço e descanso" },
    { key: "basic_self_care", label: "Cuidado do básico e do espaço" },
  ],
  emotional: [
    { key: "name_emotions", label: "Nomear o que se sente" },
    { key: "recover_failure", label: "Recuperar de falha ou frustração" },
    { key: "repair_relationship", label: "Reparar falhas nas relações" },
    { key: "secure_bonds", label: "Vínculos com previsibilidade e confiança" },
    { key: "self_esteem_base", label: "Autoestima em competência e vínculo" },
  ],
  character: [
    { key: "finish_what_starts", label: "Terminar o que se começa" },
    { key: "small_habits", label: "Hábitos pequenos e consistentes" },
    { key: "own_consequences", label: "Assumir consequências" },
    { key: "values_coherence", label: "Coerência entre valores e ação" },
    { key: "service_beyond_self", label: "Servir algo para além de si" },
  ],
  spiritual: [
    { key: "purpose_link", label: "Ligar esforço a propósito" },
    { key: "silence_tolerance", label: "Tolerar o silêncio" },
    { key: "gratitude_reverence", label: "Gratidão e reverência" },
    { key: "big_questions", label: "Lugar para as perguntas grandes" },
    { key: "belonging_greater", label: "Pertencer a algo maior" },
  ],
  intellectual: [
    { key: "sustained_focus", label: "Foco sustentado" },
    { key: "genuine_curiosity", label: "Curiosidade genuína por aprender" },
    { key: "opinion_vs_evidence", label: "Distinguir opinião de evidência" },
    { key: "depth_over_surface", label: "Aprofundar em vez de consumir raso" },
    { key: "explain_in_own_words", label: "Explicar por palavras próprias" },
  ],
  social: [
    { key: "communicate_listen", label: "Comunicar e escutar" },
    { key: "handle_conflict", label: "Reparar em vez de fugir no conflito" },
    { key: "belong_with_integrity", label: "Pertencer sem se submeter" },
    { key: "cooperate", label: "Cooperar e assumir o resultado" },
    { key: "support_network", label: "Rede de apoio real" },
  ],
  artistic: [
    { key: "create_not_only_consume", label: "Criar, não só consumir" },
    { key: "express_self", label: "Expressar-se (corpo, voz, linguagem, arte)" },
    { key: "attention_to_detail", label: "Atenção ao detalhe e acabamento" },
    { key: "receive_feedback", label: "Receber feedback sem colapsar" },
    { key: "beauty_culture", label: "Relação com beleza, património e cultura" },
  ],
};

// Returns the indicator set to score for a given subject track.
// The professional/mentor view is agnostic: it reads the track from the
// SUBJECT being evaluated, never from a global const or the professional.
export function getIndicators(track: Track): Record<AreaKey, Indicator[]> {
  switch (track) {
    case "adult":
      return ADULT_INDICATORS;
    case "clinic":
      // TODO(P2): clinic track has its own specifics (guardian model,
      // role-by-specialty, age-phase 0-24); mirrors adult for now.
      return ADULT_INDICATORS;
    case "artist":
    default:
      return ARTIST_INDICATORS;
  }
}

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
  track: Track;
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
