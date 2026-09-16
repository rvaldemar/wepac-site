import {
  closing as adultsClosingPt,
  hero as adultsHeroPt,
  howToApply as adultsHowToApplyPt,
  potentialEnergy as adultsPotentialEnergyPt,
  recognition as adultsRecognitionPt,
  whatItIsNot as adultsWhatItIsNotPt,
  whatsReal as adultsWhatsRealPt,
} from "@/data/campanha-adultos";
import {
  AGE_RANGE,
  APPLICATION_DEADLINE,
  APPLICATION_QUESTIONS,
  CRISIS_NOTE,
  FACTS,
  FOLLOW_UP_PROMISE,
  HERO,
  NOT_TAKEAWAYS,
  NOT_TAKEAWAYS_INTRO,
  SAFEGUARDS,
  SCHEDULE,
  SECRECY_RULING,
  SELECTION_CRITERIA,
  SELECTION_NOTE,
  TAKEAWAYS,
  WEEKEND_SUMMARY,
  WHAT_IT_IS_NOT,
  type ScheduleDay,
} from "@/data/universidade-verao";
import type { AppLocale } from "@/i18n/routing";

interface AdultsCampaignCopy {
  metadata: { title: string; description: string };
  hero: {
    eyebrow: string;
    h1: string;
    dek: string;
    ctaLabel: string;
    microcopy: string;
  };
  recognition: { heading: string; items: string[] };
  potentialEnergy: string;
  whatsReal: {
    intro: string;
    items: Array<{ title: string; body: string }>;
    privacyLine: string;
  };
  whatItIsNot: { heading: string; items: string[] };
  howToApply: {
    heading: string;
    body: string;
    emphasis: string;
    ctaLabel: string;
  };
  closing: {
    heading: string;
    body: string;
    ctaLabel: string;
    microcopy: string;
  };
  footer: {
    description: string;
    about: string;
    contact: string;
    privacy: string;
    signIn: string;
  };
}

