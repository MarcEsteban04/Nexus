interface InstitutionBadge {
  keywords: string[];
  label: string;
  className: string;
}

const INSTITUTIONS: InstitutionBadge[] = [
  { keywords: ['gcash'], label: 'GC', className: 'bg-[#0072CE]/20 text-[#3399ff]' },
  { keywords: ['maya', 'paymaya'], label: 'MA', className: 'bg-[#00C16E]/20 text-[#22d98a]' },
  { keywords: ['bdo'], label: 'BDO', className: 'bg-[#003DA5]/20 text-[#5b8fe6]' },
  { keywords: ['bpi'], label: 'BPI', className: 'bg-[#CC092F]/20 text-[#f0405f]' },
  { keywords: ['metrobank'], label: 'MB', className: 'bg-[#003876]/20 text-[#5b8fe6]' },
  { keywords: ['unionbank', 'union bank'], label: 'UB', className: 'bg-[#F7941D]/20 text-[#ffab3d]' },
  { keywords: ['landbank'], label: 'LB', className: 'bg-[#00693E]/20 text-[#22b579]' },
  { keywords: ['security bank'], label: 'SB', className: 'bg-[#0F2A5F]/20 text-[#5b8fe6]' },
  { keywords: ['rcbc'], label: 'RCBC', className: 'bg-[#FFC20E]/20 text-[#ffd54f]' },
  { keywords: ['pnb', 'philippine national bank'], label: 'PNB', className: 'bg-[#7A1E24]/20 text-[#e0616a]' },
  { keywords: ['chinabank', 'china bank'], label: 'CB', className: 'bg-[#B0272D]/20 text-[#f0616a]' },
  { keywords: ['gotyme'], label: 'GT', className: 'bg-[#6B2D90]/20 text-[#c98ef0]' },
  { keywords: ['shopeepay', 'shopee pay', 'shopee'], label: 'SP', className: 'bg-[#EE4D2D]/20 text-[#ff8a5c]' },
  { keywords: ['grabpay', 'grab pay', 'grab'], label: 'GP', className: 'bg-[#00B14F]/20 text-[#22d98a]' },
  { keywords: ['coins.ph', 'coins ph'], label: 'CO', className: 'bg-[#0052FF]/20 text-[#5b8fe6]' },
  { keywords: ['eastwest'], label: 'EW', className: 'bg-[#E4002B]/20 text-[#f0616a]' },
  { keywords: ['maybank'], label: 'MY', className: 'bg-[#FFC72C]/20 text-[#ffd54f]' },
];

export function getInstitutionBadge(institution: string): InstitutionBadge | null {
  const q = institution.trim().toLowerCase();
  if (!q) return null;
  return INSTITUTIONS.find((entry) => entry.keywords.some((k) => q.includes(k))) ?? null;
}
