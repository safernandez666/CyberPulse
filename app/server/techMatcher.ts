/**
 * Technology Stack Matching Service
 * 
 * Provides fuzzy matching between articles and user's technology stack.
 * Handles version matching, keyword variations, and vendor names.
 */

export interface TechStackItem {
  id: number;
  technology: string;
  version?: string;
  vendor?: string;
  category?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
}

/**
 * Generates fuzzy match keywords for a technology
 * Examples:
 *   "PHP" -> ["php", "php7", "php8", "php-fpm"]
 *   "Apache" -> ["apache", "apache2", "httpd"]
 *   "WordPress" -> ["wordpress", "wp", "wp-core"]
 */
function generateKeywords(technology: string, vendor?: string): string[] {
  const tech = technology.toLowerCase();
  const keywords = new Set<string>([tech]);

  // Common variations
  const variations: Record<string, string[]> = {
    'php': ['php', 'php7', 'php8', 'php-fpm', 'php-cgi'],
    'apache': ['apache', 'apache2', 'httpd', 'apache http server'],
    'wordpress': ['wordpress', 'wp', 'wp-core'],
    'mysql': ['mysql', 'mariadb', 'percona'],
    'nginx': ['nginx', 'nginx web server'],
    'openssl': ['openssl', 'ssl', 'tls'],
    'java': ['java', 'jdk', 'jre', 'openjdk'],
    'python': ['python', 'python2', 'python3', 'cpython'],
    'nodejs': ['nodejs', 'node.js', 'node', 'npm'],
    'docker': ['docker', 'docker-ce', 'containerd'],
    'kubernetes': ['kubernetes', 'k8s'],
    'redis': ['redis', 'redis-server'],
    'postgresql': ['postgresql', 'postgres', 'pgsql'],
    'mongodb': ['mongodb', 'mongo'],
    'elasticsearch': ['elasticsearch', 'elastic search'],
    'jenkins': ['jenkins', 'jenkins ci'],
    'gitlab': ['gitlab', 'gitlab-ce', 'gitlab-ee'],
    'tomcat': ['tomcat', 'apache tomcat'],
    'spring': ['spring', 'spring boot', 'spring framework'],
    'django': ['django'],
    'rails': ['rails', 'ruby on rails', 'ror'],
    'fortinet': ['fortinet', 'fortigate', 'fortios'],
    'palo alto': ['palo alto', 'pan-os', 'panorama'],
    'cisco': ['cisco', 'ios', 'ios-xe'],
    'windows': ['windows', 'windows server', 'win'],
    'linux': ['linux', 'kernel'],
    'ubuntu': ['ubuntu'],
    'debian': ['debian'],
    'centos': ['centos', 'rhel', 'red hat'],
  };

  // Add common variations if they exist
  if (variations[tech]) {
    variations[tech].forEach((v) => keywords.add(v));
  }

  // Add vendor if provided
  if (vendor) {
    keywords.add(vendor.toLowerCase());
  }

  // Add hyphenated version
  keywords.add(tech.replace(/\s+/g, '-'));

  return Array.from(keywords);
}

/**
 * Check if a version string matches the user's version
 * Examples:
 *   matchVersion("7.4", "PHP 7.4.33") -> true
 *   matchVersion("7.4", "PHP 7.4") -> true
 *   matchVersion("7.4", "PHP 8.0") -> false
 *   matchVersion("2.4", "Apache 2.4.x") -> true
 */
function matchVersion(userVersion: string, content: string): boolean {
  if (!userVersion) return false;

  // Normalize the user version (remove spaces, convert to lowercase)
  const normalizedVersion = userVersion.trim().toLowerCase();
  const contentLower = content.toLowerCase();

  // Direct match
  if (contentLower.includes(normalizedVersion)) {
    return true;
  }

  // Match major.minor (e.g., "7.4" matches "7.4.33", "7.4.x")
  const versionParts = normalizedVersion.split('.');
  if (versionParts.length >= 2) {
    const majorMinor = `${versionParts[0]}.${versionParts[1]}`;
    
    // Pattern: "7.4.x", "7.4.33", "version 7.4", "v7.4"
    const patterns = [
      majorMinor,
      `${majorMinor}.`,
      `v${majorMinor}`,
      `version ${majorMinor}`,
    ];

    for (const pattern of patterns) {
      if (contentLower.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate match score for an article against a tech stack item
 * Returns 0 if no match, higher scores for better matches
 */
function calculateMatchScore(
  article: Article,
  techItem: TechStackItem,
  keywords: string[]
): number {
  const content = `${article.title} ${article.summary}`.toLowerCase();
  let score = 0;

  // Check for keyword matches
  let keywordMatches = 0;
  for (const keyword of keywords) {
    if (content.includes(keyword)) {
      keywordMatches++;
    }
  }

  if (keywordMatches === 0) {
    return 0; // No match
  }

  // Base score from keyword matches
  score += keywordMatches * 10;

  // Boost score if version matches
  if (techItem.version && matchVersion(techItem.version, content)) {
    score += 50; // Strong boost for version match
  }

  // Boost for exact technology name in title
  if (article.title.toLowerCase().includes(techItem.technology.toLowerCase())) {
    score += 20;
  }

  // Boost for vendor match
  if (techItem.vendor && content.includes(techItem.vendor.toLowerCase())) {
    score += 15;
  }

  // Boost for high-priority categories
  const criticalCategories = ['VULNERABILITY', 'EXPLOIT', 'MALWARE', 'ALERT'];
  if (criticalCategories.includes(article.category)) {
    score += 10;
  }

  return score;
}

/**
 * Match articles against user's technology stack
 * Returns articles sorted by relevance score
 */
export function matchArticlesToStack(
  articles: Article[],
  techStack: TechStackItem[]
): { article: Article; score: number; matchedTech: string[] }[] {
  if (techStack.length === 0) {
    return [];
  }

  // Pre-generate keywords for all tech items
  const techKeywords = new Map<number, string[]>();
  techStack.forEach((tech) => {
    techKeywords.set(tech.id, generateKeywords(tech.technology, tech.vendor));
  });

  const matches: { article: Article; score: number; matchedTech: string[] }[] = [];

  for (const article of articles) {
    let totalScore = 0;
    const matchedTech: string[] = [];

    for (const tech of techStack) {
      const keywords = techKeywords.get(tech.id) || [];
      const score = calculateMatchScore(article, tech, keywords);

      if (score > 0) {
        totalScore += score;
        matchedTech.push(tech.technology);
      }
    }

    if (totalScore > 0) {
      matches.push({
        article,
        score: totalScore,
        matchedTech: Array.from(new Set(matchedTech)), // Remove duplicates
      });
    }
  }

  // Sort by score (highest first)
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Get statistics about matched articles
 */
export function getStackStatistics(
  articles: Article[],
  techStack: TechStackItem[]
): {
  totalArticles: number;
  matchedArticles: number;
  byTechnology: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  const matches = matchArticlesToStack(articles, techStack);

  const byTechnology: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  matches.forEach(({ article, matchedTech }) => {
    matchedTech.forEach((tech) => {
      byTechnology[tech] = (byTechnology[tech] || 0) + 1;
    });

    bySeverity[article.category] = (bySeverity[article.category] || 0) + 1;
  });

  return {
    totalArticles: articles.length,
    matchedArticles: matches.length,
    byTechnology,
    bySeverity,
  };
}
