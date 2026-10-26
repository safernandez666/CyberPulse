import { getDb } from './db';

export interface RSSSource {
  name: string;
  rssUrl: string;
  category: string;
  /* Feeds that are permanently unreachable are kept here but seeded inactive,
     so they stay visible (and re-enablable) in Settings without costing a
     request on every scrape. Verified broken on 2026-10-26. */
  active?: boolean;
  brokenReason?: string;
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
  { name: 'ASD ACSC Alerts', rssUrl: 'https://www.cyber.gov.au/rss/alerts', category: 'ALERT', active: false, brokenReason: 'connection refused' },
  { name: 'CERT-FR', rssUrl: 'https://www.cert.ssi.gouv.fr/feed/', category: 'ALERT' },
  { name: 'JPCERT/CC', rssUrl: 'https://www.jpcert.or.jp/english/rss/jpcert-en.rdf', category: 'ALERT' },
  { name: 'JPCERT/CC Blog', rssUrl: 'https://blogs.jpcert.or.jp/en/atom.xml', category: 'ALERT' },
  { name: 'UK NCSC All', rssUrl: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml', category: 'ALERT' },
  { name: 'UK NCSC News', rssUrl: 'https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml', category: 'ALERT' },
  { name: 'UK NCSC Reports', rssUrl: 'https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml', category: 'ALERT' },
  { name: 'CERT-EU', rssUrl: 'https://cert.europa.eu/publications/security-advisories-rss', category: 'ALERT' },
  { name: 'NSA Cybersecurity', rssUrl: 'https://www.nsa.gov/Press-Room/Press-Releases-Statements/feed/', category: 'POLICY', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'ENISA', rssUrl: 'https://www.enisa.europa.eu/rss/publications', category: 'POLICY', active: false, brokenReason: 'HTTP 404, no replacement found' },
  { name: 'FBI Cyber', rssUrl: 'https://www.fbi.gov/news/feed', category: 'THREAT INTEL', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'INCIBE', rssUrl: 'https://www.incibe.es/incibe-cert/alerta-temprana/avisos/feed', category: 'ALERT' },
  { name: 'CCN-CERT', rssUrl: 'https://www.ccn-cert.cni.es/feed/avisos', category: 'VULNERABILITY', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'OSI', rssUrl: 'https://www.osi.es/feed/actualidad', category: 'AWARENESS', active: false, brokenReason: 'WAF rejects the request' },

  /* Vendor blogs / advisories */
  { name: 'Microsoft Security', rssUrl: 'https://www.microsoft.com/en-us/security/blog/feed/', category: 'VULNERABILITY' },
  { name: 'Microsoft Security Update Guide', rssUrl: 'https://api.msrc.microsoft.com/update-guide/rss', category: 'VULNERABILITY' },
  { name: 'CrowdStrike Blog', rssUrl: 'https://www.crowdstrike.com/blog/feed/', category: 'THREAT INTEL' },
  { name: 'Mandiant', rssUrl: 'https://www.mandiant.com/resources/blog/rss.xml', category: 'THREAT INTEL', active: false, brokenReason: 'redirects to HTML on cloud.google.com' },
  { name: 'Sophos News', rssUrl: 'https://feeds.feedburner.com/sophos/dgdY', category: 'MALWARE' },
  { name: 'Tenable Blog', rssUrl: 'https://www.tenable.com/blog/feed', category: 'VULNERABILITY' },
  { name: 'Rapid7 Blog', rssUrl: 'https://blog.rapid7.com/rss/', category: 'VULNERABILITY' },
  { name: 'Rapid7 Emergent Threats', rssUrl: 'https://blog.rapid7.com/tag/emergent-threat-response/rss/', category: 'VULNERABILITY' },
  { name: 'Qualys Blog', rssUrl: 'https://blog.qualys.com/feed', category: 'VULNERABILITY' },
  { name: 'Fortinet Blog', rssUrl: 'https://www.fortinet.com/blog/feed', category: 'VULNERABILITY', active: false, brokenReason: 'HTTP 404, no replacement found' },
  { name: 'FortiGuard PSIRT', rssUrl: 'https://www.fortiguard.com/rss/ir.xml', category: 'VULNERABILITY' },
  { name: 'Palo Alto Networks', rssUrl: 'https://www.paloaltonetworks.com/blog/feed', category: 'THREAT INTEL' },
  { name: 'Palo Alto Security Advisories', rssUrl: 'https://security.paloaltonetworks.com/rss.xml', category: 'VULNERABILITY' },
  { name: 'Check Point Blog', rssUrl: 'https://blog.checkpoint.com/feed/', category: 'THREAT INTEL' },
  { name: 'Check Point Research', rssUrl: 'https://research.checkpoint.com/feed/', category: 'THREAT INTEL' },
  { name: 'Kaspersky Blog', rssUrl: 'https://www.kaspersky.com/blog/feed/', category: 'MALWARE' },
  { name: 'Securelist', rssUrl: 'https://securelist.com/feed/', category: 'MALWARE' },
  { name: 'Bitdefender', rssUrl: 'https://www.bitdefender.com/blog/api/rss/hotforsecurity/', category: 'MALWARE' },
  { name: 'Malwarebytes Labs', rssUrl: 'https://blog.malwarebytes.com/feed/', category: 'MALWARE' },
  { name: 'Cisco Security Blog', rssUrl: 'https://blogs.cisco.com/security/feed', category: 'VULNERABILITY' },
  { name: 'Cisco Talos', rssUrl: 'https://feeds.feedburner.com/feedburner/Talos', category: 'THREAT INTEL' },
  { name: 'Elastic Security Labs', rssUrl: 'https://www.elastic.co/security-labs/rss/feed.xml', category: 'MALWARE' },
  { name: 'Proofpoint Threat Insight', rssUrl: 'https://www.proofpoint.com/us/threat-insight-blog.xml', category: 'THREAT INTEL' },
  { name: 'SentinelOne', rssUrl: 'https://www.sentinelone.com/blog/feed/', category: 'MALWARE' },
  { name: 'Apple Newsroom', rssUrl: 'https://www.apple.com/newsroom/rss-feed.rss', category: 'VULNERABILITY' },
  { name: 'Apple Developer Releases', rssUrl: 'https://developer.apple.com/news/releases/rss/releases.rss', category: 'VULNERABILITY' },
  { name: 'CVEfeed.io', rssUrl: 'https://cvefeed.io/rssfeed/latest.xml', category: 'VULNERABILITY' },

  /* Research */
  { name: 'PortSwigger Blog', rssUrl: 'https://portswigger.net/blog/rss', category: 'VULNERABILITY' },
  { name: 'SANS ISC', rssUrl: 'https://isc.sans.edu/rssfeed.xml', category: 'THREAT INTEL' },
  { name: 'SANS ISC Full', rssUrl: 'https://isc.sans.edu/rssfeed_full.xml', category: 'THREAT INTEL' },
  { name: 'Google Project Zero', rssUrl: 'https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss', category: 'RESEARCH' },
  { name: 'Google Online Security', rssUrl: 'https://feeds.feedburner.com/GoogleOnlineSecurityBlog', category: 'RESEARCH' },
  { name: 'Google TAG', rssUrl: 'https://blog.google/threat-analysis-group/rss/', category: 'RESEARCH', active: false, brokenReason: 'HTTP 404, folded into blog.google' },
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
  { name: 'Packet Storm', rssUrl: 'https://rss.packetstormsecurity.com/files/', category: 'EXPLOIT', active: false, brokenReason: 'TLS cert does not match hostname' },
  { name: 'CyberNews', rssUrl: 'https://cybernews.com/feed/', category: 'THREAT INTEL', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'Darknet', rssUrl: 'http://feeds.feedburner.com/darknethackers', category: 'THREAT INTEL' },
  { name: 'Sploitus', rssUrl: 'https://sploitus.com/rss', category: 'EXPLOIT' },
  { name: 'Seebug', rssUrl: 'https://www.seebug.org/rss/new/', category: 'VULNERABILITY' },
  { name: 'Bugtraq', rssUrl: 'http://seclists.org/rss/bugtraq.rss', category: 'VULNERABILITY' },
  { name: 'CXSecurity', rssUrl: 'https://cxsecurity.com/wlb/rss/all/', category: 'VULNERABILITY' },
  { name: 'Security Boulevard', rssUrl: 'https://securityboulevard.com/feed/', category: 'INDUSTRY', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'HackerOne Hacktivity', rssUrl: 'https://rss.ricterz.me/hacktivity', category: 'VULNERABILITY' },
  { name: 'InfoSec Write-ups', rssUrl: 'https://infosecwriteups.com/feed', category: 'RESEARCH' },
  { name: 'STAR Labs', rssUrl: 'https://starlabs.sg/publications/index.xml', category: 'RESEARCH' },
  { name: 'Der Flounder', rssUrl: 'https://derflounder.wordpress.com/feed/', category: 'VULNERABILITY' },
  { name: 'Attify Blog', rssUrl: 'https://blog.attify.com/rss/', category: 'IOT' },
  { name: 'Anquanke', rssUrl: 'https://api.anquanke.com/data/v1/rss', category: 'THREAT INTEL' },
  { name: '4hou', rssUrl: 'https://www.4hou.com/feed', category: 'THREAT INTEL' },
  { name: 'tttang', rssUrl: 'https://www.tttang.com/rss.xml', category: 'RESEARCH', active: false, brokenReason: 'connection refused' },
  { name: 'paper - Last paper', rssUrl: 'https://paper.seebug.org/rss/', category: 'RESEARCH' },
  { name: 'NSFocus', rssUrl: 'http://blog.nsfocus.net/feed/', category: 'VULNERABILITY' },
  { name: 'Tencent Xuanwu Lab', rssUrl: 'https://xlab.tencent.com/cn/feed/', category: 'RESEARCH' },
  { name: 'Trickest CVE', rssUrl: 'https://github.com/trickest/cve/commits/main.atom', category: 'VULNERABILITY' },
  { name: 'HackerNews.cc', rssUrl: 'http://hackernews.cc/feed', category: 'THREAT INTEL' },
  { name: 'Cybersecurity News', rssUrl: 'https://securityonline.info/feed/', category: 'THREAT INTEL' },
  { name: 'Infosecurity Magazine', rssUrl: 'http://www.infosecurity-magazine.com/rss/news/', category: 'INDUSTRY' },
  { name: 'RedPacket Security', rssUrl: 'https://www.redpacketsecurity.com/feed/', category: 'THREAT INTEL' },
  { name: 'Cyber Kendra', rssUrl: 'https://www.cyberkendra.com/feeds/posts/default', category: 'THREAT INTEL', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'Vulners', rssUrl: 'https://vulners.com/rss.xml', category: 'VULNERABILITY' },
  { name: 'VulDB', rssUrl: 'https://vuldb.com/en/?rss.recent', category: 'VULNERABILITY', active: false, brokenReason: 'HTTP 403 (bot protection)' },
  { name: 'CERT Vulnerability Notes', rssUrl: 'http://www.kb.cert.org/vulfeed', category: 'VULNERABILITY' },
  { name: 'Trail of Bits', rssUrl: 'https://blog.trailofbits.com/feed/', category: 'RESEARCH' },
  { name: 'Intigriti', rssUrl: 'https://blog.intigriti.com/feed/', category: 'VULNERABILITY' },
  { name: 'Praetorian', rssUrl: 'https://www.praetorian.com/blog/feed', category: 'VULNERABILITY' },
  { name: 'Appsecco', rssUrl: 'https://blog.appsecco.com/feed', category: 'VULNERABILITY', active: false, brokenReason: 'serves HTML, feed removed' },
  { name: 'Troy Hunt', rssUrl: 'https://www.troyhunt.com/rss/', category: 'DATA BREACH' },
  { name: 'Hacker News Frontpage', rssUrl: 'https://hnrss.org/frontpage', category: 'TECH' },

  /* Curated from github.com/zer0yu/CyberSecurityRSS. Of its 453 feeds we did
     not already carry, 296 were live; these are the security-focused,
     non-proxied ones verified to return parsable items on 2026-10-26. */
  { name: 'Kali Linux', rssUrl: 'https://www.kali.org/rss.xml', category: 'TECH' },
  { name: 'Google Bug Hunters', rssUrl: 'https://bughunters.google.com/feed/en', category: 'RESEARCH' },
  { name: 'NVISO Labs', rssUrl: 'https://blog.nviso.eu/feed/', category: 'RESEARCH' },
  { name: 'XPN InfoSec Blog', rssUrl: 'https://blog.xpnsec.com/rss/', category: 'RESEARCH' },
  { name: 'S3cur3Th1sSh1t', rssUrl: 'https://s3cur3th1ssh1t.github.io/feed.xml', category: 'RESEARCH' },
  { name: 'MaskRay', rssUrl: 'https://maskray.me/blog/atom.xml', category: 'RESEARCH' },
  { name: 'Fuzzing Labs', rssUrl: 'https://webassembly-security.com/feed/', category: 'RESEARCH' },
  { name: 'Wallarm Lab', rssUrl: 'https://lab.wallarm.com/feed/', category: 'VULNERABILITY' },
  { name: 'Telekom Security', rssUrl: 'https://github.security.telekom.com/atom.xml', category: 'VULNERABILITY' },
  { name: 'Shubham Shah', rssUrl: 'https://shubs.io/rss/', category: 'VULNERABILITY' },
  { name: 'Joseph Thacker', rssUrl: 'https://rez0.blog/feed.xml', category: 'VULNERABILITY' },
  { name: 'Yassine Aboukir', rssUrl: 'https://www.yassineaboukir.com/feed.xml', category: 'VULNERABILITY', active: false, brokenReason: 'malformed XML entity' },
  { name: 'GuidePoint Security', rssUrl: 'https://www.guidepointsecurity.com/feed/', category: 'THREAT INTEL' },
  { name: 'ThreatCluster', rssUrl: 'https://threatcluster.io/feed.xml', category: 'THREAT INTEL' },
];

export function seedSources() {
  const db = getDb();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO sources (name, rss_url, category, active, custom) VALUES (?, ?, ?, ?, 0)`
  );

  /* Built-in feeds move and break, so the shipped URL must win over whatever
     an existing database holds. Without this, fixing a URL here would only
     ever reach fresh installs. User-added sources (custom = 1) are untouched,
     and `active` is left alone so a user's own enable/disable choice sticks. */
  const refresh = db.prepare(
    `UPDATE sources SET rss_url = ?, category = ? WHERE name = ? AND custom = 0 AND rss_url <> ?`
  );

  let inserted = 0;
  let updated = 0;

  const run = db.transaction(() => {
    for (const source of RSS_SOURCES) {
      const active = source.active === false ? 0 : 1;
      const res = insert.run(source.name, source.rssUrl, source.category, active);
      if (res.changes > 0) {
        inserted++;
        continue;
      }
      const upd = refresh.run(source.rssUrl, source.category, source.name, source.rssUrl);
      if (upd.changes > 0) updated++;
    }
  });

  run();

  console.log(
    `[DB] Seeded ${RSS_SOURCES.length} RSS sources (${inserted} new, ${updated} URL${updated === 1 ? '' : 's'} refreshed)`
  );
}