export const adultsCampaignCopy = {
  "pt-PT": {
    metadata: {
      title: "WEPAC Society — para quem já carrega peso a sério | WEPAC",
      description:
        "Achas que tens mais para dar do que estás a converter? Um mentor atribuído, Sessions marcadas e um Life Map privado. A candidatura é gratuita, e o primeiro Life Map também.",
    },
    hero: adultsHeroPt,
    recognition: adultsRecognitionPt,
    potentialEnergy: adultsPotentialEnergyPt,
    whatsReal: adultsWhatsRealPt,
    whatItIsNot: adultsWhatItIsNotPt,
    howToApply: adultsHowToApplyPt,
    closing: adultsClosingPt,
    footer: {
      description: "WEPAC Society — a casa comum da pertença WEPAC",
      about: "A WEPAC",
      contact: "Contacto",
      privacy: "Política de privacidade",
      signIn: "Já tens conta? Entrar",
    },
  },
  "en-US": {
    metadata: {
      title: "WEPAC Society — for people already carrying real weight | WEPAC",
      description:
        "Do you have more to give than you are currently converting? An assigned Mentor, scheduled Sessions, and a private Life Map. Applying is free, and so is your first Life Map.",
    },
    hero: {
      eyebrow: "WEPAC SOCIETY",
      h1: "The reservoir is full. The gate is what remains closed.",
      dek: "You have a job, bills, and people who depend on you. You carry your weight every day, yet you know you have more to give than you are currently converting. It is not a lack of talent. It is a lack of path.",
      ctaLabel: "Start my Life Plan",
      microcopy:
        "This is a first conversation, not an automatic registration. The team reads what you send, talks with you, and only then is an account created.",
    },
    recognition: {
      heading: "Does this feel familiar?",
      items: [
        "You know how to do more than your routine currently allows you to do.",
        "You have wondered where you go next, and life did not stop to let you answer.",
        "You care for people every day, and almost nobody asks how you are caring for yourself.",
        "You feel the weight for real, and you know carrying it alone is not the same as being well.",
      ],
    },
    potentialEnergy:
      "In physics, potential energy is energy a body has because of its position: water held behind a dam, a stone at the top of a hill, a drawn bow. Nothing has happened yet, but everything is there. The same is true of years of experience, unused gifts, and untrained strength waiting to be converted. Motivation alone never opens the gate. Structure where there was chaos, connection where there was isolation, example where there was talk, and meaning where there was noise do.",
    whatsReal: {
      intro: "This is what already exists on your side today:",
      items: [
        {
          title: "An assigned Mentor",
          body: "Not a support line or an always-on chat. A person who meets with you regularly. The relationship begins only when both people accept it.",
        },
        {
          title: "Sessions with a date",
          body: "A day, time, and calendar invitation rather than good intentions. What depends only on willpower rarely happens.",
        },
        {
          title: "A private Life Map with history",
          body: "Your map: who you are, where you are, where you are going, why, and what you commit to. Versions let you return later and see what genuinely changed.",
        },
        {
          title: "A quarterly plan and your Trails",
          body: "Goals, milestones, and Actions treated with the seriousness given to an organization, alongside the Trails you choose to pursue at your pace.",
        },
      ],
      privacyLine:
        "Your Life Map remains private. Access follows explicit product permissions, not assumptions based on a role or relationship.",
    },
    whatItIsNot: {
      heading: "What this is not",
      items: [
        "It is not a personality test: it does not generate a profile, assign a level, or place you on a ladder.",
        "It is not a habit app: no streaks and no notifications designed to pull you back.",
        "It does not replace psychological or medical care.",
        "Capacity is real: each accepted person requires real human time.",
      ],
    },
    howToApply: {
      heading: "How to begin",
      body: "You begin with the Life Plan. Tell us who you are, what you do, and what you want to change. We read every starting point and reply with the available way to begin.",
      emphasis:
        "The first step asks something of you: care with standards, truth with respect, and serious commitment.",
      ctaLabel: "Start my Life Plan",
    },
    closing: {
      heading: "From packers to WEPACkers.",
      body: "You already carry your weight. That is not a small thing; it is the first requirement. The WE adds people, rhythm, accountability, and a path that does not depend on willpower alone.",
      ctaLabel: "Start my Life Plan",
      microcopy: "It takes about five minutes. We read every answer.",
    },
    footer: {
      description: "WEPAC Society — WEPAC's shared home for belonging",
      about: "About WEPAC",
      contact: "Contact",
      privacy: "Privacy policy",
      signIn: "Already have an account? Sign in",
    },
  },
} satisfies Record<AppLocale, AdultsCampaignCopy>;

interface UniversitySummerCopy {
  metadata: { title: string; description: string };
  hero: { subtitle: string; title: string; lead: string };
  facts: Array<{ label: string; value: string }>;
  dynamicFacts: {
    when: string;
    between: string;
    places: string;
    upTo: string;
    repliesBy: string;
  };
  weekendHeading: string;
  weekendSummary: string[];
  scheduleEyebrow: string;
  scheduleHeading: string;
  scheduleIntro: string;
  schedule: ScheduleDay[];
  whyPrefix: string;
  safeguardsHeading: string;
  safeguards: string[];
  takeawaysHeading: string;
  takeaways: string[];
  notTakeawaysIntro: string;
  notTakeaways: string[];
  followUpPromise: string;
  whatItIsNotHeading: string;
  whatItIsNot: string[];
  secrecyHeading: string;
  secrecy: { kept: string[]; open: string };
  cost: {
    heading: string;
    ceilingPrefix: string;
    ceilingSuffix: string;
    funded: string;
    decline: string;
  };
  selectionHeading: string;
  selectionNote: string;
  selectionCriteria: Array<{ title: string; body: string }>;
  crisisNote: string;
  questionsHeading: string;
  applicationQuestions: string[];
  mentorsHeading: string;
  closing: {
    heading: string;
    body: string;
    apply: string;
    disabled: string;
    deadlinePrefix: string;
    agePrefix: string;
    ageJoin: string;
    ageSuffix: string;
  };
  footerDescription: string;
  footer: { about: string; contact: string; privacy: string };
}

