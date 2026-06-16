/* ------------------------------------------------------------------ */
/*  LinkedIn Post Generator for API / MCP integration                  */
/* ------------------------------------------------------------------ */

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  severity: string;
  category: string;
  url: string;
}

export interface GeneratePostRequest {
  articleId: string;
  title: string;
  summary: string;
  source: string;
  severity: string;
  url: string;
  tone?: 'Professional' | 'Casual' | 'Urgent' | 'Educational' | 'Thought Leadership';
  format?: 'News Analysis' | 'Quick Summary' | 'Thread' | 'Contrarian' | 'Storytelling' | 'Daily Digest';
  length?: 'short' | 'medium' | 'long';
  language?: 'en' | 'es';
}

export interface GeneratePostResponse {
  post: string;
  html: string;
  metadata: {
    title: string;
    source: string;
    url: string;
    tone: string;
    format: string;
    length: string;
    language: string;
    wordCount: number;
    hashtags: string[];
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityEmoji: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

function hashtags(lang: 'en' | 'es', category: string): string {
  if (lang === 'es') {
    const catTags: Record<string, string> = {
      VULNERABILITY: '#vulnerabilidad',
      MALWARE: '#malware',
      RANSOMWARE: '#ransomware',
      PHISHING: '#phishing',
      'DATA BREACH': '#breach',
      'THREAT INTEL': '#amenazas',
      COMPLIANCE: '#cumplimiento',
      RESEARCH: '#investigacion',
      PRIVACY: '#privacidad',
    };
    return `#ciberseguridad #infoseguridad ${catTags[category] || '#ciberseguridad'} #noticias`;
  }
  const catTags: Record<string, string> = {
    VULNERABILITY: '#vulnerability',
    MALWARE: '#malware',
    RANSOMWARE: '#ransomware',
    PHISHING: '#phishing',
    'DATA BREACH': '#databreach',
    'THREAT INTEL': '#threatintel',
    COMPLIANCE: '#compliance',
    RESEARCH: '#securityresearch',
    PRIVACY: '#privacy',
  };
  return `#cybersecurity #infosec ${catTags[category] || '#cybersecurity'} #dailynews`;
}

function baseTone(tone: string, sentence: string, lang: 'en' | 'es'): string {
  if (lang === 'es') {
    if (tone === 'Casual') return sentence.replace(/\bestá utilizando\b/g, 'está usando').replace(/\borganizaciones\b/g, 'empresas');
    if (tone === 'Urgent') return sentence.replace(/\bdebería\b/g, 'debe').replace(/\bimportante\b/g, 'crítico');
    if (tone === 'Thought Leadership') return sentence.replace(/\bes un\b/g, 'representa un').replace(/\batacantes\b/g, 'actores de amenazas');
    return sentence;
  }
  if (tone === 'Casual') return sentence.replace(/\bis utilizing\b/g, 'is using').replace(/\borganizations\b/g, 'companies');
  if (tone === 'Urgent') return sentence.replace(/\bshould\b/g, 'must').replace(/\bimportant\b/g, 'critical');
  if (tone === 'Thought Leadership') return sentence.replace(/\bis a\b/g, 'represents a').replace(/\battackers\b/g, 'threat actors');
  return sentence;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/* ------------------------------------------------------------------ */
/*  Templates                                                          */
/* ------------------------------------------------------------------ */

function newsAnalysisTemplate(
  a: Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'category'>,
  tone: string, lang: 'en' | 'es', wc: string
): string {
  const emoji = severityEmoji[a.severity] || '⚡';
  const intro = baseTone(tone, lang === 'es'
    ? `**Un desarrollo significativo en ${a.category.toLowerCase()}** está generando impacto en la comunidad de seguridad.`
    : `**A significant development in ${a.category.toLowerCase()}** is making waves across the security community.`, lang);
  const body = baseTone(tone, `**${a.title}**\n\n${a.summary}`, lang);
  const takeaway = baseTone(tone, lang === 'es'
    ? (wc === 'short' ? '**⚡ Conclusión:** revise sus controles **hoy**.' : wc === 'medium' ? '**⚡ Conclusión:** revise sus controles, asegúrese de que su **plan de respuesta a incidentes** cubra este escenario.' : '**⚡ Conclusión:** revise sus controles, asegúrese de que su **plan de respuesta a incidentes** cubra este escenario, y informe a su equipo de liderazgo sobre el **impacto del negocio**.')
    : (wc === 'short' ? '**⚡ Bottom line:** review your controls **today**.' : wc === 'medium' ? '**⚡ Bottom line:** review your controls, ensure your **incident response plan** covers this scenario.' : '**⚡ Bottom line:** review your controls, ensure your **incident response plan** covers this scenario, and brief your leadership team on the **business impact**.'), lang);

  const bullets = lang === 'es'
    ? `**Puntos clave:**\n→ 🔍 El **vector de ataque** destaca brechas persistentes en ${a.category.toLowerCase()}\n→ 🏢 Las organizaciones con **infraestructura heredada** siguen más expuestas\n→ 💰 Este incidente subraya la necesidad de **inversión proactiva en seguridad**`
    : `**Key takeaways:**\n→ 🔍 The **attack vector** highlights persistent gaps in ${a.category.toLowerCase()}\n→ 🏢 Organizations with **legacy infrastructure** remain most exposed\n→ 💰 This incident underscores the need for **proactive security investment**`;

  if (wc === 'short') return `${emoji} **${lang === 'es' ? 'ANÁLISIS DE NOTICIAS' : 'NEWS ANALYSIS'}**\n\n${intro}\n\n${body}\n\n${takeaway}\n\n${hashtags(lang, a.category)}`;
  return `${emoji} **${lang === 'es' ? 'ANÁLISIS DE NOTICIAS' : 'NEWS ANALYSIS'}**\n\n${intro}\n\n${body}\n\n${bullets}\n\n${takeaway}\n\n${hashtags(lang, a.category)}`;
}

function quickSummaryTemplate(
  a: Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'category'>,
  tone: string, lang: 'en' | 'es', wc: string
): string {
  const emoji = severityEmoji[a.severity] || '⚡';
  const header = lang === 'es'
    ? `📋 **${a.category} — Resumen rápido**`
    : `📋 **${a.category} — Quick Update**`;
  const bullets = lang === 'es'
    ? `❓ **Qué:** ${a.title}\n⚠️ **Impacto:** ${a.summary.slice(0, 120)}...\n✅ **Acción:** Parchear, revisar y monitorear`
    : `❓ **What:** ${a.title}\n⚠️ **Impact:** ${a.summary.slice(0, 120)}...\n✅ **Action:** Patch, review, and monitor`;
  const closing = lang === 'es' ? '🛡️ **Manténgase seguro.**' : '🛡️ **Stay safe out there.**';

  return `${emoji} ${header}\n\n→ ${bullets}\n\n${closing}\n\n${hashtags(lang, a.category)}`;
}

function threadTemplate(
  a: Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'category'>,
  tone: string, lang: 'en' | 'es', wc: string
): string {
  const emoji = severityEmoji[a.severity] || '⚡';
  const slides = wc === 'short' ? 2 : wc === 'medium' ? 3 : 4;
  const lines: string[] = [`**${emoji} ${lang === 'es' ? 'HILO' : 'THREAD'}: Alerta de ${a.category}**\n\n**1️⃣ ${lang === 'es' ? 'El titular' : 'The Headline'}**\n**${a.title}**\n`];
  lines.push(`**2️⃣ ${lang === 'es' ? 'El contexto' : 'The Context'}**\n${a.summary.slice(0, 200)}...\n`);
  if (slides >= 3) {
    lines.push(lang === 'es'
      ? `**3️⃣ ¿Qué debería hacer?**\n✅ **Parchear sistemas** inmediatamente\n✅ **Revisar logs** en busca de actividad sospechosa\n✅ **Informar a su equipo** sobre la amenaza\n`
      : `**3️⃣ What Should You Do?**\n✅ **Patch systems** immediately\n✅ **Review access logs** for suspicious activity\n✅ **Brief your team** on the threat\n`);
  }
  if (slides >= 4) {
    lines.push(`**4️⃣ ${lang === 'es' ? 'La conclusión' : 'The Bottom Line'}**\n${baseTone(tone, lang === 'es' ? 'Esta tendencia **solo se acelera**. Las organizaciones que invierten en **defensa proactiva** saldrán mucho mejor paradas.' : 'This trend is **only accelerating**. Organizations that invest in **proactive defense** will fare far better.', lang)}\n`);
  }
  return lines.join('\n') + `\n${hashtags(lang, a.category)}`;
}

function contrarianTemplate(
  a: Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'category'>,
  tone: string, lang: 'en' | 'es', wc: string
): string {
  const emoji = severityEmoji[a.severity] || '💡';
  const challenge = baseTone(tone, lang === 'es'
    ? `💭 Todo el mundo habla de **${a.title.toLowerCase()}**, pero esto es lo que **la mayoría está entendiendo mal**.`
    : `💭 Everyone is talking about **${a.title.toLowerCase()}**, but here's what **most are getting wrong**.`, lang);
  const reframe = baseTone(tone, lang === 'es'
    ? `La narrativa se centra en la **brecha inmediata**, pero la historia real es sobre **resiliencia sistémica** — o la falta de ella.\n\n${a.summary}`
    : `The narrative focuses on the **immediate breach**, but the real story is about **systemic resilience** — or the lack thereof.\n\n${a.summary}`, lang);
  const dataPoint = lang === 'es'
    ? '📊 **La investigación muestra que el 68%** de las organizaciones carece de segmentación adecuada. Este no es un problema tecnológico — es un **problema de priorización**.'
    : '📊 **Research shows 68%** of organizations lack adequate network segmentation. This is not a technology problem — it is a **prioritization problem**.';
  const call = lang === 'es'
    ? `🛑 Debemos dejar de tratar **${a.category.toLowerCase()}** como un checkbox y empezar a **construir seguridad en nuestro ADN operativo**.\n\n💬 **¿De acuerdo? ¿En desacuerdo?** Cuéntenme abajo. 👇`
    : `🛑 We need to stop treating **${a.category.toLowerCase()}** as a checkbox and start **building security into our operational DNA**.\n\n💬 **Agree? Disagree?** Let me know below. 👇`;

  return `${emoji} **${lang === 'es' ? 'OPINIÓN' : 'HOT TAKE'}**\n\n${challenge}\n\n${reframe}\n\n${dataPoint}\n\n${call}\n\n${hashtags(lang, a.category)}`;
}

function storytellingTemplate(
  a: Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'category'>,
  tone: string, lang: 'en' | 'es', wc: string
): string {
  const emoji = severityEmoji[a.severity] || '📖';
  const open = lang === 'es'
    ? `☕ Recuerdo la **primera vez** que tuve que lidiar con un incidente de ${a.category.toLowerCase()}...`
    : `☕ I remember the **first time** I had to deal with a ${a.category.toLowerCase()} incident...`;
  const connect = lang === 'es'
    ? `Cuando leí sobre **${a.title.toLowerCase()}**, me trajo de vuelta. 🔄`
    : `When I read about **${a.title.toLowerCase()}**, it brought me right back. 🔄`;
  const lesson = baseTone(tone, a.summary, lang);
  const close = lang === 'es'
    ? `🛡️ El panorama ha cambiado drásticamente, pero los **fundamentos permanecen**: parchea rápido, monitorea de cerca, nunca asumas que no eres un blanco y siempre ten un plan.`
    : `🛡️ The landscape has changed dramatically, but the **fundamentals remain**: patch fast, monitor closely, never assume you're not a target, and always have a plan.`;
  const cta = lang === 'es'
    ? `💬 **¿Qué lección aprendiste a la mala?** Compártela abajo. 👇`
    : `💬 **What's a lesson you learned the hard way?** Drop it below. 👇`;

  return `${emoji} **${lang === 'es' ? 'HISTORIA' : 'STORY TIME'}**\n\n${open}\n${connect}\n\n${lesson}\n\n${close}\n\n${cta}\n\n${hashtags(lang, a.category)}`;
}

function dailyDigestTemplate(
  articles: Array<Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'url'>>,
  tone: string, lang: 'en' | 'es', length: string
): string {
  const wc = length;
  const maxArticles = wc === 'short' ? 3 : wc === 'medium' ? 5 : 7;
  const selected = articles.slice(0, maxArticles);
  const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const intro = lang === 'es'
    ? `🔒 Resumen de Ciberseguridad — ${dateStr}\n\nEstas son las historias de seguridad más importantes de hoy:`
    : `🔒 Cybersecurity Roundup — ${dateStr}\n\nHere are the most significant security stories you need to know about today:`;

  let body = '';
  selected.forEach((a, i) => {
    const num = i + 1;
    const emoji = severityEmoji[a.severity] || '⚪';
    body += `**${num}.** ${emoji} **${a.title}**\n${a.summary.slice(0, 160)}...\n🔗 **${lang === 'es' ? 'Leer más' : 'Read more'}:** ${a.url}\n\n`;
  });

  const closing = lang === 'es'
    ? `Manténgase informado. Manténgase seguro.\n\n¿Cuál de estas historias impacta más a su organización? Cuénteme abajo.`
    : `Stay informed. Stay secure.\n\nWhich of these stories impacts your organization the most? Let me know below.`;

  return `${intro}\n\n${body}${closing}\n\n---\n#cybersecurity #infosec #dailynews #threatintel`;
}

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export function generatePost(req: GeneratePostRequest): GeneratePostResponse {
  const tone = req.tone || 'Professional';
  const fmt = req.format || 'News Analysis';
  const length = req.length || 'medium';
  const lang = req.language || 'en';

  const article: NewsArticle = {
    id: req.articleId,
    title: req.title,
    summary: req.summary,
    source: req.source,
    severity: req.severity,
    category: 'GENERAL',
    url: req.url,
  };

  let post: string;

  switch (fmt) {
    case 'Quick Summary':
      post = quickSummaryTemplate(article, tone, lang, length);
      break;
    case 'Thread':
      post = threadTemplate(article, tone, lang, length);
      break;
    case 'Contrarian':
      post = contrarianTemplate(article, tone, lang, length);
      break;
    case 'Storytelling':
      post = storytellingTemplate(article, tone, lang, length);
      break;
    default:
      post = newsAnalysisTemplate(article, tone, lang, length);
      break;
  }

  const html = post
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  const hashTags = post.match(/#\w+/g) || [];

  return {
    post,
    html,
    metadata: {
      title: req.title,
      source: req.source,
      url: req.url,
      tone,
      format: fmt,
      length,
      language: lang,
      wordCount: wordCount(post),
      hashtags: [...new Set(hashTags)],
    },
  };
}

export function generateDailyDigest(
  articles: Array<Pick<NewsArticle, 'title' | 'summary' | 'severity' | 'url'>>,
  tone: string = 'Professional',
  length: string = 'medium',
  lang: 'en' | 'es' = 'en'
): GeneratePostResponse {
  const post = dailyDigestTemplate(articles, tone, lang, length);
  const html = post.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  const hashTags = post.match(/#\w+/g) || [];

  return {
    post,
    html,
    metadata: {
      title: `Daily Digest — ${articles.length} articles`,
      source: 'Multiple',
      url: '',
      tone,
      format: 'Daily Digest',
      length,
      language: lang,
      wordCount: wordCount(post),
      hashtags: [...new Set(hashTags)],
    },
  };
}
