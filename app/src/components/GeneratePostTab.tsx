import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  ClipboardCopy,
  Save,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  Globe,
  Check,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Linkedin,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/dateUtils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { NewsArticle } from '@/data/mockNews';
import { generateAiPost, type GenerateAiPostParams, getLinkedInStatus, publishToLinkedIn } from '@/services/apiService';
import { getAiSettings } from '@/lib/settings';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Language = 'en' | 'es';
type Tone = 'Professional' | 'Casual' | 'Urgent' | 'Educational' | 'Thought Leadership';
type Format = 'News Analysis' | 'Quick Summary' | 'Thread' | 'Contrarian' | 'Storytelling' | 'Daily Digest';
type Length = 'short' | 'medium' | 'long';

interface SavedPost {
  id: string;
  title: string;
  content: string;
  sourceArticleTitle: string;
  sourceArticleUrl: string;
  tone: string;
  format: string;
  length: string;
  createdAt: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  scheduledFor: string;
  createdAt: string;
  sourceTitle: string;
  format: string;
  tone: string;
  language: Language;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return 'bg-[#EF4444]';
    case 'high': return 'bg-[#F97316]';
    case 'medium': return 'bg-[#EAB308]';
    case 'low': return 'bg-[#22C55E]';
    default: return 'bg-[#808080]';
  }
};

const toneLabel = (t: Tone) => {
  switch (t) {
    case 'Professional': return 'Professional';
    case 'Casual': return 'Casual / Conversational';
    case 'Urgent': return 'Urgent / Breaking News';
    case 'Educational': return 'Educational';
    case 'Thought Leadership': return 'Thought Leadership';
  }
};

const lengthWordCount = (l: Length) => {
  switch (l) {
    case 'short': return '~100-150 words';
    case 'medium': return '~200-250 words';
    case 'long': return '~300-400 words';
  }
};

function splitIntoSlides(content: string): string[] {
  const lines = content.split('\n');
  const slides: string[] = [];
  let currentSlide = '';

  const slidePattern = /^(\d+[\d\W]*|[\d\d\W]|[\u{1F1E6}-\u{1F1FF}\u{2702}-\u{27B0}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*\d+|[\u2705\u274C\u26A0\u{1F4A1}\u{1F510}\u{1F4DD}\u{1F4E2}\u{1F6A8}\u{1F4BC}\u{1F4DA}\u{1F3AF}\u2615\u{1F534}\u{1F7E0}\u{1F7E1}\u{1F7E2}]\s*\d+)/u;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSlide) {
        currentSlide += '\n';
      }
      continue;
    }

    const isSlideStart = /^\d+\W|^\d+[\d\W]\s/.test(trimmed) || slidePattern.test(trimmed);

    if (isSlideStart && currentSlide.trim()) {
      slides.push(currentSlide.trim());
      currentSlide = trimmed;
    } else {
      currentSlide += (currentSlide ? '\n' : '') + trimmed;
    }
  }

  if (currentSlide.trim()) {
    slides.push(currentSlide.trim());
  }

  if (slides.length === 0 && content.trim()) {
    return [content.trim()];
  }

  return slides.length > 0 ? slides : [''];
}

/* ------------------------------------------------------------------ */
/*  Translation helpers                                                */
/* ------------------------------------------------------------------ */

function getLabels(lang: Language) {
  if (lang === 'es') {
    return {
      sourceArticle: 'ARTÍCULO FUENTE',
      generatePost: 'GENERAR PUBLICACIÓN',
      editPost: 'EDITAR PUBLICACIÓN',
      linkedinPreview: 'VISTA PREVIA DE LINKEDIN',
      carouselPreview: 'VISTA PREVIA DEL CARRUSEL',
      tone: 'TONO',
      format: 'FORMATO',
      length: 'LONGITUD',
      language: 'IDIOMA',
      selectArticles: 'SELECCIONAR ARTÍCULOS',
      selected: 'seleccionados',
      articlesWillBeIncluded: 'artículos serán incluidos',
      backToNews: 'Volver al Feed de Noticias',
      openOriginal: 'Abrir Original',
      generateBtn: 'Generar Publicación',
      generating: 'Generando...',
      regenerate: 'Regenerar',
      copy: 'Copiar al Portapapeles',
      copied: '¡Copiado!',
      save: 'Guardar Publicación',
      like: 'Me gusta',
      comment: 'Comentar',
      repost: 'Republicar',
      send: 'Enviar',
      reactions: 'reacciones',
      comments: 'comentarios',
      now: 'Ahora',
      tomorrow9: 'Mañana 9AM',
      tomorrow12: 'Mañana 12PM',
      bestTime: 'Mejor hora',
      schedulePost: 'PROGRAMAR PUBLICACIÓN',
      date: 'Fecha',
      time: 'Hora',
      scheduleBtn: 'Programar',
      scheduledPosts: 'Publicaciones Programadas',
      noScheduled: 'No hay publicaciones programadas',
      delete: 'Eliminar',
      short: 'Corto',
      medium: 'Medio',
      long: 'Largo',
    };
  }

  return {
    sourceArticle: 'SOURCE ARTICLE',
    generatePost: 'GENERATE POST',
    editPost: 'EDIT POST',
    linkedinPreview: 'LINKEDIN PREVIEW',
    carouselPreview: 'CAROUSEL PREVIEW',
    tone: 'TONE',
    format: 'FORMAT',
    length: 'LENGTH',
    language: 'LANGUAGE',
    selectArticles: 'SELECT ARTICLES',
    selected: 'selected',
    articlesWillBeIncluded: 'articles will be included',
    backToNews: 'Back to News Feed',
    openOriginal: 'Open Original',
    generateBtn: 'Generate Post',
    generating: 'Generating...',
    regenerate: 'Regenerate',
    copy: 'Copy to Clipboard',
    copied: 'Copied!',
    save: 'Save Post',
    like: 'Like',
    comment: 'Comment',
    repost: 'Repost',
    send: 'Send',
    reactions: 'reactions',
    comments: 'comments',
    now: 'Now',
    tomorrow9: 'Tomorrow 9AM',
    tomorrow12: 'Tomorrow 12PM',
    bestTime: 'Best Time',
    schedulePost: 'SCHEDULE POST',
    date: 'Date',
    time: 'Time',
    scheduleBtn: 'Schedule',
    scheduledPosts: 'Scheduled Posts',
    noScheduled: 'No scheduled posts',
    delete: 'Delete',
    short: 'Short',
    medium: 'Medium',
    long: 'Long',
  };
}

/* ------------------------------------------------------------------ */
/*  Mock post generation                                               */
/* ------------------------------------------------------------------ */

function generateMockPost(
  article: NewsArticle,
  tone: Tone,
  format: Exclude<Format, 'Daily Digest'>,
  length: Length,
  lang: Language
): string {
  const wordCount =
    length === 'short' ? 'short' : length === 'medium' ? 'medium' : 'long';

  const templates: Record<Exclude<Format, 'Daily Digest'>, (a: NewsArticle, t: Tone, wc: string, lang: Language) => string> = {
    'News Analysis': newsAnalysisTemplate,
    'Quick Summary': quickSummaryTemplate,
    'Thread': threadTemplate,
    'Contrarian': contrarianTemplate,
    'Storytelling': storytellingTemplate,
  };

  const post = templates[format](article, tone, wordCount, lang);
  const sourceLine =
    lang === 'es'
      ? `🔗 Lee la historia completa: ${article.url}`
      : `🔗 Read the full story: ${article.url}`;
  return `${post}\n\n${sourceLine}`;
}

function baseTone(tone: Tone, sentence: string, lang: Language): string {
  if (lang === 'es') {
    // Spanish tone adjustments - only on complete words
    if (tone === 'Casual') return sentence.replace(/\bestá utilizando\b/g, 'está usando').replace(/\borganizaciones\b/g, 'empresas').replace(/\bimplementar\b/g, 'poner en marcha');
    if (tone === 'Urgent') return sentence.replace(/\bdebería\b/g, 'debe').replace(/\bimportante\b/g, 'crítico');
    if (tone === 'Educational') return sentence;
    if (tone === 'Thought Leadership') return sentence.replace(/\bes un\b/g, 'representa un').replace(/\batacantes\b/g, 'actores de amenazas');
    return sentence;
  }

  // English tone adjustments - only on complete words
  if (tone === 'Casual') return sentence.replace(/\bis utilizing\b/g, 'is using').replace(/\borganizations\b/g, 'companies').replace(/\bimplement\b/g, 'put in place').replace(/\bimmediately\b/g, 'ASAP');
  if (tone === 'Urgent') return sentence.replace(/\bshould\b/g, 'must').replace(/\bimportant\b/g, 'critical').replace(/\bconsider\b/g, 'act now to');
  if (tone === 'Educational') return sentence;
  if (tone === 'Thought Leadership') return sentence.replace(/\bis a\b/g, 'represents a').replace(/\battackers\b/g, 'threat actors');
  return sentence;
}

