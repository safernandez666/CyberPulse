export interface Source {
  id: string;
  name: string;
  count: number;
  active: boolean;
}

export const defaultSources: Source[] = [
  // Tier 1: Mainstream English
  { id: '1', name: 'The Hacker News', count: 142, active: true },
  { id: '2', name: 'BleepingComputer', count: 128, active: true },
  { id: '3', name: 'Dark Reading', count: 62, active: true },
  { id: '4', name: 'SecurityWeek', count: 87, active: true },
  { id: '5', name: 'Ars Technica Security', count: 38, active: true },
  { id: '6', name: 'Krebs on Security', count: 56, active: true },
  { id: '7', name: 'The Record', count: 34, active: true },
  { id: '8', name: 'Threatpost', count: 45, active: true },
  { id: '9', name: 'CISA Advisories', count: 29, active: true },
  { id: '10', name: 'CyberScoop', count: 53, active: true },

  // Tier 2: Enterprise & Research
  { id: '11', name: 'PortSwigger Blog', count: 17, active: true },
  { id: '12', name: 'SANS ISC', count: 41, active: true },
  { id: '13', name: 'Google Project Zero', count: 12, active: true },
  { id: '14', name: 'CrowdStrike Blog', count: 36, active: true },
  { id: '15', name: 'Mandiant', count: 22, active: true },
  { id: '16', name: 'Microsoft Security', count: 64, active: true },
  { id: '17', name: 'Sophos News', count: 31, active: true },
  { id: '18', name: 'Tenable Blog', count: 28, active: true },
  { id: '19', name: 'Rapid7 Blog', count: 25, active: true },
  { id: '20', name: 'Qualys Blog', count: 19, active: true },

  // Tier 3: Government & Policy
  { id: '21', name: 'CERT-EU', count: 33, active: true },
  { id: '22', name: 'NSA Cybersecurity', count: 15, active: true },
  { id: '23', name: 'ENISA', count: 20, active: true },
  { id: '24', name: 'FBI Cyber', count: 11, active: true },
  { id: '25', name: 'Cybersecurity Dive', count: 42, active: true },

  // Tier 4: Vendor Security Blogs
  { id: '26', name: 'Fortinet Blog', count: 27, active: true },
  { id: '27', name: 'Palo Alto Networks', count: 35, active: true },
  { id: '28', name: 'Check Point Blog', count: 23, active: true },
  { id: '29', name: 'Kaspersky Blog', count: 18, active: true },
  { id: '30', name: 'Bitdefender', count: 16, active: true },

  // Tier 5: Spanish Sources
  { id: '31', name: 'INCIBE', count: 44, active: true },
  { id: '32', name: 'CCN-CERT', count: 26, active: true },
  { id: '33', name: 'OSI', count: 38, active: true },
  { id: '34', name: 'RedesZone', count: 58, active: true },
  { id: '35', name: 'WeLiveSecurity', count: 21, active: true },
];
