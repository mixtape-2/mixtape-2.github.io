export interface ThemeScheme {
  id: string;
  name: string;
  primary: string;
  rgb: string;
  secondary: string;
  accent: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const THEME_SCHEMES: ThemeScheme[] = [
  {
    id: 'ember-obsidian',
    name: 'Obsidiana & Rojo Anaranjado',
    primary: '#ea4c23',
    rgb: '234, 76, 35',
    secondary: '#d13d19',
    accent: '#ea4c23',
    gradient: 'linear-gradient(135deg, #ea4c23 0%, #c83b18 100%)',
    badgeBg: 'rgba(234, 76, 35, 0.13)',
    badgeText: '#f0633e',
    badgeBorder: 'rgba(234, 76, 35, 0.30)',
  },
];