function hashtags(article: NewsArticle, lang: Language): string {
  if (lang === 'es') {
    const categoryTags: Record<string, string> = {
      'RANSOMWARE': '#ransomware #infraestructuracritica',
      'VULNERABILITY': '#vulnerabilidad #gestiondeparches',
      'DATA BREACH': '#filtraciondedatos #sanidad #privacidad',
      'THREAT INTEL': '#inteligenciadeamenazas #APT #cadenadesuministro',
      'COMPLIANCE': '#cumplimiento #NIS2 #regulacion',
      'MALWARE': '#malware #botnet #DDoS',
      'PHISHING': '#phishing #MFA #ingenieriasocial',
      'RESEARCH': '#ciberseguridad #investigacion #postcuantica',
      'POLICY': '#politica #gobernanza #regulacion',
      'PRIVACY': '#privacidad #protecciondedatos #GDPR',
      'ALERT': '#alertadeseguridad #infoseguridad #ciberseguridad',
      'EXPLOIT': '#exploit #zeroday #vulnerabilidad',
      'IOT': '#IoT #seguridadembebida #infraestructuracritica',
      'INDUSTRY': '#industriaciberseguridad #tendencias #estrategia',
      'AWARENESS': '#concientizacion #factorhumano #capacitacion',
      'SUPPLY CHAIN': '#cadenadesuministro #terceros #gestionderiesgos',
      'AI SECURITY': '#seguridadIA #InteligenciaArtificial #aprendizajeautomatico',
    };
    const specific = categoryTags[article.category] || '#ciberseguridad';
    return `${specific} #ciberseguridad #infoseguridad`;
  }

  const categoryTags: Record<string, string> = {
    'RANSOMWARE': '#ransomware #criticalinfrastructure',
    'VULNERABILITY': '#vulnerability #patchmanagement',
    'DATA BREACH': '#databreach #healthcare #privacy',
    'THREAT INTEL': '#threatintel #APT #supplychain',
    'COMPLIANCE': '#compliance #NIS2 #regulation',
    'MALWARE': '#malware #botnet #DDoS',
    'PHISHING': '#phishing #MFA #socialengineering',
    'RESEARCH': '#cybersecurity #research #postquantum',
    'POLICY': '#policy #governance #regulation',
    'PRIVACY': '#privacy #dataprotection #GDPR',
    'ALERT': '#securityalert #infosec #cybersecurity',
    'EXPLOIT': '#exploit #zeroday #vulnerability',
    'IOT': '#IoT #embeddedsecurity #criticalinfrastructure',
    'INDUSTRY': '#cybersecurityindustry #trends #strategy',
    'AWARENESS': '#securityawareness #humanfactor #training',
    'SUPPLY CHAIN': '#supplychain #thirdparty #riskmanagement',
    'AI SECURITY': '#AIsecurity #ArtificialIntelligence #machinelearning',
  };
  const specific = categoryTags[article.category] || '#cybersecurity';
  return `${specific} #infosec #cybersecurity`;
}

interface CategoryContext {
  topic: string;
  incident: string;
  advice: { short: string; medium: string; long: string };
  question: string;
}