const summerScheduleEn: ScheduleDay[] = [
  {
    day: "Friday",
    theme: "Arrive and put down the extra weight",
    blocks: [
      {
        time: "5:30 PM",
        title: "Meeting point",
        body: "A Lisbon train station, not the destination. The group's load is distributed: every Backpack carries something that belongs to everyone.",
        why: "A four-kilogram bag that is not yours can teach in ten minutes what no speech can.",
      },
      {
        time: "6:00 PM",
        title: "Travel together and walk the final stretch",
        body: "The final twenty minutes are walked in silence.",
        why: "Arriving tired and near dusk removes the need to perform.",
      },
      {
        time: "8:00 PM",
        title: "Reveal the place, settle in, and cook",
        body: "The place appears without a presentation. Each person prepares where they will sleep and the group makes dinner. Patrols of five or six rotate responsibilities from this point on.",
        why: "It replaces the posture of a customer with shared responsibility.",
      },
      {
        time: "9:45 PM",
        title: "Opening — twelve minutes, no slides",
        body: "What this is, what it is not, and three rules: tell the truth, finish what you start, and stop for anyone who falls. Nobody is being assessed and there is nothing to win.",
      },
      {
        time: "10:00 PM",
        title: "The backpack",
        body: "Each person presents an object that proves something they finished or failed: two timed minutes, standing. A Mentor goes first and shares a failure.",
        why: "It establishes a language of facts before asking anyone for honesty.",
      },
      {
        time: "11:30 PM",
        title: "Silence and the first page",
        body: "Two minutes of silence. First notebook page: where I am, one line for each pillar. Nobody reads it.",
      },
    ],
  },
  {
    day: "Saturday",
    theme: "Carry, make, finish",
    blocks: [
      {
        time: "8:00 AM",
        title: "Body",
        body: "Forty minutes outdoors: breathing, rhythm, voice, and coordination.",
        why: "Attention needs an organized body, and this warms up the instrument used that evening.",
      },
      {
        time: "9:30 AM–12:30 PM",
        title: "The weighted walk",
        body: "The group navigates an unknown route with a rotating navigator. A real constraint requires water or weight to be shared. Everyone arrives together. An equally meaningful alternative route exists for anyone with a physical limitation.",
        why: "It produces observable behavior: who stops, who carries, and who disappears.",
      },
      {
        time: "1:00 PM",
        title: "Lunch, tasks, and one hour of nothing",
        body: "No programming.",
      },
      {
        time: "2:30–3:30 PM",
        title: "An hour alone",
        body: "Alone with the notebook: where your time, money, and energy actually went during the last six months, and what that reveals.",
        why: "Spending is evidence; declared values are not enough.",
      },
      {
        time: "3:30–6:30 PM",
        title: "The work",
        body: "Each patrol receives a question from the Life Planning Project and the same assignment: create seven minutes of finished work for this place, using what is available. External critique arrives while there is still time to improve.",
        why: "Receiving serious critique midway and finishing anyway is a muscle the wider journey requires.",
      },
      {
        time: "6:30–7:30 PM",
        title: "Set up and dinner",
        body: "Care for the space, then dinner.",
      },
      {
        time: "9:00 PM",
        title: "The offering",
        body: "The pieces are presented to the people receiving them. There are no scores, prizes, or winners.",
      },
      {
        time: "9:45 PM",
        title: "The facts round",
        body: "Each person receives three observations about behavior seen during the weekend, without judgments about character or advice. Then they write: who I am — three statements, three pieces of evidence.",
        why: "It turns an impossible identity question into a task grounded in evidence.",
      },
      {
        time: "10:45 PM",
        title: "The challenge",
        body: "One hour with WEPAC on trial: direct questions about method, money, the organization, and the founder's motives. Answers are direct, including “I don't know.”",
        why: "Open challenge is an essential safeguard against closed authority.",
      },
      {
        time: "11:45 PM–1:00 AM",
        title: "The house musicians",
        body: "Twenty serious minutes at close range, followed by an open circle. Lights out at 1:00 AM.",
      },
    ],
  },
  {
    day: "Sunday",
    theme: "Finish as a principle, not a summit",
    blocks: [
      {
        time: "8:00 AM",
        title: "Body, breakfast, tasks",
        body: "The third repetition shows how structure creates freedom.",
      },
      {
        time: "9:15–10:45 AM",
        title: "Service",
        body: "A real, useful act completed before leaving: repair, clean, build, plant, or perform for someone who cannot leave home.",
        why: "Applause does not close the cycle. Service does.",
      },
      {
        time: "11:00 AM",
        title: "Where I am going",
        body: "Alone with the notebook, revisiting what gained evidence the day before.",
      },
      {
        time: "11:45 AM",
        title: "Two commitments",
        body: "One for thirty days and one for ninety. Specific enough to fail and clear enough for another person to verify.",
      },
      {
        time: "12:15 PM",
        title: "The commitment round",
        body: "Only the commitments are read to the patrol. A witness accepts responsibility for following up, and the first individual Mentorship Session is scheduled.",
      },
      {
        time: "12:45 PM",
        title: "Closing without initiation",
        body: "No certificate, oath, or group photo. The WEPACker commitment is handed over unsigned. Nothing about a person is conferred by a weekend.",
        why: "Asking for a signature after forty-four intense hours would contradict the method.",
      },
      {
        time: "1:00–2:30 PM",
        title: "Lunch and departure",
        body: "Put everything away and leave the place better than it was found. Phones are returned at the meeting point.",
      },
    ],
  },
];

