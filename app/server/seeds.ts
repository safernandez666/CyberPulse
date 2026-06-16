import { getDb } from './db';

export interface RSSSource {
  name: string;
  rssUrl: string;
  category: string;
}

export const RSS_SOURCES: RSSSource[] = [
  /* News / Threat Intel */
  { name: 'The Hacker News', rssUrl: 'https://feeds.feedburner.com/TheHackersNews', category: 'THREAT INTEL' },
  { name: 'BleepingComputer', rssUrl: 'https://www.bleepingcomputer.com/feed/', category: 'VULNERABILITY' },
  { name: 'SecurityWeek', rssUrl: 'https://feeds.feedburner.com/securityweek', category: 'MALWARE' },
  { name: 'The Record', rssUrl: 'https://therecord.media/feed/', category: 'DATA BREACH' },
  { name: 'Krebs on Security', rssUrl: 'https://krebsonsecurity.com/feed/', category: 'PHISHING' },
  { name: 'Ars Technica Security', rssUrl: 'https://arstechnica.com/security/feed/', category: 'RESEARCH' },
  { name: 'Dark Reading', rssUrl: 'https://www.darkreading.com/rss.xml', category: 'COMPLIANCE' },
  { name: 'Threatpost', rssUrl: 'https://threatpost.com/feed/', category: 'THREAT INTEL' },
  { name: 'CyberScoop', rssUrl: 'https://cyberscoop.com/feed', category: 'POLICY' },
  { name: 'Intelligence Online', rssUrl: 'https://feeds.feedburner.com/IntelligenceOnline', category: 'THREAT INTEL' },
  { name: 'Risky Business', rssUrl: 'https://risky.biz/rss.xml', category: 'THREAT INTEL' },
  { name: 'Schneier on Security', rssUrl: 'https://www.schneier.com/feed/atom/', category: 'THREAT INTEL' },

  /* Government / CERT */
  { name: 'CISA Advisories', rssUrl: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', category: 'VULNERABILITY' },
  { name: 'CISA ICS Advisories', rssUrl: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', category: 'VULNERABILITY' },
  { name: 'CISA ICS Medical Advisories', rssUrl: 'https://www.cisa.gov/cybersecurity-advisories/ics-medical-advisories.xml', category: 'VULNERABILITY' },
  { name: 'ASD ACSC Alerts', rssUrl: 'https://www.cyber.gov.au/rss/alerts', category: 'ALERT' },
  { name: 'CERT-FR', rssUrl: 'https://www.cert.ssi.gouv.fr/feed/', category: 'ALERT' },
  { name: 'JPCERT/CC', rssUrl: 'https://www.jpcert.or.jp/english/rss/jpcert-en.rdf', category: 'ALERT' },
  { name: 'JPCERT/CC Blog', rssUrl: 'https://blogs.jpcert.or.jp/en/atom.xml', category: 'ALERT' },
  { name: 'UK NCSC All', rssUrl: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml', category: 'ALERT' },
  { name: 'UK NCSC News', rssUrl: 'https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml', category: 'ALERT' },
  { name: 'UK NCSC Reports', rssUrl: 'https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml', category: 'ALERT' },
  { name: 'CERT-EU', rssUrl: 'https://cert.europa.eu/publications/newsletter%20RSS', category: 'ALERT' },
  { name: 'NSA Cybersecurity', rssUrl: 'https://www.nsa.gov/Press-Room/Press-Releases-Statements/feed/', category: 'POLICY' },
  { name: 'ENISA', rssUrl: 'https://www.enisa.europa.eu/rss/publications', category: 'POLICY' },
  { name: 'FBI Cyber', rssUrl: 'https://www.fbi.gov/news/feed', category: 'THREAT INTEL' },
  { name: 'INCIBE', rssUrl: 'https://www.incibe.es/feed/alertas-tempranas', category: 'ALERT' },
  { name: 'CCN-CERT', rssUrl: 'https://www.ccn-cert.cni.es/feed/avisos', category: 'VULNERABILITY' },
  { name: 'OSI', rssUrl: 'https://www.osi.es/feed/actualidad', category: 'AWARENESS' },

  /* Vendor blogs / advisories */
  { name: 'Microsoft Security', rssUrl: 'https://www.microsoft.com/en-us/security/blog/feed/', category: 'VULNERABILITY' },
  { name: 'Microsoft Security Update Guide', rssUrl: 'https://api.msrc.microsoft.com/update-guide/rss', category: 'VULNERABILITY' },
  { name: 'CrowdStrike Blog', rssUrl: 'https://www.crowdstrike.com/blog/feed/', category: 'THREAT INTEL' },
  { name: 'Mandiant', rssUrl: 'https://www.mandiant.com/resources/blog/rss.xml', category: 'THREAT INTEL' },
  { name: 'Sophos News', rssUrl: 'https://news.sophos.com/en-us/feed/', category: 'MALWARE' },
  { name: 'Tenable Blog', rssUrl: 'https://www.tenable.com/blog/feed', category: 'VULNERABILITY' },
  { name: 'Rapid7 Blog', rssUrl: 'https://blog.rapid7.com/rss/', category: 'VULNERABILITY' },
  { name: 'Rapid7 Emergent Threats', rssUrl: 'https://blog.rapid7.com/tag/emergent-threat-response/rss/', category: 'VULNERABILITY' },
  { name: 'Qualys Blog', rssUrl: 'https://blog.qualys.com/feed', category: 'VULNERABILITY' },
  { name: 'Fortinet Blog', rssUrl: 'https://www.fortinet.com/blog/feed', category: 'VULNERABILITY' },
  { name: 'FortiGuard PSIRT', rssUrl: 'https://www.fortiguard.com/rss/ir.xml', category: 'VULNERABILITY' },
  { name: 'Palo Alto Networks', rssUrl: 'https://www.paloaltonetworks.com/blog/feed', category: 'THREAT INTEL' },
  { name: 'Palo Alto Security Advisories', rssUrl: 'https://security.paloaltonetworks.com/rss.xml', category: 'VULNERABILITY' },
  { name: 'Check Point Blog', rssUrl: 'https://blog.checkpoint.com/feed/', category: 'THREAT INTEL' },
  { name: 'Check Point Research', rssUrl: 'https://research.checkpoint.com/feed/', category: 'THREAT INTEL' },
  { name: 'Kaspersky Blog', rssUrl: 'https://www.kaspersky.com/blog/feed/', category: 'MALWARE' },
  { name: 'Securelist', rssUrl: 'https://securelist.com/feed/', category: 'MALWARE' },
  { name: 'Bitdefender', rssUrl: 'https://www.bitdefender.com/blog/hotforsecurity/feed/', category: 'MALWARE' },
  { name: 'Malwarebytes Labs', rssUrl: 'https://blog.malwarebytes.com/feed/', category: 'MALWARE' },
  { name: 'Cisco Security Blog', rssUrl: 'https://blogs.cisco.com/security/feed', category: 'VULNERABILITY' },
  { name: 'Cisco Talos', rssUrl: 'https://feeds.feedburner.com/feedburner/Talos', category: 'THREAT INTEL' },
  { name: 'Elastic Security Labs', rssUrl: 'https://www.elastic.co/security-labs/rss/feed.xml', category: 'MALWARE' },
  { name: 'Proofpoint Threat Insight', rssUrl: 'https://www.proofpoint.com/us/threat-insight-blog.xml', category: 'THREAT INTEL' },
  { name: 'SentinelOne', rssUrl: 'https://www.sentinelone.com/feed/', category: 'MALWARE' },
  { name: 'Apple Newsroom', rssUrl: 'https://www.apple.com/newsroom/rss-feed.rss', category: 'VULNERABILITY' },
  { name: 'Apple Developer Releases', rssUrl: 'https://developer.apple.com/news/releases/rss/releases.rss', category: 'VULNERABILITY' },
  { name: 'CVEfeed.io', rssUrl: 'https://cvefeed.io/rssfeed/latest.xml', category: 'VULNERABILITY' },

  /* Research */
  { name: 'PortSwigger Blog', rssUrl: 'https://portswigger.net/blog/rss', category: 'VULNERABILITY' },
  { name: 'SANS ISC', rssUrl: 'https://isc.sans.edu/rssfeed.xml', category: 'THREAT INTEL' },
  { name: 'SANS ISC Full', rssUrl: 'https://isc.sans.edu/rssfeed_full.xml', category: 'THREAT INTEL' },
  { name: 'Google Project Zero', rssUrl: 'https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss', category: 'RESEARCH' },
  { name: 'Google Online Security', rssUrl: 'https://feeds.feedburner.com/GoogleOnlineSecurityBlog', category: 'RESEARCH' },
  { name: 'Google TAG', rssUrl: 'https://blog.google/threat-analysis-group/rss/', category: 'RESEARCH' },
  { name: 'WeLiveSecurity', rssUrl: 'https://www.welivesecurity.com/en/rss/feed/', category: 'MALWARE' },
  { name: 'RedesZone', rssUrl: 'https://www.redeszone.net/feed/', category: 'VULNERABILITY' },
  { name: 'Cybersecurity Dive', rssUrl: 'https://www.cybersecuritydive.com/feeds/news/', category: 'INDUSTRY' },

  /* Exploits */
  { name: 'Exploit-DB', rssUrl: 'https://www.exploit-db.com/rss.xml', category: 'EXPLOIT' },
  { name: 'ZDI Published', rssUrl: 'https://www.zerodayinitiative.com/rss/published/', category: 'EXPLOIT' },
  { name: 'ZDI Blog', rssUrl: 'https://www.zerodayinitiative.com/blog?format=rss', category: 'EXPLOIT' },

  /* Additional sources from zer0yu/CyberSecurityRSS */
  { name: 'The DFIR Report', rssUrl: 'https://thedfirreport.com/feed/', category: 'THREAT INTEL' },
  { name: 'Pen Test Partners', rssUrl: 'https://www.pentestpartners.com/feed/', category: 'VULNERABILITY' },
  { name: 'Packet Storm', rssUrl: 'https://rss.packetstormsecurity.com/files/', category: 'EXPLOIT' },
  { name: 'CyberNews', rssUrl: 'https://cybernews.com/feed/', category: 'THREAT INTEL' },
  { name: 'Darknet', rssUrl: 'http://feeds.feedburner.com/darknethackers', category: 'THREAT INTEL' },
  { name: 'Sploitus', rssUrl: 'https://sploitus.com/rss', category: 'EXPLOIT' },
  { name: 'Seebug', rssUrl: 'https://www.seebug.org/rss/new/', category: 'VULNERABILITY' },
  { name: 'Bugtraq', rssUrl: 'http://seclists.org/rss/bugtraq.rss', category: 'VULNERABILITY' },
  { name: 'CXSecurity', rssUrl: 'https://cxsecurity.com/wlb/rss/all/', category: 'VULNERABILITY' },
  { name: 'Security Boulevard', rssUrl: 'https://securityboulevard.com/feed/', category: 'INDUSTRY' },
  { name: 'HackerOne Hacktivity', rssUrl: 'https://rss.ricterz.me/hacktivity', category: 'VULNERABILITY' },
  { name: 'InfoSec Write-ups', rssUrl: 'https://infosecwriteups.com/feed', category: 'RESEARCH' },
  { name: 'STAR Labs', rssUrl: 'https://starlabs.sg/publications/index.xml', category: 'RESEARCH' },
  { name: 'Der Flounder', rssUrl: 'https://derflounder.wordpress.com/feed/', category: 'VULNERABILITY' },
  { name: 'Attify Blog', rssUrl: 'https://blog.attify.com/rss/', category: 'IOT' },
  { name: 'Anquanke', rssUrl: 'https://api.anquanke.com/data/v1/rss', category: 'THREAT INTEL' },
  { name: '4hou', rssUrl: 'https://www.4hou.com/feed', category: 'THREAT INTEL' },
  { name: 'tttang', rssUrl: 'https://www.tttang.com/rss.xml', category: 'RESEARCH' },
  { name: 'paper - Last paper', rssUrl: 'https://paper.seebug.org/rss/', category: 'RESEARCH' },
  { name: 'NSFocus', rssUrl: 'http://blog.nsfocus.net/feed/', category: 'VULNERABILITY' },
  { name: 'Tencent Xuanwu Lab', rssUrl: 'https://xlab.tencent.com/cn/feed/', category: 'RESEARCH' },
  { name: 'Trickest CVE', rssUrl: 'https://github.com/trickest/cve/commits/main.atom', category: 'VULNERABILITY' },
  { name: 'HackerNews.cc', rssUrl: 'http://hackernews.cc/feed', category: 'THREAT INTEL' },
  { name: 'Cybersecurity News', rssUrl: 'https://securityonline.info/feed/', category: 'THREAT INTEL' },
  { name: 'Infosecurity Magazine', rssUrl: 'http://www.infosecurity-magazine.com/rss/news/', category: 'INDUSTRY' },
  { name: 'RedPacket Security', rssUrl: 'https://www.redpacketsecurity.com/feed/', category: 'THREAT INTEL' },
  { name: 'Cyber Kendra', rssUrl: 'https://www.cyberkendra.com/feeds/posts/default', category: 'THREAT INTEL' },
  { name: 'Vulners', rssUrl: 'https://vulners.com/rss.xml', category: 'VULNERABILITY' },
  { name: 'VulDB', rssUrl: 'https://vuldb.com/en/?rss.recent', category: 'VULNERABILITY' },
  { name: 'CERT Vulnerability Notes', rssUrl: 'http://www.kb.cert.org/vulfeed', category: 'VULNERABILITY' },
  { name: 'Trail of Bits', rssUrl: 'https://blog.trailofbits.com/feed/', category: 'RESEARCH' },
  { name: 'Intigriti', rssUrl: 'https://blog.intigriti.com/feed/', category: 'VULNERABILITY' },
  { name: 'Praetorian', rssUrl: 'https://www.praetorian.com/blog/feed', category: 'VULNERABILITY' },
  { name: 'Appsecco', rssUrl: 'https://blog.appsecco.com/feed', category: 'VULNERABILITY' },
  { name: 'Troy Hunt', rssUrl: 'https://www.troyhunt.com/rss/', category: 'DATA BREACH' },
  { name: 'Hacker News Frontpage', rssUrl: 'https://hnrss.org/frontpage', category: 'TECH' },
];

export function seedSources() {
  const db = getDb();
  const stmt = db.prepare(`INSERT OR IGNORE INTO sources (name, rss_url, category, custom) VALUES (?, ?, ?, ?)`);

  for (const source of RSS_SOURCES) {
    stmt.run(source.name, source.rssUrl, source.category, 0);
  }

  console.log(`[DB] Seeded ${RSS_SOURCES.length} RSS sources`);
}