function categoryContext(category: string, lang: Language): CategoryContext {
  const fallbackEn: CategoryContext = {
    topic: 'security developments',
    incident: 'a security development',
    advice: {
      short: 'assess relevance and identify your next step',
      medium: 'assess relevance, assign ownership, and track outcomes',
      long: 'assess relevance, assign ownership, track outcomes, and update your security roadmap',
    },
    question: 'How does this fit into your security priorities?',
  };

  const fallbackEs: CategoryContext = {
    topic: 'novedades de seguridad',
    incident: 'una novedad de seguridad',
    advice: {
      short: 'evalúa la relevancia e identifica tu próximo paso',
      medium: 'evalúa la relevancia, asigna responsables y da seguimiento a los resultados',
      long: 'evalúa la relevancia, asigna responsables, da seguimiento a los resultados y actualiza tu hoja de ruta de seguridad',
    },
    question: '¿Cómo encaja esto en tus prioridades de seguridad?',
  };

  if (lang === 'es') {
    const contexts: Record<string, CategoryContext> = {
      'RANSOMWARE': {
        topic: 'ataques de ransomware',
        incident: 'un ataque de ransomware',
        advice: {
          short: 'aísla los sistemas afectados y verifica las copias de seguridad',
          medium: 'aísla los sistemas afectados, verifica la integridad de las copias de seguridad y alerta a tu equipo de respuesta a incidentes',
          long: 'aísla los sistemas afectados, verifica la integridad de las copias de seguridad, moviliza a tu equipo de respuesta a incidentes y revisa los planes de continuidad del negocio',
        },
        question: '¿Cómo estás fortaleciendo tu capacidad de recuperación ante ransomware?',
      },
      'VULNERABILITY': {
        topic: 'vulnerabilidades de software',
        incident: 'una vulnerabilidad recién divulgada',
        advice: {
          short: 'verifica la exposición y prioriza los parches',
          medium: 'evalúa la exposición, prioriza los parches y prueba controles compensatorios',
          long: 'evalúa la exposición en todo tu entorno, prioriza los parches, prueba controles compensatorios y comunica los plazos a los interesados',
        },
        question: '¿Cuál es tu mayor desafío en la gestión de parches?',
      },
      'DATA BREACH': {
        topic: 'filtraciones de datos',
        incident: 'una filtración de datos',
        advice: {
          short: 'confirma el alcance y notifica a los afectados',
          medium: 'confirma el alcance, preserva las evidencias y notifica a los afectados según la normativa',
          long: 'confirma el alcance, preserva las evidencias, notifica a los afectados y reguladores, y revisa las políticas de retención de datos',
        },
        question: '¿Qué controles habrían dificultado esta filtración?',
      },
      'THREAT INTEL': {
        topic: 'hallazgos de inteligencia de amenazas',
        incident: 'una campaña de actores de amenazas',
        advice: {
          short: 'compara los IOC con tu telemetría',
          medium: 'compara los IOC con tu telemetría, actualiza las detecciones y informa a los analistas',
          long: 'compara los IOC con tu telemetría, actualiza las reglas de detección, informa a los analistas y comparte ideas relevantes con aliados',
        },
        question: '¿Cómo conviertes la inteligencia de amenazas en acción?',
      },
      'COMPLIANCE': {
        topic: 'novedades regulatorias',
        incident: 'un requisito normativo',
        advice: {
          short: 'mapea el requisito con tus controles',
          medium: 'mapea el requisito con tus controles, identifica brechas y asigna responsables',
          long: 'mapea el requisito con tus controles, identifica brechas, asigna responsables y construye una hoja de ruta de remediación',
        },
        question: '¿Qué obligación de cumplimiento te mantiene más ocupado?',
      },
      'MALWARE': {
        topic: 'hallazgos de malware',
        incident: 'una infección de malware',
        advice: {
          short: 'contiene el equipo y busca persistencia',
          medium: 'contiene los equipos afectados, busca persistencia y restablece las credenciales',
          long: 'contiene los equipos afectados, busca persistencia, restablece las credenciales comprometidas y mejora los controles de ejecución',
        },
        question: '¿Cuál es tu señal de detección de malware más confiable?',
      },
      'PHISHING': {
        topic: 'campañas de phishing',
        incident: 'un intento de phishing',
        advice: {
          short: 'repórtalo y verifica las credenciales',
          medium: 'repórtalo, verifica que no se hayan comprometido credenciales y refuerza la capacitación',
          long: 'repórtalo, verifica las credenciales, refuerza la capacitación de usuarios y revisa los controles de seguridad del correo',
        },
        question: '¿Los usuarios saben cómo reportar phishing en tu organización?',
      },
      'RESEARCH': {
        topic: 'investigación en seguridad',
        incident: 'un hallazgo de investigación',
        advice: {
          short: 'revisa las implicaciones para tu entorno',
          medium: 'revisa las implicaciones, prueba los riesgos de la prueba de concepto y comparte con ingeniería',
          long: 'revisa las implicaciones para tu entorno, prueba los riesgos de la prueba de concepto, comparte con ingeniería y planifica mitigaciones',
        },
        question: '¿Cómo te mantienes al día con la investigación emergente?',
      },
      'POLICY': {
        topic: 'novedades políticas',
        incident: 'un cambio regulatorio',
        advice: {
          short: 'evalúa el impacto en tu gobernanza',
          medium: 'evalúa el impacto en la gobernanza, actualiza las políticas y comunícalas a los equipos',
          long: 'evalúa el impacto en la gobernanza, actualiza las políticas, comunícalas a los equipos y alinea los controles con los nuevos requisitos',
        },
        question: '¿Qué área de políticas necesita más atención en tu organización?',
      },
      'PRIVACY': {
        topic: 'prácticas de privacidad',
        incident: 'una preocupación de privacidad',
        advice: {
          short: 'revisa el manejo de datos y el consentimiento',
          medium: 'revisa el manejo de datos, los mecanismos de consentimiento y los procesos de derechos de los usuarios',
          long: 'revisa el manejo de datos, los mecanismos de consentimiento, los procesos de derechos de los usuarios y los acuerdos de compartición con terceros',
        },
        question: '¿Cómo equilibras la personalización con la privacidad?',
      },
      'ALERT': {
        topic: 'alertas de seguridad',
        incident: 'una alerta de seguridad',
        advice: {
          short: 'evalúa la gravedad y el alcance',
          medium: 'evalúa la gravedad, confirma el alcance y sigue las recomendaciones del proveedor',
          long: 'evalúa la gravedad, confirma el alcance, sigue las recomendaciones del proveedor y documenta las acciones de respuesta',
        },
        question: '¿Cómo evitas la fatiga de alertas?',
      },
      'EXPLOIT': {
        topic: 'actividad de explotación',
        incident: 'un exploit activo',
        advice: {
          short: 'verifica la exposición y aplica mitigaciones',
          medium: 'verifica la exposición, aplica mitigaciones y busca indicadores',
          long: 'verifica la exposición, aplica mitigaciones, busca indicadores y refina la cobertura de detección',
        },
        question: '¿Cuál es tu tiempo medio para mitigar un exploit conocido?',
      },
      'IOT': {
        topic: 'problemas de seguridad en IoT',
        incident: 'un problema de seguridad en IoT',
        advice: {
          short: 'inventaría los dispositivos y cambia las credenciales por defecto',
          medium: 'inventaría los dispositivos conectados, cambia las credenciales por defecto y segmenta la red',
          long: 'inventaría los dispositivos conectados, cambia las credenciales por defecto, segmenta la red y monitorea comportamientos anómalos',
        },
        question: '¿Cómo aseguras los dispositivos que no controlas del todo?',
      },
      'INDUSTRY': {
        topic: 'tendencias del sector',
        incident: 'un desarrollo del sector',
        advice: {
          short: 'evalúa la relevancia estratégica',
          medium: 'evalúa la relevancia estratégica, compara con los referentes del sector e informa a la dirección',
          long: 'evalúa la relevancia estratégica, compara con los referentes del sector, informa a la dirección y ajusta tu hoja de ruta',
        },
        question: '¿Qué cambio del sector reconfigurará tus prioridades?',
      },
      'AWARENESS': {
        topic: 'temas de concientización',
        incident: 'un momento de concientización',
        advice: {
          short: 'comparte un consejo práctico',
          medium: 'comparte consejos prácticos, lanza una campaña breve y mide la participación',
          long: 'comparte consejos prácticos, lanza campañas de concientización, mide la participación y refuerza los comportamientos con el tiempo',
        },
        question: '¿Qué hábito de seguridad cambió tu comportamiento?',
      },
      'SUPPLY CHAIN': {
        topic: 'riesgos de la cadena de suministro',
        incident: 'un riesgo en la cadena de suministro',
        advice: {
          short: 'revisa el acceso de proveedores y los inventarios de software',
          medium: 'revisa el acceso de proveedores, valida las SBOM y endurece las revisiones de adquisiciones',
          long: 'revisa el acceso de proveedores, valida las SBOM, endurece las revisiones de adquisiciones y monitorea los impactos downstream',
        },
        question: '¿Qué tan bien conoces a tus proveedores críticos?',
      },
      'AI SECURITY': {
        topic: 'consideraciones de seguridad en IA',
        incident: 'un desarrollo en seguridad de IA',
        advice: {
          short: 'revisa el uso de IA y sus salvaguardas',
          medium: 'revisa el uso de IA, la gobernanza de modelos y la validación de salidas',
          long: 'revisa el uso de IA, la gobernanza de modelos, la validación de salidas y los controles de fugas de datos',
        },
        question: '¿Qué riesgo de IA estás monitoreando más de cerca?',
      },
    };
    return contexts[category] ?? fallbackEs;
  }

  const contexts: Record<string, CategoryContext> = {
    'RANSOMWARE': {
      topic: 'ransomware attacks',
      incident: 'a ransomware attack',
      advice: {
        short: 'isolate affected systems and verify backups',
        medium: 'isolate affected systems, verify backup integrity, and alert your incident response team',
        long: 'isolate affected systems, verify backup integrity, engage your incident response team, and review business continuity plans',
      },
      question: 'How are you hardening your recovery posture against ransomware?',
    },
    'VULNERABILITY': {
      topic: 'software vulnerabilities',
      incident: 'a newly disclosed vulnerability',
      advice: {
        short: 'check exposure and prioritize patches',
        medium: 'assess exposure, prioritize patches, and test compensating controls',
        long: 'assess exposure across your estate, prioritize patches, test compensating controls, and communicate timelines to stakeholders',
      },
      question: 'What is your biggest patch-management challenge right now?',
    },
    'DATA BREACH': {
      topic: 'data breaches',
      incident: 'a data breach',
      advice: {
        short: 'confirm scope and notify affected parties',
        medium: 'confirm scope, secure evidence, and notify affected parties per regulations',
        long: 'confirm scope, preserve evidence, notify affected parties and regulators, and review data retention policies',
      },
      question: 'What controls would have made this breach harder?',
    },
    'THREAT INTEL': {
      topic: 'threat intelligence findings',
      incident: 'a threat actor campaign',
      advice: {
        short: 'compare IOCs with your telemetry',
        medium: 'compare IOCs against your telemetry, update detections, and brief analysts',
        long: 'compare IOCs against your telemetry, update detection rules, brief your analysts, and share relevant insights with partners',
      },
      question: 'How do you turn threat intel into action?',
    },
    'COMPLIANCE': {
      topic: 'compliance developments',
      incident: 'a regulatory requirement',
      advice: {
        short: 'map the requirement to your controls',
        medium: 'map the requirement to your controls, identify gaps, and assign owners',
        long: 'map the requirement to your controls, identify gaps, assign owners, and build a remediation roadmap',
      },
      question: 'Which compliance obligation keeps you busiest?',
    },
    'MALWARE': {
      topic: 'malware findings',
      incident: 'a malware infection',
      advice: {
        short: 'contain the host and hunt for persistence',
        medium: 'contain affected hosts, hunt for persistence, and reset credentials',
        long: 'contain affected hosts, hunt for persistence, reset compromised credentials, and improve execution controls',
      },
      question: 'What is your most reliable malware detection signal?',
    },
    'PHISHING': {
      topic: 'phishing campaigns',
      incident: 'a phishing attempt',
      advice: {
        short: 'report it and verify credentials',
        medium: 'report the attempt, verify no credentials were compromised, and reinforce training',
        long: 'report the attempt, verify credentials, reinforce user training, and review email security controls',
      },
      question: 'Do users know how to report phishing in your org?',
    },
    'RESEARCH': {
      topic: 'security research',
      incident: 'a research finding',
      advice: {
        short: 'review the implications for your stack',
        medium: 'review the implications, test proof-of-concept risks, and share with engineering',
        long: 'review implications for your stack, test proof-of-concept risks, share with engineering, and plan mitigations',
      },
      question: 'How do you stay current with emerging research?',
    },
    'POLICY': {
      topic: 'policy developments',
      incident: 'a policy change',
      advice: {
        short: 'assess impact on your governance',
        medium: 'assess impact on governance, update policies, and communicate to teams',
        long: 'assess impact on governance, update policies, communicate to teams, and align controls with new requirements',
      },
      question: 'What policy area needs the most attention in your organization?',
    },
    'PRIVACY': {
      topic: 'privacy practices',
      incident: 'a privacy concern',
      advice: {
        short: 'review data handling and consent',
        medium: 'review data handling, consent mechanisms, and user rights processes',
        long: 'review data handling, consent mechanisms, user rights processes, and third-party sharing agreements',
      },
      question: 'How do you balance personalization with privacy?',
    },
    'ALERT': {
      topic: 'security alerts',
      incident: 'a security advisory',
      advice: {
        short: 'triage severity and scope',
        medium: 'triage severity, confirm scope, and follow vendor guidance',
        long: 'triage severity, confirm scope, follow vendor guidance, and document response actions',
      },
      question: 'How do you avoid alert fatigue?',
    },
    'EXPLOIT': {
      topic: 'exploit activity',
      incident: 'an active exploit',
      advice: {
        short: 'check exposure and apply mitigations',
        medium: 'check exposure, apply mitigations, and hunt for indicators',
        long: 'check exposure, apply mitigations, hunt for indicators, and refine detection coverage',
      },
      question: 'What is your mean time to mitigate a known exploit?',
    },
    'IOT': {
      topic: 'IoT security issues',
      incident: 'an IoT security issue',
      advice: {
        short: 'inventory devices and change defaults',
        medium: 'inventory connected devices, change default credentials, and segment the network',
        long: 'inventory connected devices, change default credentials, segment the network, and monitor for anomalous behavior',
      },
      question: 'How do you secure devices you don\'t fully control?',
    },
    'INDUSTRY': {
      topic: 'industry trends',
      incident: 'an industry development',
      advice: {
        short: 'evaluate strategic relevance',
        medium: 'evaluate strategic relevance, benchmark against peers, and brief leadership',
        long: 'evaluate strategic relevance, benchmark against peers, brief leadership, and adjust your roadmap',
      },
      question: 'What industry shift will reshape your priorities?',
    },
    'AWARENESS': {
      topic: 'awareness topics',
      incident: 'an awareness moment',
      advice: {
        short: 'share one actionable tip',
        medium: 'share actionable tips, run a quick campaign, and measure engagement',
        long: 'share actionable tips, run awareness campaigns, measure engagement, and reinforce behaviors over time',
      },
      question: 'What security habit changed your behavior?',
    },
    'SUPPLY CHAIN': {
      topic: 'supply chain risks',
      incident: 'a supply chain risk',
      advice: {
        short: 'review vendor access and software bills',
        medium: 'review vendor access, validate SBOMs, and tighten procurement checks',
        long: 'review vendor access, validate SBOMs, tighten procurement checks, and monitor for downstream impacts',
      },
      question: 'How well do you know your critical vendors?',
    },
    'AI SECURITY': {
      topic: 'AI security considerations',
      incident: 'an AI security development',
      advice: {
        short: 'review AI usage and guardrails',
        medium: 'review AI usage, model governance, and output validation',
        long: 'review AI usage, model governance, output validation, and data leakage controls',
      },
      question: 'What AI risk are you tracking most closely?',
    },
  };
  return contexts[category] ?? fallbackEn;
}