export const universitySummerCopy = {
  "pt-PT": {
    metadata: {
      title: "Universidade de Verão WEPAC Society — A Travessia | WEPAC",
      description: `Um fim de semana residencial para transformar energia potencial em movimento, dos ${AGE_RANGE.min} aos ${AGE_RANGE.max} anos. Local e programa revelados a quem for convocado; candidaturas até ${APPLICATION_DEADLINE}.`,
    },
    hero: {
      subtitle: HERO.subtitle,
      title: HERO.title,
      lead: HERO.lead,
    },
    facts: FACTS,
    dynamicFacts: {
      when: "Quando",
      between: "Entre",
      places: "Lugares",
      upTo: "Até",
      repliesBy: "Respostas até",
    },
    weekendHeading: "O fim de semana, num parágrafo",
    weekendSummary: WEEKEND_SUMMARY,
    scheduleEyebrow: "Hora a hora",
    scheduleHeading: "A forma do fim de semana",
    scheduleIntro:
      "O local é surpresa. Isto não é: é quase à letra o que vais viver.",
    schedule: SCHEDULE,
    whyPrefix: "Para quê",
    safeguardsHeading: "Salvaguardas não negociáveis",
    safeguards: SAFEGUARDS,
    takeawaysHeading: "O que levas",
    takeaways: TAKEAWAYS,
    notTakeawaysIntro: NOT_TAKEAWAYS_INTRO,
    notTakeaways: NOT_TAKEAWAYS,
    followUpPromise: FOLLOW_UP_PROMISE,
    whatItIsNotHeading: "O que isto não é",
    whatItIsNot: WHAT_IT_IS_NOT,
    secrecyHeading: "Porque é que o local é segredo",
    secrecy: SECRECY_RULING,
    cost: {
      heading: "Quanto custa",
      ceilingPrefix: "Não mais de",
      ceilingSuffix:
        "€ por pessoa. Inclui dormida, todas as refeições e a viagem a partir do ponto de encontro. Não há extras.",
      funded:
        "Se o dinheiro for um obstáculo, há lugares financiados. Não pedimos informação financeira no formulário; quem for convocado pode pedir um lugar financiado sem documentos ou justificação.",
      decline:
        "Podes recusar um lugar sem justificar e sem qualquer efeito em futuras candidaturas.",
    },
    selectionHeading: "A seleção",
    selectionNote: SELECTION_NOTE,
    selectionCriteria: SELECTION_CRITERIA,
    crisisNote: CRISIS_NOTE,
    questionsHeading: "O que te vamos perguntar",
    applicationQuestions: APPLICATION_QUESTIONS,
    mentorsHeading: "Quem te acompanha",
    closing: {
      heading: "From packer to WEPACker.",
      body: "A comporta não se abre sozinha. A Travessia é um troço que se atravessa com responsabilidade e pessoas por perto.",
      apply: "Candidatar-me à Travessia",
      disabled: "Candidaturas abrem em breve",
      deadlinePrefix: "Candidaturas até",
      agePrefix: "Idades entre os",
      ageJoin: "e os",
      ageSuffix: "anos.",
    },
    footerDescription:
      "Universidade de Verão WEPAC Society — uma porta da WEPAC Society",
    footer: {
      about: "A WEPAC",
      contact: "Contacto",
      privacy: "Política de privacidade",
    },
  },
  "en-US": {
    metadata: {
      title: "WEPAC Society Summer University — A Travessia | WEPAC",
      description: `A residential weekend for turning potential energy into movement, for ages ${AGE_RANGE.min} to ${AGE_RANGE.max}. The location and program are revealed to those invited; applications close August 10, 2026.`,
    },
    hero: {
      subtitle: "WEPAC Society Summer University",
      title: "A Travessia",
      lead: "The reservoir is full and the gate is closed. This weekend is one stretch of the journey, not an entire life. From packer to WEPACker.",
    },
    facts: [
      { label: "Ages", value: `${AGE_RANGE.min} to ${AGE_RANGE.max}` },
      {
        label: "Duration",
        value:
          "One residential weekend, from Friday afternoon to Sunday afternoon.",
      },
      {
        label: "Location and program",
        value: "Revealed only to those invited.",
      },
      { label: "Applications close", value: "August 10, 2026" },
    ],
    dynamicFacts: {
      when: "When",
      between: "Between",
      places: "Places",
      upTo: "Up to",
      repliesBy: "Replies by",
    },
    weekendHeading: "The weekend in one paragraph",
    weekendSummary: [
      "You arrive on Friday afternoon at a place revealed only when you get there. You sleep there, cook, wash dishes, and carry things that belong to the group.",
      "On Saturday morning, the group navigates a route on foot without phones and arrives together. In the afternoon, each patrol has three hours to finish real work that is offered to someone that evening. External critique arrives while there is still time to improve.",
      "On Sunday, you complete useful work for the place that hosted you. You leave with two dated commitments and a named person who agreed to follow up.",
      "We do not claim to transform anyone in forty-four hours. There is no certificate, assessment, audition, or sales pitch during the weekend.",
    ],
    scheduleEyebrow: "Hour by hour",
    scheduleHeading: "The shape of the weekend",
    scheduleIntro:
      "The location is a surprise. The schedule is not: this is close to exactly what you will experience.",
    schedule: summerScheduleEn,
    whyPrefix: "Why",
    safeguardsHeading: "Non-negotiable safeguards",
    safeguards: [
      "Fixed sleeping hours, with no sleep deprivation.",
      "No manufactured catharsis through darkness, candles, or manipulative music.",
      "No alcohol; the reason is explained without moralizing.",
      "Phones are sealed only with consent agreed on Friday. Families receive an emergency contact, with a stated exception for anyone who must remain reachable.",
      "A clinically qualified adult remains reachable throughout the weekend under a written referral protocol.",
      "A second adult is responsible for care and has no Mentorship or assessment role.",
      "A restorative circle is available from Friday night.",
      "Anyone may leave at any time, and this is stated clearly at the opening.",
    ],
    takeawaysHeading: "What you take with you",
    takeaways: [
      "Your handwritten Life Planning Project v0.1: where you are, why, who you are, where you are going, and your commitments.",
      "Two dated commitments, for thirty and ninety days, with a witness who accepted the follow-up.",
      "Written observations of behavior the group actually saw, without labels.",
      "The physical experience of carrying what was not yours and being carried by others.",
      "A finished work offered to someone and a completed act of service.",
      "Five or six people who saw you work under deadline and critique.",
      "A named Mentor and the first individual Session scheduled.",
      "The WEPACker commitment on paper, unsigned.",
      "The exact name of the next available door and when it opens.",
    ],
    notTakeawaysIntro: "What you do not take with you, stated clearly:",
    notTakeaways: [
      "Transformation or formed character; character is habit, and habit takes time.",
      "A worldview; that develops by walking the path, not visiting it for a weekend.",
      "A clinical diagnosis; the pillar map is self-declared and reviewed later with a Mentor.",
      "A certificate, ranking, or guaranteed place in anything.",
    ],
    followUpPromise:
      "A weekend without follow-up is only a good production. That is why contact is always scheduled for day thirty and day ninety.",
    whatItIsNotHeading: "What this is not",
    whatItIsNot: [
      "It is not a course: there are no lessons or modules.",
      "It is not a competition: there are no winners, table, or prize.",
      "It is not closed authority: a full hour is reserved for direct questions about method, money, and motives.",
      "It is not for people who have everything resolved; a live question about direction is part of the starting point.",
      "It is not a wellness retreat: the group works hard, and critique of the work is real.",
    ],
    secrecyHeading: "Why the location is secret",
    secrecy: {
      kept: [
        "The location and exact program remain secret until selection. The purpose is pedagogical: arriving without a pre-consumed image removes anticipation as a defense.",
        "The logistics are not hidden. The meeting point is at a Lisbon train station, transportation is arranged, and no car is needed.",
      ],
      open: "In return, everything else is open. The schedule above is close to exactly what happens, hour by hour. Clarity about what happens makes limited mystery about where possible.",
    },
    cost: {
      heading: "Cost",
      ceilingPrefix: "No more than",
      ceilingSuffix:
        "EUR per person, including accommodation, all meals, and transportation from the meeting point. There are no extras.",
      funded:
        "If cost is a barrier, funded places are available. The form does not ask about finances; an invited person can request a funded place without documents or justification.",
      decline:
        "You may decline a place without giving a reason and without affecting future applications.",
    },
    selectionHeading: "Selection",
    selectionNote:
      "This is not a judgment of merit, résumé, or talent. Selection composes a group for a scarce room; it does not decide who belongs in WEPAC Society.",
    selectionCriteria: [
      {
        title: "Willingness to meet a standard",
        body: "Evidence that you finished something difficult and unglamorous.",
      },
      {
        title: "Honesty",
        body: "The ability to name an error or an “I don't know” without polish.",
      },
      {
        title: "The WE",
        body: "One concrete time when you carried weight for someone else.",
      },
      {
        title: "Being in the crossing",
        body: "A live, unresolved question about direction.",
      },
      {
        title: "Group composition",
        body: "We compose a group rather than choosing isolated individuals. At least one third comes from outside WEPAC's existing orbit.",
      },
    ],
    crisisNote:
      "If you are in an acute crisis, forty-four intensive residential hours with strangers may not be the right door now. We say this with care and offer another real starting point.",
    questionsHeading: "What we will ask",
    applicationQuestions: [
      "Something difficult and unglamorous that you finished. What was it, and what did it cost you?",
      "Something you are wrong about, or where you do not know the way, right now.",
      "A time when you carried weight for someone and nobody noticed.",
      "If this weekend goes well, what changes on Monday?",
    ],
    mentorsHeading: "Who accompanies you",
    closing: {
      heading: "From packer to WEPACker.",
      body: "The gate does not open by itself. A Travessia is one stretch crossed with responsibility and people nearby.",
      apply: "Apply to A Travessia",
      disabled: "Applications open soon",
      deadlinePrefix: "Applications close",
      agePrefix: "Ages",
      ageJoin: "to",
      ageSuffix: ".",
    },
    footerDescription:
      "WEPAC Society Summer University — a WEPAC Society starting point",
    footer: {
      about: "About WEPAC",
      contact: "Contact",
      privacy: "Privacy policy",
    },
  },
} satisfies Record<AppLocale, UniversitySummerCopy>;
