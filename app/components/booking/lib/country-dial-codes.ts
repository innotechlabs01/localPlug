export interface CountryDialCode {
  code: string
  dialCode: string
  name: string
  flag: string
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: 'US', dialCode: '1', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', dialCode: '1', name: 'Canada', flag: '🇨🇦' },
  { code: 'MX', dialCode: '52', name: 'México', flag: '🇲🇽' },
  { code: 'CO', dialCode: '57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', dialCode: '54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BR', dialCode: '55', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CL', dialCode: '56', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', dialCode: '51', name: 'Perú', flag: '🇵🇪' },
  { code: 'EC', dialCode: '593', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'VE', dialCode: '58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CR', dialCode: '506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', dialCode: '507', name: 'Panamá', flag: '🇵🇦' },
  { code: 'GT', dialCode: '502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CU', dialCode: '53', name: 'Cuba', flag: '🇨🇺' },
  { code: 'DO', dialCode: '1-809', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'PR', dialCode: '1-787', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'UY', dialCode: '598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', dialCode: '595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BO', dialCode: '591', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'HN', dialCode: '504', name: 'Honduras', flag: '🇭🇳' },
  { code: 'SV', dialCode: '503', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'NI', dialCode: '505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'ES', dialCode: '34', name: 'España', flag: '🇪🇸' },
  { code: 'GB', dialCode: '44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', dialCode: '33', name: 'France', flag: '🇫🇷' },
  { code: 'DE', dialCode: '49', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', dialCode: '39', name: 'Italia', flag: '🇮🇹' },
  { code: 'PT', dialCode: '351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', dialCode: '31', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', dialCode: '32', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', dialCode: '41', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', dialCode: '46', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', dialCode: '47', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', dialCode: '45', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', dialCode: '358', name: 'Finland', flag: '🇫🇮' },
  { code: 'IE', dialCode: '353', name: 'Ireland', flag: '🇮🇪' },
  { code: 'AT', dialCode: '43', name: 'Austria', flag: '🇦🇹' },
  { code: 'PL', dialCode: '48', name: 'Poland', flag: '🇵🇱' },
  { code: 'RU', dialCode: '7', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', dialCode: '380', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AU', dialCode: '61', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', dialCode: '64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'JP', dialCode: '81', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', dialCode: '82', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', dialCode: '86', name: 'China', flag: '🇨🇳' },
  { code: 'IN', dialCode: '91', name: 'India', flag: '🇮🇳' },
  { code: 'IL', dialCode: '972', name: 'Israel', flag: '🇮🇱' },
  { code: 'ZA', dialCode: '27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AE', dialCode: '971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SG', dialCode: '65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'HK', dialCode: '852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TW', dialCode: '886', name: 'Taiwan', flag: '🇹🇼' },
]

export function getDialCodeForCountry(code: string): string {
  return COUNTRY_DIAL_CODES.find((c) => c.code === code)?.dialCode ?? ''
}

export function getCountryForDialCode(
  dialCode: string,
): CountryDialCode | undefined {
  return COUNTRY_DIAL_CODES.find((c) => c.dialCode === dialCode)
}

export function formatPhoneValue(dialCode: string, number: string): string {
  const digits = number.replace(/\D/g, '')
  if (!digits) return ''
  return `+${dialCode}${digits}`
}