function newsAnalysisTemplate(a: NewsArticle, tone: Tone, wc: string, lang: Language): string {
  const ctx = categoryContext(a.category, lang);

  if (lang === 'es') {
    const intro = baseTone(tone, `Un desarrollo significativo en ${ctx.topic} está causando impacto en la comunidad de seguridad.`, lang);
    const body = baseTone(tone, `${a.title}. ${a.summary}`, lang);
    const bullets = [
      `Este desarrollo pone de relieve los puntos débiles persistentes en ${ctx.topic}`,
      `Las organizaciones con enfoques heredados siguen siendo las más expuestas`,
      `Las implicaciones de este desarrollo para ${ctx.topic} subrayan la necesidad de una inversión proactiva en seguridad`,
    ];
    const takeaway = baseTone(tone, `Conclusión: ${ctx.advice[wc as Length]}.`, lang);

    if (wc === 'short') {
      return `${intro}\n\n${body}\n\n${takeaway}\n\n${hashtags(a, lang)}`;
    }

    const fullBullets = bullets.map((b) => `→ ${baseTone(tone, b, lang)}`).join('\n');

    if (wc === 'medium') {
      return `${intro}\n\n${body}\n\n${fullBullets}\n\n${takeaway}\n\n${hashtags(a, lang)}`;
    }

    return `${intro}\n\n${body}\n\nObservaciones clave:\n${fullBullets}\n\n${takeaway}\n\n${ctx.question}\n\n${hashtags(a, lang)}`;
  }

  const intro = baseTone(tone, `A significant development in ${ctx.topic} is making waves across the security community.`, lang);
  const body = baseTone(tone, `${a.title}. ${a.summary}`, lang);
  const bullets = [
    `This development highlights persistent weaknesses in ${ctx.topic}`,
    `Organizations with legacy approaches remain most exposed`,
    `The implications of this development for ${ctx.topic} underscore the need for proactive security investment`,
  ];
  const takeaway = baseTone(tone, `The bottom line: ${ctx.advice[wc as Length]}.`, lang);

  if (wc === 'short') {
    return `${intro}\n\n${body}\n\n${takeaway}\n\n${hashtags(a, lang)}`;
  }

  const fullBullets = bullets.map((b) => `→ ${baseTone(tone, b, lang)}`).join('\n');

  if (wc === 'medium') {
    return `${intro}\n\n${body}\n\n${fullBullets}\n\n${takeaway}\n\n${hashtags(a, lang)}`;
  }

  return `${intro}\n\n${body}\n\nKey observations:\n${fullBullets}\n\n${takeaway}\n\n${ctx.question}\n\n${hashtags(a, lang)}`;
}

function quickSummaryTemplate(a: NewsArticle, tone: Tone, wc: string, lang: Language): string {
  const ctx = categoryContext(a.category, lang);

  if (lang === 'es') {
    const header = tone === 'Casual' ? `Actualización rápida sobre ${a.category.toLowerCase()}:` : `${a.category} — Actualización Rápida`;
    const bullets = [
      `Qué: ${a.title}`,
      `Impacto: ${a.summary.slice(0, 120)}...`,
      `Acción: ${ctx.advice.short}`,
    ];
    if (wc === 'short') {
      return `${header}\n\n${bullets.slice(0, 2).map((b) => `→ ${b}`).join('\n')}\n\n${hashtags(a, lang)}`;
    }
    if (wc === 'medium') {
      return `${header}\n\n${bullets.map((b) => `→ ${b}`).join('\n')}\n\nConclusión clave: ${ctx.advice.medium}.\n\n${hashtags(a, lang)}`;
    }
    return `${header}\n\n${bullets.map((b) => `→ ${b}`).join('\n')}\n\n${baseTone(tone, `Conclusión: ${ctx.advice.long}.`, lang)}\n\n${hashtags(a, lang)}`;
  }

  const header = tone === 'Casual' ? `Quick update on ${a.category.toLowerCase()}:` : `${a.category} — Quick Update`;
  const bullets = [
    `What: ${a.title}`,
    `Impact: ${a.summary.slice(0, 120)}...`,
    `Action: ${ctx.advice.short}`,
  ];
  if (wc === 'short') {
    return `${header}\n\n${bullets.slice(0, 2).map((b) => `→ ${b}`).join('\n')}\n\n${hashtags(a, lang)}`;
  }
  if (wc === 'medium') {
    return `${header}\n\n${bullets.map((b) => `→ ${b}`).join('\n')}\n\nKey takeaway: ${ctx.advice.medium}.\n\n${hashtags(a, lang)}`;
  }
  return `${header}\n\n${bullets.map((b) => `→ ${b}`).join('\n')}\n\n${baseTone(tone, `Bottom line: ${ctx.advice.long}.`, lang)}\n\n${hashtags(a, lang)}`;
}

function threadTemplate(a: NewsArticle, tone: Tone, wc: string, lang: Language): string {
  const ctx = categoryContext(a.category, lang);
  const slides = wc === 'short' ? 2 : wc === 'medium' ? 3 : 4;

  const formatAdvice = (text: string) =>
    text
      .split(', ')
      .map((step) => step.replace(/^(and|y)\s+/i, ''))
      .map((step) => `→ ${step.charAt(0).toUpperCase() + step.slice(1)}`)
      .join('\n');

  if (lang === 'es') {
    const lines: string[] = [`1️⃣ ${a.title}\n`];
    lines.push(`${a.summary.slice(0, 200)}...\n`);
    if (slides >= 3) {
      lines.push(baseTone(tone, `3️⃣ ¿Qué hacer?\n${formatAdvice(ctx.advice.medium)}\n`, lang));
    }
    if (slides >= 4) {
      lines.push(`4️⃣ ${baseTone(tone, `Conclusión: ${ctx.advice.long}. ${ctx.question}`, lang)}\n`);
    }
    return lines.join('\n') + `\n${hashtags(a, lang)}`;
  }

  const lines: string[] = [`1️⃣ ${a.title}\n`];
  lines.push(`${a.summary.slice(0, 200)}...\n`);
  if (slides >= 3) {
    lines.push(baseTone(tone, `3️⃣ What should you do?\n${formatAdvice(ctx.advice.medium)}\n`, lang));
  }
  if (slides >= 4) {
    lines.push(`4️⃣ ${baseTone(tone, `Bottom line: ${ctx.advice.long}. ${ctx.question}`, lang)}\n`);
  }
  return lines.join('\n') + `\n${hashtags(a, lang)}`;
}

function contrarianTemplate(a: NewsArticle, tone: Tone, wc: string, lang: Language): string {
  const ctx = categoryContext(a.category, lang);

  if (lang === 'es') {
    const challenge = baseTone(tone, `Todo el mundo habla de ${a.title.toLowerCase()}, pero aquí está lo que la mayoría está entendiendo mal.`, lang);
    const reframe = baseTone(tone, `La narrativa se centra en la reacción inmediata, pero la historia real trata sobre ${ctx.topic} — y si lo estamos abordando estratégicamente. ${a.summary}`, lang);
    const dataPoint = tone === 'Thought Leadership'
      ? 'La investigación muestra que el 68% de las organizaciones tienen dificultades para convertir prioridades de seguridad en acción operativa.'
      : 'La mayoría de organizaciones aún reaccionan a los titulares en lugar de construir proactivamente su hoja de ruta de seguridad.';
    const call = wc === 'short'
      ? `${ctx.question}`
      : `Necesitamos dejar de tratar ${ctx.topic} como una casilla de verificación y empezar a integrar la seguridad en nuestro ADN operativo.\n\n${ctx.question}`;

    if (wc === 'short') {
      return `${challenge}\n\n${reframe}\n\n${call}\n\n${hashtags(a, lang)}`;
    }

    return `${challenge}\n\n${reframe}\n\n${dataPoint}\n\n${call}\n\n${hashtags(a, lang)}`;
  }

  const challenge = baseTone(tone, `Everyone is talking about ${a.title.toLowerCase()}, but here's what most are getting wrong.`, lang);
  const reframe = baseTone(tone, `The narrative focuses on the immediate reaction, but the real story is about ${ctx.topic} — and whether we're thinking about it strategically. ${a.summary}`, lang);
  const dataPoint = tone === 'Thought Leadership'
    ? 'Research shows 68% of organizations struggle to translate security priorities into operational action.'
    : 'Most organizations still react to headlines instead of shaping their security roadmap proactively.';
  const call = wc === 'short'
    ? `${ctx.question}`
    : `We need to stop treating ${ctx.topic} as a checkbox and start building security into our operational DNA.\n\n${ctx.question}`;

  if (wc === 'short') {
    return `${challenge}\n\n${reframe}\n\n${call}\n\n${hashtags(a, lang)}`;
  }

  return `${challenge}\n\n${reframe}\n\n${dataPoint}\n\n${call}\n\n${hashtags(a, lang)}`;
}

