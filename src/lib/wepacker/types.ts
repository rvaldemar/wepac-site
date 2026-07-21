// ===== WEPACKER — ENUMS & CONSTANTS =====

export type UserRole = "member" | "mentor" | "admin";
export type MemberLevel = "seed" | "growth" | "signature" | "partner";
export type MemberPhase =
  | "diagnosis"
  | "structuring"
  | "development"
  | "activation"
  | "consolidation";
export type EvaluationType = "self" | "mentor";
export type EvaluationMoment = "entry" | "mid" | "exit";
export type GoalScope = "annual" | "quarterly";
export type GoalStatus = "not_started" | "in_progress" | "completed";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskOrigin = "plan" | "session" | "mentor" | "self";
export type SessionType = "individual" | "group";
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export const SESSION_KIND_KEYS = [
  "checkpoint",
  "recon",
  "basecamp",
  "rescue",
  "summit",
] as const;
// The purpose of a session, from the WEPACKER mountain imaginary —
// orthogonal to SessionType, which stays the FORMAT (individual/group).
export type SessionKind = (typeof SESSION_KIND_KEYS)[number];
export type CohortStatus = "draft" | "active" | "completed" | "archived";
export type MembershipRole = "member" | "mentor";
export type MembershipStatus = "active" | "paused" | "exited";
export type TrailStatus = "active" | "paused" | "completed" | "abandoned";

export const AREA_KEYS = [
  "physical",
  "emotional",
  "character",
  "spiritual",
  "intellectual",
  "social",
] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

// The 6 development areas are universal and fixed across every pack.
export const AREA_LABELS: Record<AreaKey, string> = {
  physical: "Físico",
  emotional: "Afetivo",
  character: "Caráter",
  spiritual: "Espiritual",
  intellectual: "Intelectual",
  social: "Social",
};

export type Indicator = { key: string; label: string };

// Artist pack — integral-development indicators inherited from the
// "Artista Alpha" pilot, across the 6 universal development areas.
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
};

// Default indicators — derived from the WEPAC Diagnóstico Integral
// instrument; used by any pack without a dedicated set.
const DEFAULT_INDICATORS: Record<AreaKey, Indicator[]> = {
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
};

// Sport pack — placeholder derived from the default set until the
// sport-specific indicators are defined with real demand (GTM-first).
const PACK_INDICATORS: Record<string, Record<AreaKey, Indicator[]>> = {
  artist: ARTIST_INDICATORS,
};

// Returns the indicator set for a pack. Reads the pack from the SUBJECT
// membership being evaluated, never from the evaluator.
export function getIndicators(packSlug: string): Record<AreaKey, Indicator[]> {
  return PACK_INDICATORS[packSlug] ?? DEFAULT_INDICATORS;
}

// Whether a pack has its own indicator set rather than silently falling
// back to DEFAULT_INDICATORS. A pack without dedicated indicators has not
// had its domain instrument defined yet — running an assessment against
// it would measure the wrong dimensions and produce a diagnosis nobody can
// act on, so callers use this to gate assessments (see evaluation.ts).
export function hasDedicatedIndicators(packSlug: string): boolean {
  return packSlug in PACK_INDICATORS;
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

export const PHASE_LABELS: Record<MemberPhase, string> = {
  diagnosis: "Diagnóstico",
  structuring: "Estruturação",
  development: "Desenvolvimento",
  activation: "Ativação",
  consolidation: "Consolidação",
};

// Progression ladder — brand terms closed in English (terminology
// decision 2026-07-20). The top level displays as "Contribution"
// (maturity stage: creating value for others); the enum value stays
// `partner` for schema stability.
export const LEVEL_LABELS: Record<MemberLevel, string> = {
  seed: "Seed",
  growth: "Growth",
  signature: "Signature",
  partner: "Contribution",
};

export const MOMENT_LABELS: Record<EvaluationMoment, string> = {
  entry: "Entrada",
  mid: "Meio",
  exit: "Saída",
};

export const TRAIL_STATUS_LABELS: Record<TrailStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  abandoned: "Abandonado",
};

// Session kind — the PURPOSE of a session (why it's happening), from the
// WEPACKER mountain imaginary. Orthogonal to SessionType, which is FORMAT
// (individual/group) and is left untouched.
export const SESSION_KIND_LABELS: Record<
  SessionKind,
  { label: string; description: string }
> = {
  checkpoint: {
    label: "Checkpoint",
    description: "Acompanhamento regular no trilho",
  },
  recon: {
    label: "Reconhecimento",
    description: "Mapear o terreno — diagnóstico",
  },
  basecamp: {
    label: "Basecamp",
    description: "Planear a próxima etapa",
  },
  rescue: {
    label: "Resgate",
    description: "Apoio num momento difícil",
  },
  summit: {
    label: "Cume",
    description: "Fecho e celebração de ciclo",
  },
};

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

// Membership context resolved for the signed-in user (active membership
// with its cohort and pack), used across member-facing pages.
export interface MembershipContext {
  membershipId: string;
  role: MembershipRole;
  level: MemberLevel;
  currentPhase: MemberPhase;
  cohortId: string;
  cohortName: string;
  packId: string;
  packSlug: string;
  packName: string;
}
