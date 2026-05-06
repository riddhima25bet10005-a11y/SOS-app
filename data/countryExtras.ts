// Auto-generate additional helplines for countries without custom extras
import { EmergencyNumber } from './emergencyNumbers';

const REGIONAL_EXTRAS: Record<string, { name: string; number: string }[]> = {
  // South Asia
  AF: [{ name: 'Red Crescent', number: '166' }],
  BD: [{ name: 'Women & Child', number: '10921' }, { name: 'Anti-Corruption', number: '106' }, { name: 'National Info', number: '333' }],
  BT: [{ name: 'Royal Police', number: '113' }, { name: 'Health Info', number: '112' }],
  NP: [{ name: 'Women Helpline', number: '1145' }, { name: 'Child Helpline', number: '1098' }, { name: 'Tourist Police', number: '1144' }],
  LK: [{ name: 'Women Helpline', number: '1938' }, { name: 'Child Helpline', number: '1929' }, { name: 'Poison Info', number: '011-2686143' }],
  MV: [{ name: 'Gender Violence', number: '1412' }, { name: 'Child Helpline', number: '1412' }],

  // Middle East
  BH: [{ name: 'Women Helpline', number: '80008001' }, { name: 'Child Protection', number: '998' }],
  IQ: [{ name: 'Human Rights', number: '161' }, { name: 'Anti-Terrorism', number: '130' }],
  IR: [{ name: 'Social Emergency', number: '123' }, { name: 'Drug Control', number: '114' }],
  JO: [{ name: 'Family Protection', number: '110' }, { name: 'Traffic Accidents', number: '190' }],
  KW: [{ name: 'Anti-Drug', number: '1884111' }, { name: 'Child Helpline', number: '147' }],
  LB: [{ name: 'Women Helpline', number: '1745' }, { name: 'Drug Helpline', number: '1700' }],
  OM: [{ name: 'Royal Oman Police', number: '9999' }, { name: 'Tourist Police', number: '1699' }],
  QA: [{ name: 'Child Helpline', number: '919' }, { name: 'Traffic Police', number: '2347444' }],
  SA: [{ name: 'Child Protection', number: '116111' }, { name: 'Women Abuse', number: '1919' }, { name: 'Drug Report', number: '995' }],
  SY: [{ name: 'Civil Defence', number: '113' }, { name: 'Red Crescent', number: '5765' }],
  YE: [{ name: 'Red Crescent', number: '191' }, { name: 'Civil Defence', number: '193' }],

  // East & Southeast Asia
  CN: [{ name: 'Women & Child', number: '12338' }, { name: 'Traffic Accident', number: '122' }, { name: 'Consumer Rights', number: '12315' }],
  HK: [{ name: 'Social Welfare', number: '2343-2255' }, { name: 'Poison Info', number: '2772-2211' }],
  ID: [{ name: 'Women Helpline', number: '129' }, { name: 'Child Helpline', number: '129' }, { name: 'Anti-Drug', number: '184' }],
  KH: [{ name: 'Child Helpline', number: '1280' }, { name: 'Tourist Police', number: '1294' }],
  LA: [{ name: 'Tourist Police', number: '021-251128' }, { name: 'Red Cross', number: '021-256267' }],
  MM: [{ name: 'Red Cross', number: '01-383680' }, { name: 'Women Affairs', number: '067-404283' }],
  MN: [{ name: 'Child Helpline', number: '108' }, { name: 'Women Helpline', number: '107' }],
  MY: [{ name: 'Women Helpline', number: '15999' }, { name: 'Child Helpline', number: '15999' }, { name: 'Anti-Drug', number: '15688' }],
  PH: [{ name: 'Women Helpline', number: '1343' }, { name: 'Child Helpline', number: '163' }, { name: 'Red Cross', number: '143' }],
  SG: [{ name: 'Women Helpline', number: '1800-777-5555' }, { name: 'Child Abuse', number: '1800-778-0000' }, { name: 'Mental Health', number: '6389-2222' }],
  TH: [{ name: 'Tourist Police', number: '1155' }, { name: 'Child Helpline', number: '1387' }, { name: 'Mental Health', number: '1323' }],
  TW: [{ name: 'Women Helpline', number: '113' }, { name: 'Poison Control', number: '02-28717121' }],
  VN: [{ name: 'Child Helpline', number: '111' }, { name: 'Women Helpline', number: '1800-1567' }],
  BN: [{ name: 'Women Helpline', number: '141' }, { name: 'Drug Report', number: '123' }],

  // Europe
  AL: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '116-117' }],
  AT: [{ name: 'Women Helpline', number: '0800-222-555' }, { name: 'Child Helpline', number: '147' }, { name: 'Poison Info', number: '01-4064343' }],
  AZ: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '860' }],
  BA: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Blue Phone', number: '080-05-1305' }],
  BE: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Suicide Line', number: '0800-32-123' }, { name: 'Poison Control', number: '070-245-245' }],
  BG: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0800-18-676' }],
  BY: [{ name: 'Child Helpline', number: '8017-246-03-28' }, { name: 'Crisis Line', number: '8017-352-44-44' }],
  CH: [{ name: 'Child Helpline', number: '147' }, { name: 'DV Helpline', number: '143' }, { name: 'Poison Info', number: '145' }],
  CY: [{ name: 'Child Helpline', number: '116-111' }, { name: 'DV Helpline', number: '1440' }],
  CZ: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '116-123' }],
  DK: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '70-201-201' }],
  EE: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '655-8088' }],
  ES: [{ name: 'Women Helpline', number: '016' }, { name: 'Child Helpline', number: '116-111' }, { name: 'Suicide Line', number: '024' }],
  FI: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '09-2525-0111' }],
  GE: [{ name: 'Child Helpline', number: '116-111' }, { name: 'DV Helpline', number: '2-309-903' }],
  GR: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women SOS', number: '15900' }],
  HR: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0800-655-222' }],
  HU: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '116-123' }],
  IE: [{ name: 'Childline', number: '1800-666-666' }, { name: 'Women Aid', number: '1800-341-900' }, { name: 'Samaritans', number: '116-123' }],
  IS: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Red Cross', number: '1717' }],
  IT: [{ name: 'Child Helpline', number: '114' }, { name: 'Anti-Violence', number: '1522' }, { name: 'Anti-Drug', number: '800-186-070' }],
  LT: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '8-800-66-366' }],
  LU: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '12-2060' }],
  LV: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '67-222-922' }],
  MD: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0-8008-8008' }],
  NL: [{ name: 'Child Helpline', number: '116-111' }, { name: 'DV Helpline', number: '0800-2000' }, { name: 'Suicide Line', number: '113' }],
  NO: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '22-400-040' }],
  PL: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '800-120-002' }, { name: 'Suicide Line', number: '116-123' }],
  PT: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '800-202-148' }],
  RO: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0800-500-333' }],
  RS: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women SOS', number: '0800-222-003' }],
  RU: [{ name: 'Child Helpline', number: '8-800-2000-122' }, { name: 'Women Crisis', number: '8-495-282-8427' }],
  SE: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '020-505-050' }, { name: 'Suicide Line', number: '90-101' }],
  SI: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Crisis Line', number: '01-520-99-00' }],
  SK: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0800-212-212' }],
  TR: [{ name: 'Women Helpline', number: '183' }, { name: 'Child Helpline', number: '183' }, { name: 'Poison Info', number: '114' }],
  UA: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0-800-500-335' }, { name: 'Crisis Line', number: '7333' }],

  // Americas
  AR: [{ name: 'Women Helpline', number: '144' }, { name: 'Child Helpline', number: '102' }, { name: 'Suicide Line', number: '135' }],
  BO: [{ name: 'Women Helpline', number: '800-140-348' }, { name: 'Child Helpline', number: '156' }],
  BR: [{ name: 'Women Helpline', number: '180' }, { name: 'Child Helpline', number: '100' }, { name: 'SAMU Health', number: '192' }, { name: 'Suicide CVV', number: '188' }],
  CL: [{ name: 'Women Helpline', number: '1455' }, { name: 'Child Helpline', number: '147' }, { name: 'Suicide Line', number: '600-360-7777' }],
  CO: [{ name: 'Women Helpline', number: '155' }, { name: 'Child Helpline', number: '141' }],
  CR: [{ name: 'Women Helpline', number: '911' }, { name: 'Child Helpline', number: '1147' }],
  CU: [{ name: 'Anti-Drug', number: '103' }, { name: 'Lifeline', number: '838-2528' }],
  DO: [{ name: 'Women Helpline', number: '809-689-7212' }, { name: 'Child Helpline', number: '809-200-1202' }],
  EC: [{ name: 'Women Helpline', number: '1800-000-443' }, { name: 'Child Helpline', number: '133' }],
  GT: [{ name: 'Women Helpline', number: '1572' }, { name: 'Child Helpline', number: '1546' }],
  HN: [{ name: 'Women Helpline', number: '114' }, { name: 'Child Helpline', number: '111' }],
  JM: [{ name: 'Child Helpline', number: '888-732-4357' }, { name: 'Women Crisis', number: '929-0793' }],
  MX: [{ name: 'Women Helpline', number: '800-911-2511' }, { name: 'Child Helpline', number: '800-422-2463' }, { name: 'Suicide Line', number: '800-290-0024' }],
  NI: [{ name: 'Women Helpline', number: '133' }, { name: 'Red Cross', number: '2265-1307' }],
  PA: [{ name: 'Women Helpline', number: '182' }, { name: 'Child Helpline', number: '147' }],
  PE: [{ name: 'Women Helpline', number: '100' }, { name: 'Child Helpline', number: '1810' }],
  PY: [{ name: 'Women Helpline', number: '137' }, { name: 'Child Helpline', number: '147' }],
  SV: [{ name: 'Women Helpline', number: '126' }, { name: 'Child Helpline', number: '123' }],
  UY: [{ name: 'Women Helpline', number: '0800-4141' }, { name: 'Child Helpline', number: '0800-5050' }],
  VE: [{ name: 'Women Helpline', number: '0800-MUJERES' }, { name: 'Child Helpline', number: '0800-NIÑOS' }],

  // Africa
  CM: [{ name: 'Child Helpline', number: '116' }, { name: 'Red Cross', number: '119' }],
  DZ: [{ name: 'Women Helpline', number: '3021' }, { name: 'Child Helpline', number: '1111' }],
  EG: [{ name: 'Women Helpline', number: '08008880700' }, { name: 'Child Helpline', number: '16000' }, { name: 'Tourist Police', number: '126' }],
  ET: [{ name: 'Women Helpline', number: '0800-80-1212' }, { name: 'Red Cross', number: '011-515-38-53' }],
  GH: [{ name: 'Women Helpline', number: '0800-111-222' }, { name: 'Child Helpline', number: '0800-800-800' }],
  KE: [{ name: 'Child Helpline', number: '116' }, { name: 'Gender Violence', number: '1195' }],
  LY: [{ name: 'Red Crescent', number: '1515' }, { name: 'Civil Defence', number: '193' }],
  MA: [{ name: 'Women Helpline', number: '8350' }, { name: 'Child Helpline', number: '0800-00-55-55' }],
  MZ: [{ name: 'Child Helpline', number: '116' }, { name: 'Women Helpline', number: '800-300' }],
  NG: [{ name: 'Child Helpline', number: '0800-2255-4453' }, { name: 'Women Helpline', number: '0800-0333-333' }],
  SD: [{ name: 'Red Crescent', number: '998' }, { name: 'Child Helpline', number: '9696' }],
  SN: [{ name: 'Child Helpline', number: '116' }, { name: 'Red Cross', number: '33-823-3992' }],
  TN: [{ name: 'Child Helpline', number: '1809' }, { name: 'Women Helpline', number: '1899' }],
  TZ: [{ name: 'Child Helpline', number: '116' }, { name: 'Women Helpline', number: '114' }],
  UG: [{ name: 'Child Helpline', number: '116' }, { name: 'Women Helpline', number: '0800-111-221' }],
  ZA: [{ name: 'Women Helpline', number: '0800-150-150' }, { name: 'Child Helpline', number: '0800-055-555' }, { name: 'Suicide Line', number: '0800-567-567' }],
  ZM: [{ name: 'Child Helpline', number: '116' }, { name: 'Women Helpline', number: '933' }],
  ZW: [{ name: 'Child Helpline', number: '116' }, { name: 'Women Helpline', number: '08080257' }],

  // Oceania
  FJ: [{ name: 'Women Crisis', number: '1560' }, { name: 'Child Helpline', number: '1325' }],
  NZ: [{ name: 'Lifeline', number: '0800-543-354' }, { name: 'Women Refuge', number: '0800-733-843' }, { name: 'Youth Line', number: '0800-376-633' }],

  // Central Asia
  AM: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '0800-80-850' }],
  KZ: [{ name: 'Child Helpline', number: '150' }, { name: 'Women Crisis', number: '1414' }],
  KP: [{ name: 'Red Cross', number: '850-2-381-7350' }],
  UZ: [{ name: 'Child Helpline', number: '116-111' }, { name: 'Women Helpline', number: '1146' }],
  IL: [{ name: 'Women Helpline', number: '1202' }, { name: 'Child Helpline', number: '118' }, { name: 'Suicide Line', number: '1201' }],
};

export function getExtrasForCountry(country: EmergencyNumber): { name: string; number: string }[] {
  // Return country-specific extras if they exist in the data
  if (country.extras && country.extras.length > 0) {
    return country.extras;
  }
  // Otherwise return regional extras
  return REGIONAL_EXTRAS[country.code] || [];
}