function storytellingTemplate(a: NewsArticle, tone: Tone, wc: string, lang: Language): string {
  const ctx = categoryContext(a.category, lang);

  if (lang === 'es') {
    const open = tone === 'Casual'
      ? `Recuerdo la primera vez que tuve que lidiar con ${ctx.incident}...`
      : `Al principio de mi carrera, aprendí una dura lección sobre ${ctx.topic}.`;
    const connect = `Cuando leí sobre ${a.title.toLowerCase()}, me transportó de vuelta.`;
    const lesson = baseTone(tone, a.summary, lang);
    const close = wc === 'short'
      ? `Manténgase atento.`
      : wc === 'medium'
      ? `El panorama ha cambiado, pero los fundamentos no: ${ctx.advice.medium}.`
      : `El panorama ha cambiado drásticamente, pero los fundamentos permanecen: ${ctx.advice.long}. ${baseTone(tone, 'Este último desarrollo es un recordatorio de que la seguridad es un viaje, no un destino.', lang)}`;

    if (wc === 'short') {
      return `${open}\n${connect}\n\n${lesson}\n\n${close}\n\n${hashtags(a, lang)}`;
    }
    return `${open}\n${connect}\n\n${lesson}\n\n${close}\n\n${ctx.question}\n\n${hashtags(a, lang)}`;
  }

  const open = tone === 'Casual'
    ? `I remember the first time I had to deal with ${ctx.incident}...`
    : `Early in my career, I learned a hard lesson about ${ctx.topic}.`;
  const connect = `When I read about ${a.title.toLowerCase()}, it brought me right back.`;
  const lesson = baseTone(tone, a.summary, lang);
  const close = wc === 'short'
    ? `Stay thoughtful.`
    : wc === 'medium'
    ? `The landscape has changed, but the fundamentals haven't: ${ctx.advice.medium}.`
    : `The landscape has changed dramatically, but the fundamentals remain: ${ctx.advice.long}. ${baseTone(tone, 'This latest development is a reminder that security is a journey, not a destination.', lang)}`;

  if (wc === 'short') {
    return `${open}\n${connect}\n\n${lesson}\n\n${close}\n\n${hashtags(a, lang)}`;
  }
  return `${open}\n${connect}\n\n${lesson}\n\n${close}\n\n${ctx.question}\n\n${hashtags(a, lang)}`;
}

/* ------------------------------------------------------------------ */
/*  Daily Digest — Multi-article roundup                               */
/* ------------------------------------------------------------------ */

function generateDailyDigestPost(articles: NewsArticle[], tone: Tone, length: Length, lang: Language): string {
  const wc = length === 'short' ? 'short' : length === 'medium' ? 'medium' : 'long';
  const maxArticles = wc === 'short' ? 3 : wc === 'medium' ? 5 : 7;
  const selected = articles.slice(0, maxArticles);

  const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  if (lang === 'es') {
    const intros: Record<Tone, string> = {
      'Professional': `🔒 Resumen de Ciberseguridad — ${dateStr}\n\nAquí están las historias de seguridad más importantes que necesita conocer hoy:`,
      'Casual': `☕ ${dateStr} — Su resumen diario de ciberseguridad:\n\nEsto es lo que está causando revuelo en infosec hoy:`,
      'Urgent': `🚨 ALERTAS DE SEGURIDAD — ${dateStr.toUpperCase()}\n\nMúltiples incidentes críticos requieren su atención hoy:`,
      'Educational': `📚 Resumen Diario de Ciberseguridad — ${dateStr}\n\nLos desarrollos de hoy en el panorama de seguridad:`,
      'Thought Leadership': `🎯 La Visión Global — ${dateStr}\n\nDesarrollos estratégicos de seguridad que están dando forma a la industria hoy:`,
    };

    const closings: Record<Tone, string> = {
      'Professional': `Manténgase informado. Manténgase seguro.\n\n¿Cuál de estas historias impacta más a su organización? Hágame saber abajo.`,
      'Casual': `¡Ese es el resumen! ¿Alguna de estas le quita el sueño? 😅 Hágame saber en los comentarios.`,
      'Urgent': `Actúe ahora. Revise sus defensas. Comparta esto con su equipo de seguridad.\n\n¿Qué amenaza le preocupa más?`,
      'Educational': `Comprender el panorama de amenazas es el primer paso hacia la resiliencia.\n\n¿Sobre qué tema le gustaría que profundizara?`,
      'Thought Leadership': `El hilo que conecta todas estas: la inversión proactiva en seguridad da dividendos cuando los incidentes ocurren.\n\n¿Cuál es su prioridad estratégica este trimestre?`,
    };

    const severityEmoji: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };

    let body = '';
    selected.forEach((a, i) => {
      const num = i + 1;
      const emoji = severityEmoji[a.severity] || '⚪';
      const title = baseTone(tone, a.title, lang);
      const summary = wc === 'short'
        ? ''
        : wc === 'medium'
        ? `\n${baseTone(tone, a.summary.slice(0, 140), lang)}...`
        : `\n${baseTone(tone, a.summary, lang)}`;
      const link = `\n🔗 Leer más: ${a.url}`;

      body += `${num}. ${emoji} ${title}${summary}${link}\n\n`;
    });

    const hashtagsLine = `#ciberseguridad #infoseguridad #noticiasdiarias #inteligenciadeamenazas`;

    return `${intros[tone]}\n\n${body}${closings[tone]}\n\n---\n${hashtagsLine}`;
  }

  const intros: Record<Tone, string> = {
    'Professional': `🔒 Cybersecurity Roundup — ${dateStr}\n\nHere are the most significant security stories you need to know about today:`,
    'Casual': `☕ ${dateStr} — Your daily cybersecurity catch-up:\n\nHere's what's making waves in infosec today:`,
    'Urgent': `🚨 SECURITY ALERTS — ${dateStr.toUpperCase()}\n\nMultiple critical incidents require your attention today:`,
    'Educational': `📚 Cybersecurity Daily Brief — ${dateStr}\n\nToday's developments across the security landscape:`,
    'Thought Leadership': `🎯 The Big Picture — ${dateStr}\n\nStrategic security developments shaping the industry today:`,
  };

  const closings: Record<Tone, string> = {
    'Professional': `Stay informed. Stay secure.\n\nWhich of these stories impacts your organization the most? Let me know below.`,
    'Casual': `That's the rundown! Any of these keeping you up at night? 😅 Let me know in the comments.`,
    'Urgent': `Act now. Review your defenses. Share this with your security team.\n\nWhich threat concerns you most?`,
    'Educational': `Understanding the threat landscape is the first step toward resilience.\n\nWhat topic would you like me to dive deeper into?`,
    'Thought Leadership': `The thread connecting all of these: proactive investment in security pays dividends when incidents strike.\n\nWhat's your strategic priority this quarter?`,
  };

  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };

  let body = '';
  selected.forEach((a, i) => {
    const num = i + 1;
    const emoji = severityEmoji[a.severity] || '⚪';
    const title = baseTone(tone, a.title, lang);
    const summary = wc === 'short'
      ? ''
      : wc === 'medium'
      ? `\n${baseTone(tone, a.summary.slice(0, 140), lang)}...`
      : `\n${baseTone(tone, a.summary, lang)}`;
    const link = `\n🔗 Read more: ${a.url}`;

    body += `${num}. ${emoji} ${title}${summary}${link}\n\n`;
  });

  const hashtagsLine = `#cybersecurity #infosec #dailynews #threatintel`;

  return `${intros[tone]}\n\n${body}${closings[tone]}\n\n---\n${hashtagsLine}`;
}

