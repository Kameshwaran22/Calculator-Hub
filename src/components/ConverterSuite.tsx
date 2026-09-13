import React, { useState, useEffect } from 'react';
import {
  Coins,
  Ruler,
  Weight,
  Square,
  Clock,
  HardDrive,
  Tag,
  Box,
  Binary,
  Gauge,
  Thermometer,
  Scale,
  Receipt,
  ArrowLeft,
  ChevronsUpDown,
  Delete,
  User,
  Mars,
  Venus,
  Check,
  Search,
  X,
  Hash,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

export type ConverterCategory =
  | 'currency'
  | 'number_scale'
  | 'length'
  | 'mass'
  | 'area'
  | 'time'
  | 'data'
  | 'discount'
  | 'volume'
  | 'numeral'
  | 'speed'
  | 'temperature'
  | 'bmi'
  | 'gst';

interface GridOption {
  id: ConverterCategory;
  label: string;
  icon: React.ReactNode;
}

// Unit definitions for all categories
interface UnitDef {
  key: string;
  name: string;
  symbol: string;
  ratio: number; // relative to base unit
  offset?: number; // for temperature
}

const CATEGORY_UNITS: Record<string, UnitDef[]> = {
  currency: [
    { key: 'USD', name: 'United States dollar', symbol: 'USD', ratio: 1 },
    { key: 'EUR', name: 'Euro', symbol: 'EUR', ratio: 0.92 },
    { key: 'HKD', name: 'Hong Kong dollar', symbol: 'HKD', ratio: 7.81 },
    { key: 'JPY', name: 'Japanese yen', symbol: 'JPY', ratio: 154.8 },
    { key: 'CNY', name: 'Chinese yuan', symbol: 'CNY', ratio: 7.24 },
    { key: 'AFN', name: 'Afghan afghani', symbol: 'AFN', ratio: 70.5 },
    { key: 'DZD', name: 'Algerian dinar', symbol: 'DZD', ratio: 134.2 },
    { key: 'ARS', name: 'Argentine peso', symbol: 'ARS', ratio: 935.0 },
    { key: 'AUD', name: 'Australian dollar', symbol: 'AUD', ratio: 1.52 },
    { key: 'AZN', name: 'Azerbaijani manat', symbol: 'AZN', ratio: 1.70 },
    { key: 'BSD', name: 'Bahamian dollar', symbol: 'BSD', ratio: 1.00 },
    { key: 'BHD', name: 'Bahraini dinar', symbol: 'BHD', ratio: 0.376 },
    { key: 'BDT', name: 'Bangladeshi taka', symbol: 'BDT', ratio: 117.5 },
    { key: 'BBD', name: 'Barbadian dollar', symbol: 'BBD', ratio: 2.00 },
    { key: 'BYN', name: 'Belarusian ruble', symbol: 'BYN', ratio: 3.27 },
    { key: 'BMD', name: 'Bermudian dollar', symbol: 'BMD', ratio: 1.00 },
    { key: 'BTN', name: 'Bhutanese ngultrum', symbol: 'BTN', ratio: 83.55 },
    { key: 'BOB', name: 'Bolivian boliviano', symbol: 'BOB', ratio: 6.91 },
    { key: 'BWP', name: 'Botswana pula', symbol: 'BWP', ratio: 13.6 },
    { key: 'BRL', name: 'Brazilian real', symbol: 'BRL', ratio: 5.45 },
    { key: 'GBP', name: 'British pound', symbol: 'GBP', ratio: 0.78 },
    { key: 'BND', name: 'Brunei dollar', symbol: 'BND', ratio: 1.35 },
    { key: 'BGN', name: 'Bulgarian lev', symbol: 'BGN', ratio: 1.80 },
    { key: 'MMK', name: 'Burmese kyat', symbol: 'MMK', ratio: 2098 },
    { key: 'KHR', name: 'Cambodian riel', symbol: 'KHR', ratio: 4095 },
    { key: 'CAD', name: 'Canadian dollar', symbol: 'CAD', ratio: 1.36 },
    { key: 'CLP', name: 'Chilean peso', symbol: 'CLP', ratio: 930 },
    { key: 'COP', name: 'Colombian peso', symbol: 'COP', ratio: 4050 },
    { key: 'CDF', name: 'Congolese franc', symbol: 'CDF', ratio: 2850 },
    { key: 'CRC', name: 'Costa Rican colón', symbol: 'CRC', ratio: 525 },
    { key: 'HRK', name: 'Croatian kuna', symbol: 'HRK', ratio: 6.93 },
    { key: 'CZK', name: 'Czech koruna', symbol: 'CZK', ratio: 23.2 },
    { key: 'DKK', name: 'Danish krone', symbol: 'DKK', ratio: 6.87 },
    { key: 'EGP', name: 'Egyptian pound', symbol: 'EGP', ratio: 48.2 },
    { key: 'ETB', name: 'Ethiopian birr', symbol: 'ETB', ratio: 57.5 },
    { key: 'FJD', name: 'Fijian dollar', symbol: 'FJD', ratio: 2.24 },
    { key: 'GEL', name: 'Georgian lari', symbol: 'GEL', ratio: 2.70 },
    { key: 'GHS', name: 'Ghanaian cedi', symbol: 'GHS', ratio: 15.2 },
    { key: 'GNF', name: 'Guinean franc', symbol: 'GNF', ratio: 8600 },
    { key: 'HUF', name: 'Hungarian forint', symbol: 'HUF', ratio: 360 },
    { key: 'ISK', name: 'Icelandic króna', symbol: 'ISK', ratio: 138 },
    { key: 'INR', name: 'Indian rupee', symbol: 'INR', ratio: 83.55 },
    { key: 'IDR', name: 'Indonesian rupiah', symbol: 'IDR', ratio: 16200 },
    { key: 'IRR', name: 'Iranian rial', symbol: 'IRR', ratio: 42000 },
    { key: 'IQD', name: 'Iraqi dinar', symbol: 'IQD', ratio: 1310 },
    { key: 'ILS', name: 'Israeli new shekel', symbol: 'ILS', ratio: 3.65 },
    { key: 'JMD', name: 'Jamaican dollar', symbol: 'JMD', ratio: 156 },
    { key: 'JOD', name: 'Jordanian dinar', symbol: 'JOD', ratio: 0.709 },
    { key: 'KZT', name: 'Kazakhstani tenge', symbol: 'KZT', ratio: 475 },
    { key: 'KES', name: 'Kenyan shilling', symbol: 'KES', ratio: 129 },
    { key: 'KWD', name: 'Kuwaiti dinar', symbol: 'KWD', ratio: 0.306 },
    { key: 'KGS', name: 'Kyrgyzstani som', symbol: 'KGS', ratio: 86.5 },
    { key: 'LAK', name: 'Lao kip', symbol: 'LAK', ratio: 22000 },
    { key: 'LBP', name: 'Lebanese pound', symbol: 'LBP', ratio: 89500 },
    { key: 'LRD', name: 'Liberian dollar', symbol: 'LRD', ratio: 194 },
    { key: 'LYD', name: 'Libyan dinar', symbol: 'LYD', ratio: 4.85 },
    { key: 'MOP', name: 'Macanese pataca', symbol: 'MOP', ratio: 8.04 },
    { key: 'MYR', name: 'Malaysian ringgit', symbol: 'MYR', ratio: 4.68 },
    { key: 'MVR', name: 'Maldivian rufiyaa', symbol: 'MVR', ratio: 15.4 },
    { key: 'MUR', name: 'Mauritian rupee', symbol: 'MUR', ratio: 46.5 },
    { key: 'MXN', name: 'Mexican peso', symbol: 'MXN', ratio: 18.2 },
    { key: 'MDL', name: 'Moldovan leu', symbol: 'MDL', ratio: 17.8 },
    { key: 'MNT', name: 'Mongolian tögrög', symbol: 'MNT', ratio: 3380 },
    { key: 'MAD', name: 'Moroccan dirham', symbol: 'MAD', ratio: 9.92 },
    { key: 'NAD', name: 'Namibian dollar', symbol: 'NAD', ratio: 18.2 },
    { key: 'NPR', name: 'Nepalese rupee', symbol: 'NPR', ratio: 133.6 },
    { key: 'TWD', name: 'New Taiwan dollar', symbol: 'TWD', ratio: 32.5 },
    { key: 'NZD', name: 'New Zealand dollar', symbol: 'NZD', ratio: 1.66 },
    { key: 'NGN', name: 'Nigerian naira', symbol: 'NGN', ratio: 1520 },
    { key: 'NOK', name: 'Norwegian krone', symbol: 'NOK', ratio: 10.7 },
    { key: 'CNH', name: 'Offshore RMB', symbol: 'CNH', ratio: 7.26 },
    { key: 'OMR', name: 'Omani rial', symbol: 'OMR', ratio: 0.385 },
    { key: 'PKR', name: 'Pakistani rupee', symbol: 'PKR', ratio: 278.5 },
    { key: 'PYG', name: 'Paraguayan guaraní', symbol: 'PYG', ratio: 7550 },
    { key: 'PEN', name: 'Peruvian sol', symbol: 'PEN', ratio: 3.73 },
    { key: 'PHP', name: 'Philippine peso', symbol: 'PHP', ratio: 58.5 },
    { key: 'PLN', name: 'Polish złoty', symbol: 'PLN', ratio: 3.95 },
    { key: 'QAR', name: 'Qatari riyal', symbol: 'QAR', ratio: 3.64 },
    { key: 'RON', name: 'Romanian leu', symbol: 'RON', ratio: 4.58 },
    { key: 'RUB', name: 'Russian ruble', symbol: 'RUB', ratio: 88.0 },
    { key: 'SAR', name: 'Saudi riyal', symbol: 'SAR', ratio: 3.75 },
    { key: 'RSD', name: 'Serbian dinar', symbol: 'RSD', ratio: 108 },
    { key: 'SCR', name: 'Seychellois rupee', symbol: 'SCR', ratio: 13.6 },
    { key: 'SGD', name: 'Singapore dollar', symbol: 'SGD', ratio: 1.35 },
    { key: 'ZAR', name: 'South African rand', symbol: 'ZAR', ratio: 18.2 },
    { key: 'KRW', name: 'South Korean won', symbol: 'KRW', ratio: 1380 },
    { key: 'LKR', name: 'Sri Lankan rupee', symbol: 'LKR', ratio: 304 },
    { key: 'SDG', name: 'Sudanese pound', symbol: 'SDG', ratio: 601 },
    { key: 'SEK', name: 'Swedish krona', symbol: 'SEK', ratio: 10.6 },
    { key: 'CHF', name: 'Swiss franc', symbol: 'CHF', ratio: 0.90 },
    { key: 'SYP', name: 'Syrian pound', symbol: 'SYP', ratio: 13000 },
    { key: 'TZS', name: 'Tanzanian shilling', symbol: 'TZS', ratio: 2680 },
    { key: 'THB', name: 'Thai baht', symbol: 'THB', ratio: 36.2 },
    { key: 'TND', name: 'Tunisian dinar', symbol: 'TND', ratio: 3.12 },
    { key: 'TRY', name: 'Turkish lira', symbol: 'TRY', ratio: 32.8 },
    { key: 'TMT', name: 'Turkmenistan manat', symbol: 'TMT', ratio: 3.50 },
    { key: 'UGX', name: 'Ugandan shilling', symbol: 'UGX', ratio: 3720 },
    { key: 'UAH', name: 'Ukrainian hryvnia', symbol: 'UAH', ratio: 40.8 },
    { key: 'AED', name: 'United Arab Emirates dirham', symbol: 'AED', ratio: 3.67 },
    { key: 'UYU', name: 'Uruguayan peso', symbol: 'UYU', ratio: 40.2 },
    { key: 'UZS', name: 'Uzbekistani soʻm', symbol: 'UZS', ratio: 12600 },
    { key: 'VND', name: 'Vietnamese đồng', symbol: 'VND', ratio: 25400 },
    { key: 'YER', name: 'Yemeni rial', symbol: 'YER', ratio: 250 },
    { key: 'ZMW', name: 'Zambian kwacha', symbol: 'ZMW', ratio: 25.8 },
  ],
  length: [
    { key: 'km', name: 'Kilometre', symbol: 'km', ratio: 1000 },
    { key: 'm', name: 'Metre', symbol: 'm', ratio: 1 },
    { key: 'dm', name: 'Decimeter', symbol: 'dm', ratio: 0.1 },
    { key: 'cm', name: 'Centimetre', symbol: 'cm', ratio: 0.01 },
    { key: 'mm', name: 'Millimetre', symbol: 'mm', ratio: 0.001 },
    { key: 'um', name: 'Micrometer', symbol: 'μm', ratio: 0.000001 },
    { key: 'nm', name: 'Nanometer', symbol: 'nm', ratio: 1e-9 },
    { key: 'pm', name: 'Picometer', symbol: 'pm', ratio: 1e-12 },
    { key: 'nmi', name: 'Nautical mile', symbol: 'nmi', ratio: 1852 },
    { key: 'mi', name: 'Mile', symbol: 'mi', ratio: 1609.344 },
    { key: 'fur', name: 'Furlong', symbol: 'fur', ratio: 201.168 },
    { key: 'ftm', name: 'Fathom', symbol: 'ftm', ratio: 1.8288 },
    { key: 'yd', name: 'Yard', symbol: 'yd', ratio: 0.9144 },
    { key: 'ft', name: 'Foot', symbol: 'ft', ratio: 0.3048 },
    { key: 'in', name: 'Inch', symbol: 'in', ratio: 0.0254 },
    { key: 'li', name: 'Li', symbol: 'li', ratio: 500 },
    { key: 'zhang', name: 'Zhang', symbol: 'zhang', ratio: 3.3333333333 },
    { key: 'chi', name: 'Chi', symbol: 'chi', ratio: 0.3333333333 },
    { key: 'cun', name: 'Cun', symbol: 'cun', ratio: 0.0333333333 },
    { key: 'fen', name: 'Fen', symbol: 'fen', ratio: 0.0033333333 },
    { key: 'lii', name: 'Lii', symbol: 'lii', ratio: 0.0003333333 },
    { key: 'hao', name: 'Hao', symbol: 'hao', ratio: 0.0000333333 },
    { key: 'pc', name: 'Parsec', symbol: 'pc', ratio: 3.085677581e16 },
    { key: 'ld', name: 'Lunar distance', symbol: 'ld', ratio: 3.844e8 },
    { key: 'au', name: 'Astronomical unit', symbol: '☉', ratio: 1.495978707e11 },
    { key: 'ly', name: 'Light year', symbol: 'ly', ratio: 9.4607304725808e15 },
  ],
  mass: [
    { key: 't', name: 'Tonne', symbol: 't', ratio: 1000 },
    { key: 'kg', name: 'Kilogram', symbol: 'kg', ratio: 1 },
    { key: 'g', name: 'Gram', symbol: 'g', ratio: 0.001 },
    { key: 'mg', name: 'Milligram', symbol: 'mg', ratio: 0.000001 },
    { key: 'ug', name: 'Microgram', symbol: 'μg', ratio: 1e-9 },
    { key: 'q', name: 'Quintal', symbol: 'q', ratio: 100 },
    { key: 'lb', name: 'Pound', symbol: 'lb', ratio: 0.45359237 },
    { key: 'oz', name: 'Ounce', symbol: 'oz', ratio: 0.028349523125 },
    { key: 'ct', name: 'Carat', symbol: 'ct', ratio: 0.0002 },
    { key: 'gr', name: 'Grain', symbol: 'gr', ratio: 0.00006479891 },
    { key: 'lt', name: 'Long ton', symbol: 'l.t', ratio: 1016.0469088 },
    { key: 'sht', name: 'Short ton', symbol: 'sh.t', ratio: 907.18474 },
    { key: 'uk_cwt', name: 'UK hundredweight', symbol: 'cwt', ratio: 50.80234544 },
    { key: 'us_cwt', name: 'US hundredweight', symbol: 'cwt', ratio: 45.359237 },
    { key: 'st', name: 'Stone', symbol: 'st', ratio: 6.35029318 },
    { key: 'dr', name: 'Dram', symbol: 'dr', ratio: 0.0017718451953125 },
    { key: 'dan', name: 'Dan', symbol: 'dan', ratio: 50 },
    { key: 'jin', name: 'Jin', symbol: 'jin', ratio: 0.5 },
    { key: 'qian', name: 'Qian', symbol: 'qian', ratio: 0.005 },
    { key: 'liang', name: 'Liang', symbol: 'liang', ratio: 0.05 },
    { key: 'jin_tw', name: 'Jin (Taiwan)', symbol: 'jin (Taiwan)', ratio: 0.6 },
  ],
  area: [
    { key: 'km2', name: 'Square kilometre', symbol: 'km²', ratio: 1000000 },
    { key: 'ha', name: 'Hectare', symbol: 'ha', ratio: 10000 },
    { key: 'a', name: 'Are', symbol: 'a', ratio: 100 },
    { key: 'm2', name: 'Square metre', symbol: 'm²', ratio: 1 },
    { key: 'dm2', name: 'Square decimeter', symbol: 'dm²', ratio: 0.01 },
    { key: 'cm2', name: 'Square centimetre', symbol: 'cm²', ratio: 0.0001 },
    { key: 'mm2', name: 'Square millimetre', symbol: 'mm²', ratio: 0.000001 },
    { key: 'um2', name: 'Square micron', symbol: 'μm²', ratio: 1e-12 },
    { key: 'ac', name: 'Acre', symbol: 'ac', ratio: 4046.8564224 },
    { key: 'mi2', name: 'Square mile', symbol: 'mile²', ratio: 2589988.110336 },
    { key: 'yd2', name: 'Square yard', symbol: 'yd²', ratio: 0.83612736 },
    { key: 'ft2', name: 'Square foot', symbol: 'ft²', ratio: 0.09290304 },
    { key: 'in2', name: 'Square inch', symbol: 'in²', ratio: 0.00064516 },
    { key: 'rd2', name: 'Square rod', symbol: 'rd²', ratio: 25.29285264 },
    { key: 'qing', name: 'Qing', symbol: 'qing', ratio: 66666.6666667 },
    { key: 'mu', name: 'Mu', symbol: 'mu', ratio: 666.6666667 },
    { key: 'chi2', name: 'Square chi', symbol: 'chi²', ratio: 0.1111111111 },
    { key: 'cun2', name: 'Square cun', symbol: 'cun²', ratio: 0.0011111111 },
  ],
  time: [
    { key: 'yr', name: 'Year', symbol: 'yr', ratio: 31536000 },
    { key: 'wk', name: 'Week', symbol: 'wk', ratio: 604800 },
    { key: 'd', name: 'Day', symbol: 'd', ratio: 86400 },
    { key: 'hr', name: 'Hour', symbol: 'hr', ratio: 3600 },
    { key: 'min', name: 'Minute', symbol: 'min', ratio: 60 },
    { key: 's', name: 'Second', symbol: 's', ratio: 1 },
    { key: 'ms', name: 'Millisecond', symbol: 'ms', ratio: 0.001 },
    { key: 'us', name: 'Microsecond', symbol: 'μs', ratio: 0.000001 },
    { key: 'ps', name: 'Picosecond', symbol: 'ps', ratio: 1e-12 },
  ],
  data: [
    { key: 'B', name: 'Byte', symbol: 'B', ratio: 1 },
    { key: 'KB', name: 'Kilobyte', symbol: 'KB', ratio: 1024 },
    { key: 'MB', name: 'Megabyte', symbol: 'MB', ratio: 1048576 },
    { key: 'GB', name: 'Gigabyte', symbol: 'GB', ratio: 1073741824 },
    { key: 'TB', name: 'Terabyte', symbol: 'TB', ratio: 1099511627776 },
    { key: 'PB', name: 'Petabyte', symbol: 'PB', ratio: 1125899906842624 },
  ],
  volume: [
    { key: 'm3', name: 'Cubic metre', symbol: 'm³', ratio: 1000 },
    { key: 'dm3', name: 'Cubic decimeter', symbol: 'dm³', ratio: 1 },
    { key: 'cm3', name: 'Cubic centimetre', symbol: 'cm³', ratio: 0.001 },
    { key: 'mm3', name: 'Cubic millimetre', symbol: 'mm³', ratio: 0.000001 },
    { key: 'hl', name: 'Hectoliter', symbol: 'hl', ratio: 100 },
    { key: 'l', name: 'Litre', symbol: 'l', ratio: 1 },
    { key: 'dl', name: 'Deciliter', symbol: 'dl', ratio: 0.1 },
    { key: 'cl', name: 'Centiliter', symbol: 'cl', ratio: 0.01 },
    { key: 'ml', name: 'Millilitre', symbol: 'ml', ratio: 0.001 },
    { key: 'ft3', name: 'Cubic foot', symbol: 'ft³', ratio: 28.316846592 },
    { key: 'in3', name: 'Cubic inch', symbol: 'in³', ratio: 0.016387064 },
    { key: 'yd3', name: 'Cubic yard', symbol: 'yd³', ratio: 764.554857984 },
    { key: 'af3', name: 'Acre-foot', symbol: 'af³', ratio: 1233481.83754752 },
  ],
  speed: [
    { key: 'c', name: 'Lightspeed', symbol: 'c', ratio: 299792458 },
    { key: 'ma', name: 'Mach', symbol: 'Ma', ratio: 340.3 },
    { key: 'ms', name: 'Metre per second', symbol: 'm/s', ratio: 1 },
    { key: 'kmh', name: 'Kilometre per hour', symbol: 'km/h', ratio: 0.2777777778 },
    { key: 'kms', name: 'Kilometre per second', symbol: 'km/s', ratio: 1000 },
    { key: 'kn', name: 'Knot', symbol: 'kn', ratio: 0.5144444444 },
    { key: 'mph', name: 'Mile per hour', symbol: 'mph', ratio: 0.44704 },
    { key: 'fps', name: 'Foot per second', symbol: 'fps', ratio: 0.3048 },
    { key: 'ips', name: 'Inch per second', symbol: 'ips', ratio: 0.0254 },
  ],
  temperature: [
    { key: 'C', name: 'Celsius', symbol: '°C', ratio: 1 },
    { key: 'F', name: 'Fahrenheit', symbol: '°F', ratio: 1 },
    { key: 'K', name: 'Kelvin', symbol: 'K', ratio: 1 },
    { key: 'R', name: 'Rankine', symbol: '°R', ratio: 1 },
    { key: 'Re', name: 'Réaumur', symbol: '°Re', ratio: 1 },
  ],
  numeral: [
    { key: 'BIN', name: 'Binary', symbol: 'BIN', ratio: 2 },
    { key: 'OCT', name: 'Octal', symbol: 'OCT', ratio: 8 },
    { key: 'DEC', name: 'Decimal', symbol: 'DEC', ratio: 10 },
    { key: 'HEX', name: 'Hexadecimal', symbol: 'HEX', ratio: 16 },
  ],
  number_scale: [
    { key: 'MILLION', name: 'Million', symbol: 'M', ratio: 1000000 },
    { key: 'CRORE', name: 'Crore', symbol: 'Cr', ratio: 10000000 },
    { key: 'LAKH', name: 'Lakh', symbol: 'Lakh', ratio: 100000 },
    { key: 'BILLION', name: 'Billion', symbol: 'B', ratio: 1000000000 },
    { key: 'THOUSAND', name: 'Thousand', symbol: 'K', ratio: 1000 },
    { key: 'UNIT', name: 'Ones / Unit', symbol: '1', ratio: 1 },
    { key: 'HUNDRED', name: 'Hundred', symbol: '100', ratio: 100 },
    { key: 'ARAB', name: 'Arab', symbol: 'Arab', ratio: 1000000000 },
    { key: 'KHARAB', name: 'Kharab', symbol: 'Kharab', ratio: 100000000000 },
    { key: 'TRILLION', name: 'Trillion', symbol: 'T', ratio: 1000000000000 },
    { key: 'NIL', name: 'Nil', symbol: 'Nil', ratio: 10000000000000 },
    { key: 'PADMA', name: 'Padma', symbol: 'Padma', ratio: 1000000000000000 },
    { key: 'QUADRILLION', name: 'Quadrillion', symbol: 'Qa', ratio: 1000000000000000 },
    { key: 'SANKH', name: 'Sankh', symbol: 'Sankh', ratio: 100000000000000000 },
  ],
};

export const ConverterSuite: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ConverterCategory | null>(null);

  // Units selection states
  const [activeUnitKey, setActiveUnitKey] = useState<string>('m');
  const [secondaryUnitKey, setSecondaryUnitKey] = useState<string>('cm');
  const [tertiaryUnitKey, setTertiaryUnitKey] = useState<string>('CNY');

  // Active numeric input value string
  const [inputValue, setInputValue] = useState<string>('1');

  // Active row index for multi-row converters (0 = primary/top, 1 = secondary/bottom, 2 = tertiary)
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);

  // Modal unit picker state
  const [pickingUnitFor, setPickingUnitFor] = useState<'primary' | 'secondary' | 'tertiary' | null>(null);
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');

  // Discount States
  const [originalPriceInput, setOriginalPriceInput] = useState<string>('100');
  const [discountPctInput, setDiscountPctInput] = useState<string>('10');
  const [activeDiscountField, setActiveDiscountField] = useState<'original' | 'discount'>('original');

  // GST States
  const [gstAmountInput, setGstAmountInput] = useState<string>('100');
  const [selectedGstRate, setSelectedGstRate] = useState<number>(5);
  const [gstMode, setGstMode] = useState<'add' | 'remove'>('add');

  const handleSwapUnits = () => {
    const temp = activeUnitKey;
    setActiveUnitKey(secondaryUnitKey);
    setSecondaryUnitKey(temp);
  };

  // BMI States
  const [bmiAgeInput, setBmiAgeInput] = useState<string>('25');
  const [bmiGender, setBmiGender] = useState<'male' | 'female'>('male');
  const [bmiHeightInput, setBmiHeightInput] = useState<string>('170');
  const [bmiWeightInput, setBmiWeightInput] = useState<string>('70');
  const [activeBmiField, setActiveBmiField] = useState<'age' | 'height' | 'weight'>('height');
  const [bmiResult, setBmiResult] = useState<{ bmi: number; category: string } | null>(null);

  // Live Currency Rates
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('calculator_hub_currency_rates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      INR: 83.55,
      USD: 1,
      CNY: 7.24,
      EUR: 0.92,
      GBP: 0.78,
      JPY: 154.8,
      AUD: 1.52,
      CAD: 1.36,
      CHF: 0.9,
      SGD: 1.35,
      AED: 3.67,
      SAR: 3.75,
    };
  });

  useEffect(() => {
    if (navigator.onLine) {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.rates) {
            setCurrencyRates((prev) => {
              const updated = { ...prev, ...data.rates };
              localStorage.setItem('calculator_hub_currency_rates', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const categories: GridOption[] = [
    { id: 'currency', label: 'Currency', icon: <Coins className="w-6 h-6 text-orange-400" /> },
    { id: 'number_scale', label: 'Number system', icon: <Hash className="w-6 h-6 text-orange-400" /> },
    { id: 'length', label: 'Length', icon: <Ruler className="w-6 h-6 text-orange-400" /> },
    { id: 'mass', label: 'Mass', icon: <Weight className="w-6 h-6 text-orange-400" /> },
    { id: 'area', label: 'Area', icon: <Square className="w-6 h-6 text-orange-400" /> },
    { id: 'time', label: 'Time', icon: <Clock className="w-6 h-6 text-orange-400" /> },
    { id: 'data', label: 'Data', icon: <HardDrive className="w-6 h-6 text-orange-400" /> },
    { id: 'discount', label: 'Discount', icon: <Tag className="w-6 h-6 text-orange-400" /> },
    { id: 'volume', label: 'Volume', icon: <Box className="w-6 h-6 text-orange-400" /> },
    { id: 'numeral', label: 'Numeral system', icon: <Binary className="w-6 h-6 text-orange-400" /> },
    { id: 'speed', label: 'Speed', icon: <Gauge className="w-6 h-6 text-orange-400" /> },
    { id: 'temperature', label: 'Temperature', icon: <Thermometer className="w-6 h-6 text-orange-400" /> },
    { id: 'bmi', label: 'BMI', icon: <Scale className="w-6 h-6 text-orange-400" /> },
    { id: 'gst', label: 'GST', icon: <Receipt className="w-6 h-6 text-orange-400" /> },
  ];

  const handleSelectCategory = (id: ConverterCategory) => {
    setSelectedCategory(id);
    setInputValue('1');
    setBmiResult(null);
    setActiveRowIndex(0);

    // Set default unit keys for each category to match screenshots
    if (id === 'currency') {
      setActiveUnitKey('INR');
      setSecondaryUnitKey('USD');
      setTertiaryUnitKey('CNY');
      setInputValue('0');
    } else if (id === 'number_scale') {
      setActiveUnitKey('MILLION');
      setSecondaryUnitKey('CRORE');
      setInputValue('1');
    } else if (id === 'length') {
      setActiveUnitKey('m');
      setSecondaryUnitKey('cm');
      setInputValue('1');
    } else if (id === 'mass') {
      setActiveUnitKey('kg');
      setSecondaryUnitKey('g');
      setInputValue('1');
    } else if (id === 'area') {
      setActiveUnitKey('m2');
      setSecondaryUnitKey('cm2');
      setInputValue('1');
    } else if (id === 'time') {
      setActiveUnitKey('min');
      setSecondaryUnitKey('s');
      setInputValue('1');
    } else if (id === 'data') {
      setActiveUnitKey('MB');
      setSecondaryUnitKey('KB');
      setInputValue('1');
    } else if (id === 'volume') {
      setActiveUnitKey('m3');
      setSecondaryUnitKey('cm3');
      setInputValue('1');
    } else if (id === 'speed') {
      setActiveUnitKey('ms');
      setSecondaryUnitKey('kms');
      setInputValue('1');
    } else if (id === 'temperature') {
      setActiveUnitKey('C');
      setSecondaryUnitKey('F');
      setInputValue('1');
    } else if (id === 'numeral') {
      setActiveUnitKey('DEC');
      setSecondaryUnitKey('BIN');
      setInputValue('1');
    } else if (id === 'discount') {
      setOriginalPriceInput('100');
      setDiscountPctInput('10');
      setActiveDiscountField('original');
    } else if (id === 'gst') {
      setGstAmountInput('100');
      setSelectedGstRate(5);
    } else if (id === 'bmi') {
      setBmiAgeInput('25');
      setBmiHeightInput('170');
      setBmiWeightInput('70');
      setActiveBmiField('height');
    }
  };

  // Helper to evaluate string expression safely
  const evalExpr = (str: string): number => {
    if (!str || str.trim() === '' || str === '-') return 0;
    const cleanStr = str.toString().replace(/,/g, '');
    try {
      const sanitized = cleanStr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/%/g, '* 0.01');
      const res = Function(`'use strict'; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return res;
      }
    } catch (e) {}
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Multi-row conversion helpers
  const getActiveUnitKey = (): string => {
    if (selectedCategory === 'currency') {
      if (activeRowIndex === 0) return activeUnitKey;
      if (activeRowIndex === 1) return secondaryUnitKey;
      if (activeRowIndex === 2) return tertiaryUnitKey;
    }
    return activeRowIndex === 0 ? activeUnitKey : secondaryUnitKey;
  };

  const calculateRowValue = (targetUnitKey: string, rowIndex: number): string => {
    if (rowIndex === activeRowIndex) {
      return inputValue;
    }
    const fromUnit = getActiveUnitKey();
    return computeConvertedValue(fromUnit, targetUnitKey, inputValue);
  };

  const handleSelectRowToEdit = (rowIndex: number, currentTargetUnitKey: string) => {
    if (rowIndex === activeRowIndex) return;
    const currentVal = calculateRowValue(currentTargetUnitKey, rowIndex);
    setInputValue(currentVal === '0' || !currentVal ? '1' : currentVal);
    setActiveRowIndex(rowIndex);
  };

  // Live BMI calculation effect
  useEffect(() => {
    if (selectedCategory === 'bmi') {
      const h = parseFloat(bmiHeightInput);
      const w = parseFloat(bmiWeightInput);
      if (h > 0 && w > 0) {
        const hMeters = h / 100;
        const bmi = w / (hMeters * hMeters);
        let cat = 'Normal weight';
        if (bmi < 18.5) cat = 'Underweight';
        else if (bmi >= 25 && bmi < 29.9) cat = 'Overweight';
        else if (bmi >= 30) cat = 'Obese';
        setBmiResult({ bmi: parseFloat(bmi.toFixed(1)), category: cat });
      } else {
        setBmiResult(null);
      }
    }
  }, [selectedCategory, bmiHeightInput, bmiWeightInput]);

  // Physical Keyboard Listener Effect
  useEffect(() => {
    if (!selectedCategory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;
      if (key >= '0' && key <= '9') {
        handleKeypadPress(key);
      } else if (key === '.') {
        handleKeypadPress('.');
      } else if (key === 'Backspace') {
        handleKeypadPress('BACKSPACE');
      } else if (key === 'Delete' || key === 'Escape') {
        handleKeypadPress('C');
      } else if (['+', '-', '*', '/', '%'].includes(key)) {
        const map: Record<string, string> = { '*': '×', '/': '÷' };
        handleKeypadPress(map[key] || key);
      } else if (key === 'Enter' || key === '=') {
        handleKeypadPress('=');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategory, activeBmiField, activeDiscountField, activeRowIndex, inputValue, bmiAgeInput, bmiHeightInput, bmiWeightInput, originalPriceInput, discountPctInput, gstAmountInput]);

  // Convert unit helper
  const computeConvertedValue = (fromKey: string, toKey: string, valStr: string): string => {
    const numeric = evalExpr(valStr);

    if (selectedCategory === 'currency') {
      const units = CATEGORY_UNITS.currency;
      const fromObj = units.find((u) => u.key === fromKey);
      const toObj = units.find((u) => u.key === toKey);
      const fromRate = currencyRates[fromKey] || fromObj?.ratio || 1;
      const toRate = currencyRates[toKey] || toObj?.ratio || 1;
      const inUsd = numeric / fromRate;
      const result = inUsd * toRate;
      return formatNumberDisplay(result);
    }

    if (selectedCategory === 'temperature') {
      let celsius = numeric;
      if (fromKey === 'C') celsius = numeric;
      else if (fromKey === 'F') celsius = ((numeric - 32) * 5) / 9;
      else if (fromKey === 'K') celsius = numeric - 273.15;
      else if (fromKey === 'R') celsius = ((numeric - 491.67) * 5) / 9;
      else if (fromKey === 'Re') celsius = (numeric * 5) / 4;

      let result = celsius;
      if (toKey === 'C') result = celsius;
      else if (toKey === 'F') result = (celsius * 9) / 5 + 32;
      else if (toKey === 'K') result = celsius + 273.15;
      else if (toKey === 'R') result = (celsius + 273.15) * 9 / 5;
      else if (toKey === 'Re') result = (celsius * 4) / 5;

      return formatNumberDisplay(result);
    }

    if (selectedCategory === 'numeral') {
      let base10 = 0;
      try {
        if (fromKey === 'DEC') base10 = parseInt(valStr, 10);
        else if (fromKey === 'BIN') base10 = parseInt(valStr, 2);
        else if (fromKey === 'HEX') base10 = parseInt(valStr, 16);
        else if (fromKey === 'OCT') base10 = parseInt(valStr, 8);
      } catch (e) {
        return '0';
      }

      if (isNaN(base10)) return '0';

      if (toKey === 'DEC') return base10.toString(10);
      if (toKey === 'BIN') return base10.toString(2);
      if (toKey === 'HEX') return base10.toString(16).toUpperCase();
      if (toKey === 'OCT') return base10.toString(8);
      return '0';
    }

    const units = CATEGORY_UNITS[selectedCategory || ''] || [];
    const fromUnit = units.find((u) => u.key === fromKey);
    const toUnit = units.find((u) => u.key === toKey);

    if (!fromUnit || !toUnit) return '0';

    const baseValue = numeric * fromUnit.ratio;
    const result = baseValue / toUnit.ratio;
    return formatNumberDisplay(result);
  };

  const formatNumberDisplay = (num: number): string => {
    if (isNaN(num)) return '0';
    if (Math.abs(num) >= 1000) {
      // Use clean commas format
      const parts = num.toString().split('.');
      parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
      if (parts[1]) {
        parts[1] = parts[1].substring(0, 4);
        return `${parts[0]}.${parts[1]}`;
      }
      return parts[0];
    }
    // Limit decimals gracefully
    if (Number.isInteger(num)) return num.toString();
    const str = num.toFixed(4);
    return parseFloat(str).toString();
  };

  // Keypad Click Handlers
  const handleKeypadPress = (key: string) => {
    if (selectedCategory === 'discount') {
      const targetState = activeDiscountField === 'original' ? originalPriceInput : discountPctInput;
      const setTargetState = activeDiscountField === 'original' ? setOriginalPriceInput : setDiscountPctInput;

      if (key === 'C') {
        setTargetState('0');
      } else if (key === 'BACKSPACE') {
        setTargetState((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      } else if (key === '.') {
        if (!targetState.includes('.')) setTargetState((prev) => prev + '.');
      } else if (key === '00') {
        if (targetState !== '0') setTargetState((prev) => prev + '00');
      } else if (!isNaN(parseInt(key, 10))) {
        setTargetState((prev) => (prev === '0' ? key : prev + key));
      }
      return;
    }

    if (selectedCategory === 'gst') {
      if (key === 'C') {
        setGstAmountInput('0');
      } else if (key === 'BACKSPACE') {
        setGstAmountInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      } else if (key === '.') {
        if (!gstAmountInput.includes('.')) setGstAmountInput((prev) => prev + '.');
      } else if (key === '00') {
        if (gstAmountInput !== '0') setGstAmountInput((prev) => prev + '00');
      } else if (!isNaN(parseInt(key, 10))) {
        setGstAmountInput((prev) => (prev === '0' ? key : prev + key));
      }
      return;
    }

    if (selectedCategory === 'bmi') {
      let currentVal = '';
      if (activeBmiField === 'age') currentVal = bmiAgeInput;
      if (activeBmiField === 'height') currentVal = bmiHeightInput;
      if (activeBmiField === 'weight') currentVal = bmiWeightInput;

      const updateVal = (newVal: string) => {
        if (activeBmiField === 'age') setBmiAgeInput(newVal);
        if (activeBmiField === 'height') setBmiHeightInput(newVal);
        if (activeBmiField === 'weight') setBmiWeightInput(newVal);
      };

      if (key === 'C') {
        updateVal('');
      } else if (key === 'BACKSPACE') {
        updateVal(currentVal.slice(0, -1));
      } else if (key === '.') {
        if (!currentVal.includes('.')) updateVal(currentVal + '.');
      } else if (key === '00') {
        if (currentVal !== '') updateVal(currentVal + '00');
      } else if (!isNaN(parseInt(key, 10))) {
        updateVal(currentVal + key);
      }
      return;
    }

    // Standard Converters Keypad Logic
    if (key === 'C') {
      setInputValue('0');
    } else if (key === 'BACKSPACE') {
      setInputValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === '+/-') {
      setInputValue((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
    } else if (key === '.') {
      if (!inputValue.includes('.')) setInputValue((prev) => prev + '.');
    } else if (key === '00') {
      if (inputValue !== '0') setInputValue((prev) => prev + '00');
    } else if (['+', '-', '×', '÷', '%'].includes(key)) {
      // Evaluate basic arithmetic if user typed an expression or operator
      setInputValue((prev) => prev + ` ${key} `);
    } else if (key === '=') {
      try {
        const sanitized = inputValue.replace(/×/g, '*').replace(/÷/g, '/');
        // Simple safe evaluation
        const evalRes = Function(`'use strict'; return (${sanitized})`)();
        if (!isNaN(evalRes)) setInputValue(evalRes.toString());
      } catch (e) {}
    } else {
      // Digits or Hex characters
      setInputValue((prev) => (prev === '0' ? key : prev + key));
    }
  };

  // BMI Calculation
  const handleCalculateBmi = () => {
    const h = parseFloat(bmiHeightInput);
    const w = parseFloat(bmiWeightInput);
    if (h > 0 && w > 0) {
      const hMeters = h / 100;
      const bmi = w / (hMeters * hMeters);
      let cat = 'Normal';
      if (bmi < 18.5) cat = 'Underweight';
      else if (bmi >= 25 && bmi < 30) cat = 'Overweight';
      else if (bmi >= 30) cat = 'Obese';
      setBmiResult({ bmi: parseFloat(bmi.toFixed(1)), category: cat });
    }
  };

  // Render Keypad Grid
  const renderKeypad = () => {
    const isTemp = selectedCategory === 'temperature';
    const isHex = selectedCategory === 'numeral' && activeUnitKey === 'HEX';
    const isBin = selectedCategory === 'numeral' && activeUnitKey === 'BIN';

    return (
      <div className="w-full max-w-md mx-auto pt-3 pb-1 px-1">
        {/* Hex row if in Hexadecimal mode */}
        {isHex && (
          <div className="grid grid-cols-6 gap-2 mb-2">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((hexChar) => (
              <button
                key={hexChar}
                onClick={() => handleKeypadPress(hexChar)}
                className="h-10 sm:h-11 bg-gray-900/80 hover:bg-gray-800 text-white font-bold rounded-xl text-base flex items-center justify-center border border-gray-800/50 cursor-pointer transition-all active:scale-95"
              >
                {hexChar}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {/* Row 1 */}
          <button
            onClick={() => handleKeypadPress('C')}
            className="h-12 sm:h-13 text-xl bg-gray-900 hover:bg-gray-800 text-red-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            C
          </button>
          <button
            onClick={() => handleKeypadPress('BACKSPACE')}
            className="h-12 sm:h-13 text-xl bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => handleKeypadPress('%')}
            className="h-12 sm:h-13 text-xl bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            %
          </button>
          <button
            onClick={() => handleKeypadPress('÷')}
            className="h-12 sm:h-13 text-2xl bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('7')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            7
          </button>
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('8')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            8
          </button>
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('9')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            9
          </button>
          <button
            onClick={() => handleKeypadPress('×')}
            className="h-12 sm:h-13 text-2xl bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('4')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            4
          </button>
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('5')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            5
          </button>
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('6')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            6
          </button>
          <button
            onClick={() => handleKeypadPress('-')}
            className="h-12 sm:h-13 text-2xl bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleKeypadPress('1')}
            className="h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer"
          >
            1
          </button>
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('2')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            2
          </button>
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('3')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            3
          </button>
          <button
            onClick={() => handleKeypadPress('+')}
            className="h-12 sm:h-13 text-2xl bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            disabled={isBin}
            onClick={() => handleKeypadPress('00')}
            className={`h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer ${
              isBin ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            00
          </button>
          <button
            onClick={() => handleKeypadPress('0')}
            className="h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer"
          >
            0
          </button>
          {isTemp ? (
            <button
              onClick={() => handleKeypadPress('+/-')}
              className="h-12 sm:h-13 text-lg bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800 cursor-pointer"
            >
              ±
            </button>
          ) : (
            <button
              onClick={() => handleKeypadPress('.')}
              className="h-12 sm:h-13 text-xl bg-gray-900/80 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-gray-800/50 cursor-pointer"
            >
              .
            </button>
          )}
          <button
            onClick={() => handleKeypadPress('=')}
            className="h-12 sm:h-13 text-2xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            =
          </button>
        </div>
      </div>
    );
  };

  const getCategoryTitle = (): string => {
    const found = categories.find((c) => c.id === selectedCategory);
    return found ? found.label : '';
  };

  const availableUnits = CATEGORY_UNITS[selectedCategory || ''] || [];

  return (
    <div className="w-full max-w-lg mx-auto bg-black text-white min-h-[620px] rounded-3xl border border-gray-900 shadow-2xl flex flex-col justify-between overflow-hidden">
      {/* 1. MAIN CATEGORY SELECTION GRID */}
      {!selectedCategory ? (
        <div className="p-6 space-y-6">
          <div className="text-center space-y-1 pt-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Utility Converters</h2>
            <p className="text-xs text-gray-400">Select a conversion tool</p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="bg-[#121214] hover:bg-[#1a1a1e] border border-gray-800/60 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2.5 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <div className="p-2.5 bg-black rounded-xl group-hover:bg-[#18181b] transition-colors">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover:text-white text-center line-clamp-1">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* 2. DEDICATED TOOL CONVERTER VIEW */
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
          {/* Header Bar */}
          <div>
            <div className="flex items-center justify-between pb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 bg-[#121214] hover:bg-[#1e1e22] text-gray-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-white tracking-wide">{getCategoryTitle()}</h3>
              <div className="w-9" /> {/* spacer for centered header */}
            </div>

            {/* A. CURRENCY CONVERTER SPECIFIC UI */}
            {selectedCategory === 'currency' && (
              <div className="space-y-3 pt-2">
                {/* 3 Currency Rows */}
                {[
                  { key: activeUnitKey, setKey: setActiveUnitKey, slot: 'primary' },
                  { key: secondaryUnitKey, setKey: setSecondaryUnitKey, slot: 'secondary' },
                  { key: tertiaryUnitKey, setKey: setTertiaryUnitKey, slot: 'tertiary' },
                ].map((row, idx) => {
                  const unitObj = availableUnits.find((u) => u.key === row.key) || availableUnits[idx];
                  const isActive = idx === activeRowIndex;
                  const displayVal = calculateRowValue(row.key, idx);

                  return (
                    <div
                      key={row.slot}
                      onClick={() => handleSelectRowToEdit(idx, row.key)}
                      className={`flex items-center justify-between space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1e1e22] border-orange-500 shadow-md ring-1 ring-orange-500/50'
                          : 'bg-[#141416] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickingUnitFor(row.slot as any);
                        }}
                        className="flex items-center space-x-2 text-gray-200 hover:text-white group cursor-pointer"
                      >
                        <span className="text-base sm:text-lg font-semibold">
                          {unitObj.name} <span className="font-bold text-orange-400">({unitObj.symbol})</span>
                        </span>
                        <ChevronsUpDown className="w-4 h-4 text-gray-500 group-hover:text-orange-400" />
                      </button>
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${
                          isActive ? 'text-orange-500' : 'text-white'
                        }`}
                      >
                        {displayVal}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 text-center text-[11px] text-gray-500 font-mono">
                  Tap any currency row above to edit its amount directly
                </div>
              </div>
            )}

            {/* B. DISCOUNT TOOL SPECIFIC UI */}
            {selectedCategory === 'discount' && (
              <div className="space-y-6 pt-2">
                {/* Row 1: Original Price */}
                <div
                  onClick={() => setActiveDiscountField('original')}
                  className="flex items-center justify-between py-2 cursor-pointer border-b border-gray-900"
                >
                  <span className="text-base sm:text-lg font-medium text-gray-300">Original price</span>
                  <span
                    className={`text-2xl sm:text-3xl font-mono font-semibold ${
                      activeDiscountField === 'original' ? 'text-orange-500' : 'text-white'
                    }`}
                  >
                    {originalPriceInput}
                  </span>
                </div>

                {/* Row 2: Discount (%) */}
                <div
                  onClick={() => setActiveDiscountField('discount')}
                  className="flex items-center justify-between py-2 cursor-pointer border-b border-gray-900"
                >
                  <span className="text-base sm:text-lg font-medium text-gray-300">Discount (%)</span>
                  <span
                    className={`text-2xl sm:text-3xl font-mono font-semibold ${
                      activeDiscountField === 'discount' ? 'text-orange-500' : 'text-white'
                    }`}
                  >
                    {discountPctInput}
                  </span>
                </div>

                {/* Preset Discount Chips */}
                <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none">
                  {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        setDiscountPctInput(pct.toString());
                        setActiveDiscountField('original');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        parseFloat(discountPctInput) === pct
                          ? 'bg-orange-500 text-white shadow'
                          : 'bg-[#1a1a1c] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      {pct}% OFF
                    </button>
                  ))}
                </div>

                {/* Row 3: Final price */}
                {(() => {
                  const orig = parseFloat(originalPriceInput) || 0;
                  const disc = parseFloat(discountPctInput) || 0;
                  const finalP = orig * (1 - disc / 100);
                  const saved = orig * (disc / 100);

                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-base sm:text-lg font-medium text-gray-300">Final price</span>
                        <span className="text-2xl sm:text-3xl font-mono font-semibold text-white">
                          {formatNumberDisplay(finalP)}
                        </span>
                      </div>
                      <div className="text-center text-xs text-gray-500 pt-2 font-mono">
                        You save {formatNumberDisplay(saved)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* C. GST TOOL SPECIFIC UI */}
            {selectedCategory === 'gst' && (
              <div className="space-y-6 pt-2">
                {/* GST Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-[#141416] p-1.5 rounded-2xl border border-gray-800">
                  <button
                    onClick={() => setGstMode('add')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      gstMode === 'add'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Add GST (+)
                  </button>
                  <button
                    onClick={() => setGstMode('remove')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      gstMode === 'remove'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Remove GST (-)
                  </button>
                </div>

                {/* Original price */}
                <div className="flex items-center justify-between py-2 border-b border-gray-900">
                  <span className="text-base sm:text-lg font-medium text-gray-300">
                    {gstMode === 'add' ? 'Amount (excl. GST)' : 'Amount (incl. GST)'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono font-semibold text-orange-500">
                    {gstAmountInput}
                  </span>
                </div>

                {/* GST Rate Row Selector */}
                <div className="space-y-2 py-2">
                  <span className="text-base sm:text-lg font-medium text-gray-300">GST Rate</span>
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[3, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSelectedGstRate(rate)}
                        className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                          selectedGstRate === rate
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-[#18181a] text-gray-300 hover:text-white border border-gray-800'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final price */}
                {(() => {
                  const baseAmt = parseFloat(gstAmountInput) || 0;
                  let finalVal = 0;
                  let gstVal = 0;

                  if (gstMode === 'add') {
                    gstVal = baseAmt * (selectedGstRate / 100);
                    finalVal = baseAmt + gstVal;
                  } else {
                    const netAmt = baseAmt / (1 + selectedGstRate / 100);
                    gstVal = baseAmt - netAmt;
                    finalVal = netAmt;
                  }

                  const halfGst = (gstVal / 2).toFixed(2);

                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-base sm:text-lg font-medium text-gray-300">
                          {gstMode === 'add' ? 'Total Amount' : 'Net Amount (excl. GST)'}
                        </span>
                        <span className="text-2xl sm:text-3xl font-mono font-semibold text-white">
                          {formatNumberDisplay(finalVal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-1 border-t border-gray-900/60">
                        <span>GST Amount: {formatNumberDisplay(gstVal)}</span>
                        <span>CGST/SGST: {halfGst} each</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* D. BMI TOOL SPECIFIC UI */}
            {selectedCategory === 'bmi' && (
              <div className="space-y-4 pt-2">
                {/* Gender Selector */}
                <div className="flex items-center justify-between p-3 bg-[#141416] rounded-2xl border border-gray-800">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Gender</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setBmiGender('male')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bmiGender === 'male'
                          ? 'bg-orange-500 text-white shadow'
                          : 'bg-[#1a1a1c] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <Mars className="w-3.5 h-3.5" />
                      <span>Male</span>
                    </button>
                    <button
                      onClick={() => setBmiGender('female')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bmiGender === 'female'
                          ? 'bg-orange-500 text-white shadow'
                          : 'bg-[#1a1a1c] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <Venus className="w-3.5 h-3.5" />
                      <span>Female</span>
                    </button>
                  </div>
                </div>

                {/* Inputs for Age, Height, Weight */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Age */}
                  <div
                    onClick={() => setActiveBmiField('age')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeBmiField === 'age'
                        ? 'bg-[#1e1e22] border-orange-500 ring-1 ring-orange-500/50'
                        : 'bg-[#141416] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-gray-400">Age</div>
                    <input
                      type="text"
                      value={bmiAgeInput}
                      onChange={(e) => {
                        setActiveBmiField('age');
                        setBmiAgeInput(e.target.value.replace(/[^0-9]/g, ''));
                      }}
                      onFocus={() => setActiveBmiField('age')}
                      placeholder="e.g. 25"
                      className="w-full bg-transparent text-lg sm:text-xl font-mono font-bold text-white focus:outline-none pt-1"
                    />
                  </div>

                  {/* Height */}
                  <div
                    onClick={() => setActiveBmiField('height')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeBmiField === 'height'
                        ? 'bg-[#1e1e22] border-orange-500 ring-1 ring-orange-500/50'
                        : 'bg-[#141416] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-gray-400">Height (cm)</div>
                    <input
                      type="text"
                      value={bmiHeightInput}
                      onChange={(e) => {
                        setActiveBmiField('height');
                        setBmiHeightInput(e.target.value.replace(/[^0-9.]/g, ''));
                      }}
                      onFocus={() => setActiveBmiField('height')}
                      placeholder="e.g. 170"
                      className="w-full bg-transparent text-lg sm:text-xl font-mono font-bold text-white focus:outline-none pt-1"
                    />
                  </div>

                  {/* Weight */}
                  <div
                    onClick={() => setActiveBmiField('weight')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeBmiField === 'weight'
                        ? 'bg-[#1e1e22] border-orange-500 ring-1 ring-orange-500/50'
                        : 'bg-[#141416] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-gray-400">Weight (kg)</div>
                    <input
                      type="text"
                      value={bmiWeightInput}
                      onChange={(e) => {
                        setActiveBmiField('weight');
                        setBmiWeightInput(e.target.value.replace(/[^0-9.]/g, ''));
                      }}
                      onFocus={() => setActiveBmiField('weight')}
                      placeholder="e.g. 70"
                      className="w-full bg-transparent text-lg sm:text-xl font-mono font-bold text-white focus:outline-none pt-1"
                    />
                  </div>
                </div>

                {/* Calculated Result Card */}
                {bmiResult ? (
                  <div className="p-3.5 bg-[#141416] rounded-2xl border border-gray-800 text-center space-y-1">
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                      Your Body Mass Index (BMI)
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-orange-500">{bmiResult.bmi}</div>
                    <div className="text-xs font-bold text-emerald-400">{bmiResult.category}</div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#141416] rounded-2xl border border-gray-800 text-center text-xs text-gray-400">
                    Enter Height and Weight above or tap keypad to compute your BMI.
                  </div>
                )}
              </div>
            )}

            {/* E. STANDARD UNIT CONVERTERS (Length, Mass, Area, Time, Data, Volume, Temp, Speed, Numeral, Number scale) */}
            {!['currency', 'discount', 'gst', 'bmi'].includes(selectedCategory) && (
              <div className="space-y-3 pt-1">
                {/* Row 1: Primary Unit Row */}
                {(() => {
                  const unitObj =
                    availableUnits.find((u) => u.key === activeUnitKey) || availableUnits[0];
                  const isActive = activeRowIndex === 0;
                  const displayVal = calculateRowValue(activeUnitKey, 0);

                  return (
                    <div
                      onClick={() => handleSelectRowToEdit(0, activeUnitKey)}
                      className={`flex items-center justify-between space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1e1e22] border-orange-500 shadow-md ring-1 ring-orange-500/50'
                          : 'bg-[#141416] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickingUnitFor('primary');
                        }}
                        className="flex items-center space-x-2 text-gray-200 hover:text-white group cursor-pointer"
                      >
                        <span className="text-base sm:text-lg font-medium">
                          {unitObj?.name} <span className="font-bold text-orange-400">({unitObj?.symbol})</span>
                        </span>
                        <ChevronsUpDown className="w-4 h-4 text-gray-500 group-hover:text-orange-400" />
                      </button>
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${
                          isActive ? 'text-orange-500' : 'text-white'
                        }`}
                      >
                        {displayVal}
                      </div>
                    </div>
                  );
                })()}

                {/* Swap Units Button */}
                <div className="flex justify-center my-0.5">
                  <button
                    onClick={handleSwapUnits}
                    title="Swap unit direction"
                    className="p-2 rounded-full bg-[#1c1c1e] hover:bg-[#28282b] border border-gray-800 text-orange-400 hover:text-orange-300 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 2: Secondary Converted Unit Row */}
                {(() => {
                  const unitObj =
                    availableUnits.find((u) => u.key === secondaryUnitKey) || availableUnits[1];
                  const isActive = activeRowIndex === 1;
                  const displayVal = calculateRowValue(secondaryUnitKey, 1);

                  return (
                    <div
                      onClick={() => handleSelectRowToEdit(1, secondaryUnitKey)}
                      className={`flex items-center justify-between space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1e1e22] border-orange-500 shadow-md ring-1 ring-orange-500/50'
                          : 'bg-[#141416] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickingUnitFor('secondary');
                        }}
                        className="flex items-center space-x-2 text-gray-200 hover:text-white group cursor-pointer"
                      >
                        <span className="text-base sm:text-lg font-medium">
                          {unitObj?.name} <span className="font-bold text-orange-400">({unitObj?.symbol})</span>
                        </span>
                        <ChevronsUpDown className="w-4 h-4 text-gray-500 group-hover:text-orange-400" />
                      </button>
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${
                          isActive ? 'text-orange-500' : 'text-white'
                        }`}
                      >
                        {displayVal}
                      </div>
                    </div>
                  );
                })()}

                {/* Helpful Number System Quick Guide */}
                {selectedCategory === 'number_scale' && (
                  <div className="mt-3 p-3.5 bg-[#141416] rounded-2xl border border-gray-800 space-y-1 text-xs text-gray-400 font-mono">
                    <div className="text-gray-200 font-bold font-sans flex items-center space-x-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span>Number System Equivalencies</span>
                    </div>
                    <div>• 1 Million = 10 Lakhs = 0.1 Crore = 1,000,000</div>
                    <div>• 1 Crore = 100 Lakhs = 10 Million = 10,000,000</div>
                    <div>• 1 Billion = 100 Crore = 1,000 Million = 1,000,000,000</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Render Keypad at Bottom */}
          {renderKeypad()}
        </div>
      )}

      {/* MODAL / SHEET FOR UNIT SELECTION */}
      {pickingUnitFor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-gray-800 w-full max-w-sm rounded-3xl p-5 space-y-3 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <h4 className="text-base font-bold text-white">
                Select {selectedCategory ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : 'Unit'}
              </h4>
              <button
                onClick={() => {
                  setPickingUnitFor(null);
                  setUnitSearchQuery('');
                }}
                className="text-gray-400 hover:text-white p-1 rounded-full bg-gray-800/80 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            {availableUnits.length > 5 && (
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search currency or unit..."
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  className="w-full bg-[#27272a] text-white placeholder-gray-500 text-sm rounded-xl pl-9 pr-8 py-2 border border-gray-700/50 focus:outline-none focus:border-orange-500/80"
                  autoFocus
                />
                {unitSearchQuery && (
                  <button
                    onClick={() => setUnitSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-0">
              {availableUnits
                .filter((u) => {
                  if (!unitSearchQuery.trim()) return true;
                  const q = unitSearchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    u.symbol.toLowerCase().includes(q) ||
                    u.key.toLowerCase().includes(q)
                  );
                })
                .map((u) => {
                  const currentKey =
                    pickingUnitFor === 'primary'
                      ? activeUnitKey
                      : pickingUnitFor === 'secondary'
                      ? secondaryUnitKey
                      : tertiaryUnitKey;
                  const isSelected = u.key === currentKey;

                  return (
                    <button
                      key={u.key}
                      onClick={() => {
                        if (pickingUnitFor === 'primary') setActiveUnitKey(u.key);
                        if (pickingUnitFor === 'secondary') setSecondaryUnitKey(u.key);
                        if (pickingUnitFor === 'tertiary') setTertiaryUnitKey(u.key);
                        setPickingUnitFor(null);
                        setUnitSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30'
                          : 'hover:bg-gray-800/80 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="font-medium text-white truncate">{u.name}</span>
                        <span className="text-gray-400 text-xs font-mono shrink-0">{u.symbol}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-orange-400 shrink-0" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