/* ------------------------------------------------------------------ */
/*  Toast Component                                                    */
/* ------------------------------------------------------------------ */

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast.visible) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast.visible, onDismiss]);

  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
          className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg border border-[#222222] bg-[#181818] px-4 py-3 shadow-lg"
        >
          {toast.type === 'success' ? (
            <Check size={16} className="text-[#CCFF00] shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-[#EF4444] shrink-0" />
          )}
          <span className="text-sm font-inter text-[#E5E5E5]">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  LinkedIn Preview                                                   */
/* ------------------------------------------------------------------ */

function LinkedInPreview({ content, lang }: { content: string; lang: Language }) {
  const labels = getLabels(lang);
  const truncated = content.length > 210 ? content.slice(0, 210) + '...' : content;
  const seeMore = content.length > 210;

  return (
    <div className="rounded-lg overflow-hidden border border-[#E5E5E5] bg-white">
      {/* Post Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[#0A0A0A] font-semibold text-base"
          style={{
            background: 'linear-gradient(135deg, #CCFF00 0%, #008F6B 100%)',
          }}
        >
          AC
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[14px] text-[#1F1F1F] font-inter">Alex Chen</span>
          </div>
          <p className="text-[12px] text-[#666666] font-inter leading-tight">
            Cybersecurity Analyst | CISSP | Cloud Security
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[12px] text-[#666666] font-inter">
              {lang === 'es' ? 'Justo ahora' : 'Just now'}
            </span>
            <span className="text-[#666666]">·</span>
            <Globe size={12} className="text-[#666666]" />
          </div>
        </div>
      </div>

      {/* Post Body */}
      <div className="px-4 pb-3">
        <p className="text-[14px] leading-[1.5] text-[#1F1F1F] font-[system-ui] whitespace-pre-wrap">
          {truncated}
          {seeMore && (
            <span className="text-[#0A66C2] font-medium cursor-pointer">
              {lang === 'es' ? ' ...ver más' : ' ...see more'}
            </span>
          )}
        </p>
      </div>

      {/* Footer Icons */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#E5E5E5]">
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <ThumbsUp size={20} />
          <span className="text-[12px] font-inter">{labels.like}</span>
        </button>
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <MessageCircle size={20} />
          <span className="text-[12px] font-inter">{labels.comment}</span>
        </button>
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <Repeat2 size={20} />
          <span className="text-[12px] font-inter">{labels.repost}</span>
        </button>
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <Send size={20} />
          <span className="text-[12px] font-inter">{labels.send}</span>
        </button>
      </div>

      {/* Engagement Bar */}
      <div className="bg-[#F3F2EF] px-4 py-2.5">
        <p className="text-[12px] text-[#666666] font-inter">
          5 {labels.reactions} · 12 {labels.comments}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Carousel Preview                                                   */
/* ------------------------------------------------------------------ */

function CarouselPreview({ content, lang }: { content: string; lang: Language }) {
  const slides = splitIntoSlides(content);
  const [currentIndex, setCurrentIndex] = useState(0);
  const labels = getLabels(lang);

  const goToPrev = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));

  return (
    <div className="rounded-lg overflow-hidden border border-[#E5E5E5] bg-[#F3F2EF]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E5] flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[#0A0A0A] font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #CCFF00 0%, #008F6B 100%)',
          }}
        >
          AC
        </div>
        <div>
          <div className="font-semibold text-[13px] text-[#1F1F1F] font-inter">Alex Chen</div>
          <div className="text-[11px] text-[#666666] font-inter">
            {lang === 'es' ? 'Documento de LinkedIn' : 'LinkedIn Document'}
          </div>
        </div>
      </div>

      {/* Slide Viewer */}
      <div className="relative px-4 py-4">
        <div className="bg-white rounded-lg border border-[#E5E5E5] min-h-[240px] flex flex-col">
          {/* Slide header */}
          <div className="px-4 py-2 border-b border-[#E5E5E5] flex items-center justify-between">
            <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
              {lang === 'es' ? 'Diapositiva' : 'Slide'} {currentIndex + 1}/{slides.length}
            </span>
          </div>

          {/* Slide content */}
          <div className="flex-1 px-4 py-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
                className="text-[14px] leading-[1.6] text-[#1F1F1F] font-[system-ui] whitespace-pre-wrap"
              >
                {slides[currentIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows inside the card */}
          {slides.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#666666] hover:text-[#0A66C2] transition-colors z-10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center text-[#666666] hover:text-[#0A66C2] transition-colors z-10"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-[#0A66C2]' : 'bg-[#BDBDBD]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Icons */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#E5E5E5]">
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <ThumbsUp size={20} />
          <span className="text-[12px] font-inter">{labels.like}</span>
        </button>
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <MessageCircle size={20} />
          <span className="text-[12px] font-inter">{labels.comment}</span>
        </button>
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <Repeat2 size={20} />
          <span className="text-[12px] font-inter">{labels.repost}</span>
        </button>
        <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#0A66C2] transition-colors">
          <Send size={20} />
          <span className="text-[12px] font-inter">{labels.send}</span>
        </button>
      </div>

      {/* Engagement Bar */}
      <div className="bg-[#F3F2EF] px-4 py-2.5">
        <p className="text-[12px] text-[#666666] font-inter">
          5 {labels.reactions} · 12 {labels.comments}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Schedule Panel                                                     */
/* ------------------------------------------------------------------ */

function SchedulePanel({
  content,
  sourceTitle,
  format,
  tone,
  lang,
}: {
  content: string;
  sourceTitle: string;
  format: string;
  tone: string;
  lang: Language;
}) {
  const labels = getLabels(lang);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(() => {
    try {
      const saved = localStorage.getItem('cyberpulse_scheduled');
      return saved ? (JSON.parse(saved) as ScheduledPost[]) : [];
    } catch {
      return [];
    }
  });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const saveToStorage = (posts: ScheduledPost[]) => {
    localStorage.setItem('cyberpulse_scheduled', JSON.stringify(posts));
    setScheduledPosts(posts);
  };

  const handleSchedule = () => {
    if (!date || !time || !content) return;
    const scheduledFor = new Date(`${date}T${time}`).toISOString();
    const newPost: ScheduledPost = {
      id: crypto.randomUUID(),
      content,
      scheduledFor,
      createdAt: new Date().toISOString(),
      sourceTitle,
      format,
      tone,
      language: lang,
    };
    const updated = [newPost, ...scheduledPosts];
    saveToStorage(updated);
  };

  const handleDelete = (id: string) => {
    const updated = scheduledPosts.filter((p) => p.id !== id);
    saveToStorage(updated);
  };

  const setQuickTime = (type: 'now' | 'tomorrow9' | 'tomorrow12' | 'best') => {
    const now = new Date();
    switch (type) {
      case 'now': {
        setDate(now.toISOString().split('T')[0]);
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${mins}`);
        break;
      }
      case 'tomorrow9': {
        const t9 = new Date(now);
        t9.setDate(t9.getDate() + 1);
        t9.setHours(9, 0, 0, 0);
        setDate(t9.toISOString().split('T')[0]);
        setTime('09:00');
        break;
      }
      case 'tomorrow12': {
        const t12 = new Date(now);
        t12.setDate(t12.getDate() + 1);
        t12.setHours(12, 0, 0, 0);
        setDate(t12.toISOString().split('T')[0]);
        setTime('12:00');
        break;
      }
      case 'best': {
        const best = new Date(now);
        best.setDate(best.getDate() + 1);
        best.setHours(8, 30, 0, 0);
        setDate(best.toISOString().split('T')[0]);
        setTime('08:30');
        break;
      }
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-6 bg-[#111111] border border-[#222222] rounded-xl p-5">
      <h3 className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-4">
        {labels.schedulePost}
      </h3>

      {/* Date and Time inputs */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-1.5">
            {labels.date}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#222222] text-[#E5E5E5] font-inter text-sm rounded-lg h-10 px-3 hover:border-[#555555] transition-colors outline-none focus:border-[#CCFF00]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-1.5">
            {labels.time}
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#222222] text-[#E5E5E5] font-inter text-sm rounded-lg h-10 px-3 hover:border-[#555555] transition-colors outline-none focus:border-[#CCFF00]"
          />
        </div>
      </div>

      {/* Quick buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { type: 'now' as const, label: labels.now },
          { type: 'tomorrow9' as const, label: labels.tomorrow9 },
          { type: 'tomorrow12' as const, label: labels.tomorrow12 },
          { type: 'best' as const, label: labels.bestTime },
        ]).map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setQuickTime(type)}
            className="px-3 py-1.5 text-[11px] font-inter font-medium text-[#808080] bg-[#1A1A1A] border border-[#222222] rounded-button hover:border-[#555555] hover:text-[#E5E5E5] transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Schedule button */}
      <Button
        onClick={handleSchedule}
        disabled={!date || !time || !content}
        className="w-full bg-[#CCFF00] text-[#0A0A0A] hover:brightness-110 font-inter text-sm font-semibold rounded-button h-10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Clock size={16} />
        {labels.scheduleBtn}
      </Button>

      {/* Scheduled posts list */}
      {scheduledPosts.length > 0 && (
        <div className="mt-5 border-t border-[#222222] pt-4">
          <h4 className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-3">
            {labels.scheduledPosts}
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222222] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-inter text-[#E5E5E5] truncate">
                    {post.sourceTitle}
                  </p>
                  <p className="text-[11px] font-inter text-[#808080]">
                    {formatDate(post.scheduledFor)} · {post.format} · {post.language.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="shrink-0 p-1.5 text-[#666666] hover:text-[#EF4444] transition-colors rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduledPosts.length === 0 && (
        <p className="mt-4 text-[12px] font-inter text-[#555555] text-center">
          {labels.noScheduled}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface GeneratePostTabProps {
  articles: NewsArticle[];
  selectedArticleId: string | null;
  onBackToNewsFeed: () => void;
}

export default function GeneratePostTab({ articles, selectedArticleId: propArticleId, onBackToNewsFeed }: GeneratePostTabProps) {
  /* Guard: no articles */
  if (!articles || articles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary text-sm font-inter font-medium">
          No articles available. Go back to News Feed to load articles.
        </p>
        <button
          onClick={onBackToNewsFeed}
          className="px-4 py-2 bg-accent text-[#0A0A0A] font-inter text-sm font-semibold rounded-button hover:brightness-110 transition-all cursor-pointer"
        >
          Go to News Feed
        </button>
      </div>
    );
  }

  /* State */
  const [selectedArticleId, setSelectedArticleId] = useState<string>(propArticleId ?? articles[0].id);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>(articles.slice(0, 5).map((a) => a.id));
  const [tone, setTone] = useState<Tone>('Professional');
  const [format, setFormat] = useState<Format>('News Analysis');
  const [length, setLength] = useState<Length>('medium');
  const [language, setLanguage] = useState<Language>('en');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiFallback, setAiFallback] = useState(false);
  const [toast, setToast] = useState<Toast>({ message: '', type: 'success', visible: false });

  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [linkedinVisibility, setLinkedinVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Sync selected article from News Feed */
  useEffect(() => {
    if (propArticleId && articles.some((a) => a.id === propArticleId)) {
      setSelectedArticleId(propArticleId);
    }
  }, [propArticleId, articles]);

  /* Sync articles for Daily Digest when articles change */
  useEffect(() => {
    setSelectedArticleIds((prev) => {
      const valid = prev.filter((id) => articles.some((a) => a.id === id));
      if (valid.length === 0) return articles.slice(0, 5).map((a) => a.id);
      return valid;
    });
  }, [articles]);

  /* Check LinkedIn connection status */
  useEffect(() => {
    getLinkedInStatus()
      .then((status) => setLinkedinConnected(status.connected))
      .catch(() => setLinkedinConnected(false));
  }, []);

  /* Refresh LinkedIn status after publishing or OAuth */
  const refreshLinkedInStatus = useCallback(async () => {
    try {
      const status = await getLinkedInStatus();
      setLinkedinConnected(status.connected);
    } catch {
      setLinkedinConnected(false);
    }
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'linkedin-oauth') {
        refreshLinkedInStatus();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [refreshLinkedInStatus]);

  const selectedArticle = articles.find((a) => a.id === selectedArticleId) ?? articles[0];
  const isDailyDigest = format === 'Daily Digest';
  const isThread = format === 'Thread';
  const labels = getLabels(language);

  /* Toast helper */
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  }, []);

  const dismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  /* Generate */
  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setHasGenerated(false);
    setGeneratedContent('');
    setAiFallback(false);

    const runLocal = () => {
      let post: string;
      if (isDailyDigest) {
        const digestArticles = articles.filter((a) => selectedArticleIds.includes(a.id));
        post = generateDailyDigestPost(digestArticles, tone, length, language);
      } else {
        post = generateMockPost(selectedArticle, tone, format as Exclude<Format, 'Daily Digest'>, length, language);
      }
      setGeneratedContent(post);
      setIsGenerating(false);
      setHasGenerated(true);
      showToast(language === 'es' ? 'Publicación generada (plantillas locales)' : 'Post generated from local templates');
    };

    const tryAi = async () => {
      if (isDailyDigest) return false;

      const settings = getAiSettings();
      if (!settings.apiKey.trim()) return false;

      try {
        const params: GenerateAiPostParams = {
          title: selectedArticle.title,
          summary: selectedArticle.summary,
          source: selectedArticle.source,
          category: selectedArticle.category,
          severity: selectedArticle.severity,
          url: selectedArticle.url,
          tone,
          format,
          length,
          language,
          apiKey: settings.apiKey,
          model: settings.model,
          baseUrl: settings.baseUrl,
        };

        const post = await generateAiPost(params);
        setGeneratedContent(post);
        setIsGenerating(false);
        setHasGenerated(true);
        showToast(language === 'es' ? 'Publicación generada con IA' : 'AI post generated');
        return true;
      } catch {
        setAiFallback(true);
        return false;
      }
    };

    void tryAi().then((success) => {
      if (!success) {
        runLocal();
      }
    });
  }, [selectedArticle, tone, format, length, language, showToast, isDailyDigest, selectedArticleIds]);

  /* Regenerate */
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  /* Copy - with rich text formatting for LinkedIn */
  const handleCopy = useCallback(async () => {
    if (!generatedContent) return;
    try {
      // Convert **bold** to <strong>bold</strong> for rich text pasting
      const htmlContent = generatedContent
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');

      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([generatedContent.replace(/\*\*(.+?)\*\*/g, '$1')], { type: 'text/plain' });

      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([item]);
      setCopied(true);
      showToast(language === 'es' ? 'Copiado con formato' : 'Copied with formatting');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy plain text only
      try {
        await navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        showToast(language === 'es' ? 'Copiado (sin formato)' : 'Copied (plain text)');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        showToast(language === 'es' ? 'Error al copiar' : 'Failed to copy', 'error');
      }
    }
  }, [generatedContent, showToast, language]);

  /* Save */
  const handleSave = useCallback(() => {
    if (!generatedContent) return;
    const title = generatedContent.split('\n')[0].slice(0, 100);

    const sourceTitle = isDailyDigest
      ? `${selectedArticleIds.length} articles — Daily Digest`
      : selectedArticle.title;
    const sourceUrl = isDailyDigest
      ? ''
      : selectedArticle.url;

    const post: SavedPost = {
      id: crypto.randomUUID(),
      title,
      content: generatedContent,
      sourceArticleTitle: sourceTitle,
      sourceArticleUrl: sourceUrl,
      tone,
      format,
      length,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('cyberpulse_history') || '[]') as SavedPost[];
      existing.unshift(post);
      localStorage.setItem('cyberpulse_history', JSON.stringify(existing));
      showToast(language === 'es' ? 'Publicación guardada' : 'Post saved');
    } catch {
      showToast(language === 'es' ? 'Error al guardar' : 'Failed to save', 'error');
    }
  }, [generatedContent, selectedArticle, tone, format, length, showToast, isDailyDigest, selectedArticleIds, language]);

  /* Publish to LinkedIn */
  const handlePublishToLinkedIn = useCallback(async () => {
    if (!generatedContent) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      await publishToLinkedIn(generatedContent, linkedinVisibility);
      setPublishResult({
        success: true,
        message: language === 'es' ? 'Publicado en LinkedIn' : 'Posted to LinkedIn',
      });
      showToast(language === 'es' ? 'Publicado en LinkedIn' : 'Posted to LinkedIn');
    } catch (err: any) {
      setPublishResult({
        success: false,
        message: err?.message || (language === 'es' ? 'Error al publicar en LinkedIn' : 'Failed to post to LinkedIn'),
      });
      showToast(err?.message || (language === 'es' ? 'Error al publicar en LinkedIn' : 'Failed to post to LinkedIn'), 'error');
    } finally {
      setPublishing(false);
    }
  }, [generatedContent, linkedinVisibility, language, showToast]);

  /* Section header style */
  const SectionHeader = ({ label }: { label: string }) => (
    <h3 className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-4">
      {label}
    </h3>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0">
      <ToastNotification toast={toast} onDismiss={dismissToast} />

      {/* ============ LEFT COLUMN ============ */}
      <div className="w-full lg:w-1/2 lg:border-r border-[#222222] pr-0 lg:pr-6 pb-6 lg:pb-0 overflow-y-auto">
        <SectionHeader label={labels.sourceArticle} />

        {/* Single Article Selector (non-Daily Digest) */}
        {!isDailyDigest && (
          <div className="mb-4">
            <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
              <SelectTrigger className="w-full bg-[#1A1A1A] border-[#222222] text-[#E5E5E5] font-inter text-sm rounded-lg h-10 hover:border-[#555555] transition-colors [&>svg]:text-[#555555]">
                <SelectValue placeholder="Select an article" />
              </SelectTrigger>
              <SelectContent className="bg-[#181818] border-[#222222] rounded-lg">
                {articles.map((article) => (
                  <SelectItem
                    key={article.id}
                    value={article.id}
                    className="text-[#E5E5E5] font-inter text-sm focus:bg-[rgba(204,255,0,0.1)] focus:text-[#E5E5E5] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${severityColor(article.severity)}`} />
                      <span className="truncate max-w-[380px]">{article.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Multi-article selector (Daily Digest mode) */}
        {isDailyDigest && (
          <div className="mb-4 bg-[#111111] border border-[#222222] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222222] flex items-center justify-between">
              <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
                {labels.selectArticles}
              </span>
              <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#CCFF00]">
                {selectedArticleIds.length} {labels.selected}
              </span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {articles.map((article) => {
                const isSelected = selectedArticleIds.includes(article.id);
                return (
                  <label
                    key={article.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-[#1A1A1A] transition-all duration-200 hover:bg-[#181818] ${isSelected ? 'bg-[rgba(204,255,0,0.05)]' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedArticleIds((prev) => [...prev, article.id]);
                        } else {
                          setSelectedArticleIds((prev) => prev.filter((id) => id !== article.id));
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded border-[#222222] bg-[#1A1A1A] text-[#CCFF00] accent-[#CCFF00] cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${severityColor(article.severity)}`} />
                        <span className="text-[10px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
                          {article.source}
                        </span>
                      </div>
                      <p className="text-[13px] font-inter text-[#E5E5E5] leading-[1.4] line-clamp-2">
                        {article.title}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Article Preview Card (single article mode only) */}
        {!isDailyDigest && (
          <motion.div
            key={selectedArticle.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="bg-[#111111] border border-[#222222] rounded-xl p-5"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${severityColor(selectedArticle.severity)}`} />
                <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
                  {selectedArticle.source}
                </span>
              </div>
              <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
                {timeAgo(selectedArticle.publishedAt)}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-[18px] font-semibold font-inter text-[#E5E5E5] leading-[1.3] mb-3">
              {selectedArticle.title}
            </h2>

            {/* Summary */}
            <p className="text-[14px] font-inter text-[#808080] leading-[1.5] mb-4">
              {selectedArticle.summary}
            </p>

            {/* Footer row */}
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-1 text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#CCFF00] bg-[rgba(204,255,0,0.1)] rounded-pill">
                {selectedArticle.category}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
                <FileText size={12} />
                {selectedArticle.readTime}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            className="text-[#CCFF00] hover:bg-[rgba(204,255,0,0.1)] font-inter text-sm font-medium px-4 py-2 h-auto rounded-button cursor-pointer"
            onClick={onBackToNewsFeed}
          >
            <ArrowLeft size={16} />
            {labels.backToNews}
          </Button>
          {!isDailyDigest && (
            <Button
              variant="outline"
              className="border-[#222222] text-[#E5E5E5] hover:bg-[#181818] hover:border-[#808080] font-inter text-sm font-medium px-4 py-2 h-auto rounded-button bg-transparent"
              onClick={() => window.open(selectedArticle.url, '_blank')}
            >
              {labels.openOriginal}
              <ExternalLink size={16} />
            </Button>
          )}
          {isDailyDigest && (
            <span className="text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555]">
              {selectedArticleIds.length} {labels.articlesWillBeIncluded}
            </span>
          )}
        </div>
      </div>

      {/* ============ RIGHT COLUMN ============ */}
      <div className="w-full lg:w-1/2 pl-0 lg:pl-6 pt-6 lg:pt-0 overflow-y-auto">
        <SectionHeader label={labels.generatePost} />

        {/* Configuration Panel */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 mb-4">
          {/* Language Selector */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-2">
              {labels.language}
            </label>
            <RadioGroup
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="en"
                  id="lang-en"
                  className="border-[#222222] text-[#CCFF00] data-[state=checked]:border-[#CCFF00]"
                />
                <label
                  htmlFor="lang-en"
                  className={`text-[13px] font-inter cursor-pointer ${
                    language === 'en' ? 'text-[#E5E5E5]' : 'text-[#808080]'
                  }`}
                >
                  🇬🇧 English
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="es"
                  id="lang-es"
                  className="border-[#222222] text-[#CCFF00] data-[state=checked]:border-[#CCFF00]"
                />
                <label
                  htmlFor="lang-es"
                  className={`text-[13px] font-inter cursor-pointer ${
                    language === 'es' ? 'text-[#E5E5E5]' : 'text-[#808080]'
                  }`}
                >
                  🇪🇸 Español
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Tone Selector */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-2">
              {labels.tone}
            </label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger className="w-full bg-[#1A1A1A] border-[#222222] text-[#E5E5E5] font-inter text-sm rounded-lg h-10 hover:border-[#555555] transition-colors [&>svg]:text-[#555555]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#181818] border-[#222222] rounded-lg">
                {(['Professional', 'Casual', 'Urgent', 'Educational', 'Thought Leadership'] as Tone[]).map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                    className="text-[#E5E5E5] font-inter text-sm focus:bg-[rgba(204,255,0,0.1)] focus:text-[#E5E5E5] cursor-pointer"
                  >
                    {toneLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selector */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-2">
              {labels.format}
            </label>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger className="w-full bg-[#1A1A1A] border-[#222222] text-[#E5E5E5] font-inter text-sm rounded-lg h-10 hover:border-[#555555] transition-colors [&>svg]:text-[#555555]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#181818] border-[#222222] rounded-lg">
                {(['News Analysis', 'Quick Summary', 'Thread', 'Contrarian', 'Storytelling', 'Daily Digest'] as Format[]).map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    className="text-[#E5E5E5] font-inter text-sm focus:bg-[rgba(204,255,0,0.1)] focus:text-[#E5E5E5] cursor-pointer"
                  >
                    {f === 'Thread' ? 'Thread / Carousel' : f === 'Contrarian' ? 'Contrarian Take' : f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Length Selector */}
          <div className="mb-5">
            <label className="block text-[11px] font-medium font-jetbrains uppercase tracking-[0.08em] text-[#555555] mb-2">
              {labels.length}
            </label>
            <RadioGroup
              value={length}
              onValueChange={(v) => setLength(v as Length)}
              className="flex items-center gap-4"
            >
              {(['short', 'medium', 'long'] as Length[]).map((l) => (
                <div key={l} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={l}
                    id={`length-${l}`}
                    className="border-[#222222] text-[#CCFF00] data-[state=checked]:border-[#CCFF00]"
                  />
                  <label
                    htmlFor={`length-${l}`}
                    className={`text-[13px] font-inter cursor-pointer ${
                      length === l ? 'text-[#E5E5E5]' : 'text-[#808080]'
                    }`}
                  >
                    {l === 'short' ? labels.short : l === 'medium' ? labels.medium : labels.long}{' '}
                    <span className="text-[#555555]">({lengthWordCount(l)})</span>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Generate Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-button
              font-inter text-sm font-semibold
              transition-all duration-200
              ${isGenerating
                ? 'bg-[#CCFF00]/70 text-[#0A0A0A] cursor-not-allowed'
                : 'bg-[#CCFF00] text-[#0A0A0A] hover:brightness-110 hover:scale-[1.02] cursor-pointer'
              }
            `}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-transparent border-t-[#0A0A0A] rounded-full animate-spin" />
                {labels.generating}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {labels.generateBtn}
              </>
            )}
          </motion.button>
        </div>

        {/* ============ GENERATED POST EDITOR ============ */}
        <AnimatePresence>
          {hasGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] as [number, number, number, number], delay: 0.1 }}
            >
              <SectionHeader label={labels.editPost} />

              {aiFallback && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                  <AlertCircle size={14} className="text-accent shrink-0" />
                  <span className="text-xs font-inter text-text-secondary">
                    AI unavailable — using local templates
                  </span>
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[300px] bg-[#1A1A1A] border-[#222222] rounded-lg p-4 font-merriweather text-[16px] text-[#E5E5E5] leading-[1.7] resize-y focus:border-[#CCFF00] focus:shadow-[0_0_0_2px_rgba(204,255,0,0.15)] transition-all"
              />

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Button
                  variant="ghost"
                  onClick={handleRegenerate}
                  className="text-[#CCFF00] hover:bg-[rgba(204,255,0,0.1)] font-inter text-sm font-medium flex-1 rounded-button h-10"
                >
                  <RefreshCw size={16} />
                  {labels.regenerate}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="border-[#222222] text-[#E5E5E5] hover:bg-[#181818] hover:border-[#808080] font-inter text-sm font-medium flex-1 rounded-button h-10 bg-transparent"
                >
                  <ClipboardCopy size={16} />
                  {copied ? labels.copied : labels.copy}
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#CCFF00] text-[#0A0A0A] hover:brightness-110 font-inter text-sm font-semibold flex-1 rounded-button h-10"
                >
                  <Save size={16} />
                  {labels.save}
                </Button>
                <Button
                  onClick={() => {
                    setPublishResult(null);
                    setPublishDialogOpen(true);
                  }}
                  disabled={!linkedinConnected}
                  title={linkedinConnected
                    ? (language === 'es' ? 'Publicar en LinkedIn' : 'Post to LinkedIn')
                    : (language === 'es' ? 'Conectá LinkedIn en Configuración' : 'Connect LinkedIn in Settings')}
                  className="bg-[#0A66C2] text-white hover:brightness-110 font-inter text-sm font-semibold flex-[2] rounded-button h-10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Linkedin size={16} />
                  {language === 'es' ? 'Publicar en LinkedIn' : 'Post to LinkedIn'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============ LINKEDIN / CAROUSEL PREVIEW ============ */}
        <AnimatePresence>
          {hasGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number], delay: 0.2 }}
              className="mt-6"
            >
              <SectionHeader label={isThread ? labels.carouselPreview : labels.linkedinPreview} />
              {isThread ? (
                <CarouselPreview content={generatedContent} lang={language} />
              ) : (
                <LinkedInPreview content={generatedContent} lang={language} />
              )}

              {/* Schedule Panel */}
              <SchedulePanel
                content={generatedContent}
                sourceTitle={isDailyDigest ? `${selectedArticleIds.length} articles — Daily Digest` : selectedArticle.title}
                format={format}
                tone={tone}
                lang={language}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LinkedIn publish dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="bg-bg-primary border-border-default text-text-primary sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-inter text-lg flex items-center gap-2">
              <Linkedin size={20} className="text-[#0A66C2]" />
              {language === 'es' ? 'Publicar en LinkedIn' : 'Post to LinkedIn'}
            </DialogTitle>
            <DialogDescription className="text-text-tertiary font-inter text-xs">
              {language === 'es'
                ? 'Revisá el texto y elegí la visibilidad antes de publicar.'
                : 'Review the text and choose visibility before publishing.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="max-h-[240px] overflow-y-auto rounded-lg border border-border-default bg-bg-elevated p-3 font-merriweather text-sm text-text-secondary whitespace-pre-wrap">
              {generatedContent}
            </div>

            <div className="space-y-2">
              <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">
                {language === 'es' ? 'Visibilidad' : 'Visibility'}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={linkedinVisibility === 'PUBLIC' ? 'default' : 'outline'}
                  onClick={() => setLinkedinVisibility('PUBLIC')}
                  className={linkedinVisibility === 'PUBLIC'
                    ? 'bg-accent text-text-inverse font-inter text-sm flex-1 rounded-button h-10'
                    : 'border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-inter text-sm flex-1 rounded-button h-10'
                  }
                >
                  {language === 'es' ? 'Pública' : 'Public'}
                </Button>
                <Button
                  type="button"
                  variant={linkedinVisibility === 'CONNECTIONS' ? 'default' : 'outline'}
                  onClick={() => setLinkedinVisibility('CONNECTIONS')}
                  className={linkedinVisibility === 'CONNECTIONS'
                    ? 'bg-accent text-text-inverse font-inter text-sm flex-1 rounded-button h-10'
                    : 'border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-inter text-sm flex-1 rounded-button h-10'
                  }
                >
                  {language === 'es' ? 'Conexiones' : 'Connections'}
                </Button>
              </div>
            </div>

            {publishResult && (
              <div className={`text-sm font-inter ${publishResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {publishResult.message}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              className="border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-inter text-sm rounded-button h-10"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePublishToLinkedIn}
              disabled={publishing}
              className="bg-[#0A66C2] text-white hover:brightness-110 font-inter text-sm font-semibold rounded-button h-10"
            >
              <Linkedin size={16} />
              {publishing
                ? (language === 'es' ? 'Publicando...' : 'Publishing...')
                : (language === 'es' ? 'Publicar' : 'Publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
