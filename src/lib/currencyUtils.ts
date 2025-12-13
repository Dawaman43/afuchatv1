// Currency mapping based on user's country
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

// Map countries to their currencies
export const countryCurrencyMap: Record<string, CurrencyInfo> = {
  "Uganda": { code: "UGX", symbol: "UGX", name: "Ugandan Shilling" },
  "Kenya": { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  "Tanzania": { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  "Rwanda": { code: "RWF", symbol: "FRw", name: "Rwandan Franc" },
  "Burundi": { code: "BIF", symbol: "FBu", name: "Burundian Franc" },
  "South Sudan": { code: "SSP", symbol: "SSP", name: "South Sudanese Pound" },
  "Ethiopia": { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  "Somalia": { code: "SOS", symbol: "Sh", name: "Somali Shilling" },
  "Democratic Republic of the Congo": { code: "CDF", symbol: "FC", name: "Congolese Franc" },
  "Congo": { code: "XAF", symbol: "FCFA", name: "Central African CFA Franc" },
  "Nigeria": { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  "Ghana": { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  "South Africa": { code: "ZAR", symbol: "R", name: "South African Rand" },
  "Egypt": { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  "Morocco": { code: "MAD", symbol: "DH", name: "Moroccan Dirham" },
  "United States": { code: "USD", symbol: "$", name: "US Dollar" },
  "United Kingdom": { code: "GBP", symbol: "£", name: "British Pound" },
  "Germany": { code: "EUR", symbol: "€", name: "Euro" },
  "France": { code: "EUR", symbol: "€", name: "Euro" },
  "Italy": { code: "EUR", symbol: "€", name: "Euro" },
  "Spain": { code: "EUR", symbol: "€", name: "Euro" },
  "Netherlands": { code: "EUR", symbol: "€", name: "Euro" },
  "Belgium": { code: "EUR", symbol: "€", name: "Euro" },
  "Austria": { code: "EUR", symbol: "€", name: "Euro" },
  "Ireland": { code: "EUR", symbol: "€", name: "Euro" },
  "Portugal": { code: "EUR", symbol: "€", name: "Euro" },
  "Greece": { code: "EUR", symbol: "€", name: "Euro" },
  "Finland": { code: "EUR", symbol: "€", name: "Euro" },
  "Canada": { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  "Australia": { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  "New Zealand": { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  "Japan": { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  "China": { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  "India": { code: "INR", symbol: "₹", name: "Indian Rupee" },
  "Pakistan": { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  "Bangladesh": { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  "Indonesia": { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  "Malaysia": { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  "Singapore": { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  "Thailand": { code: "THB", symbol: "฿", name: "Thai Baht" },
  "Vietnam": { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  "Philippines": { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  "South Korea": { code: "KRW", symbol: "₩", name: "South Korean Won" },
  "Brazil": { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  "Mexico": { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  "Argentina": { code: "ARS", symbol: "AR$", name: "Argentine Peso" },
  "Colombia": { code: "COP", symbol: "CO$", name: "Colombian Peso" },
  "Chile": { code: "CLP", symbol: "CL$", name: "Chilean Peso" },
  "Peru": { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  "United Arab Emirates": { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  "Saudi Arabia": { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  "Qatar": { code: "QAR", symbol: "QR", name: "Qatari Riyal" },
  "Kuwait": { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar" },
  "Bahrain": { code: "BHD", symbol: "BD", name: "Bahraini Dinar" },
  "Oman": { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  "Israel": { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  "Turkey": { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  "Russia": { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  "Ukraine": { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  "Poland": { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  "Czech Republic": { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  "Hungary": { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  "Romania": { code: "RON", symbol: "lei", name: "Romanian Leu" },
  "Sweden": { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  "Norway": { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  "Denmark": { code: "DKK", symbol: "kr", name: "Danish Krone" },
  "Switzerland": { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  "Zimbabwe": { code: "ZWL", symbol: "Z$", name: "Zimbabwean Dollar" },
  "Zambia": { code: "ZMW", symbol: "ZK", name: "Zambian Kwacha" },
  "Malawi": { code: "MWK", symbol: "MK", name: "Malawian Kwacha" },
  "Mozambique": { code: "MZN", symbol: "MT", name: "Mozambican Metical" },
  "Botswana": { code: "BWP", symbol: "P", name: "Botswana Pula" },
  "Namibia": { code: "NAD", symbol: "N$", name: "Namibian Dollar" },
  "Angola": { code: "AOA", symbol: "Kz", name: "Angolan Kwanza" },
  "Senegal": { code: "XOF", symbol: "CFA", name: "West African CFA Franc" },
  "Ivory Coast": { code: "XOF", symbol: "CFA", name: "West African CFA Franc" },
  "Cameroon": { code: "XAF", symbol: "FCFA", name: "Central African CFA Franc" },
};

// Default currency (UGX since products are from Uganda)
const defaultCurrency: CurrencyInfo = { code: "UGX", symbol: "UGX", name: "Ugandan Shilling" };

export function getCurrencyForCountry(country: string | null | undefined): CurrencyInfo {
  if (!country) return defaultCurrency;
  return countryCurrencyMap[country] || defaultCurrency;
}

// Approximate exchange rates from UGX (base currency for ShopShach products)
// These are approximate rates - in production, you'd fetch live rates from an API
const exchangeRatesFromUGX: Record<string, number> = {
  "UGX": 1,
  "KES": 0.035, // 1 UGX ≈ 0.035 KES
  "TZS": 0.65,  // 1 UGX ≈ 0.65 TZS
  "RWF": 0.33,  // 1 UGX ≈ 0.33 RWF
  "USD": 0.00027, // 1 UGX ≈ 0.00027 USD
  "EUR": 0.00025, // 1 UGX ≈ 0.00025 EUR
  "GBP": 0.00021, // 1 UGX ≈ 0.00021 GBP
  "NGN": 0.42,   // 1 UGX ≈ 0.42 NGN
  "GHS": 0.0033, // 1 UGX ≈ 0.0033 GHS
  "ZAR": 0.0049, // 1 UGX ≈ 0.0049 ZAR
  "EGP": 0.013,  // 1 UGX ≈ 0.013 EGP
  "INR": 0.023,  // 1 UGX ≈ 0.023 INR
  "AED": 0.001,  // 1 UGX ≈ 0.001 AED
  "CAD": 0.00037, // 1 UGX ≈ 0.00037 CAD
  "AUD": 0.00042, // 1 UGX ≈ 0.00042 AUD
  "CNY": 0.0019, // 1 UGX ≈ 0.0019 CNY
  "JPY": 0.041,  // 1 UGX ≈ 0.041 JPY
  "BRL": 0.0016, // 1 UGX ≈ 0.0016 BRL
  "MXN": 0.0047, // 1 UGX ≈ 0.0047 MXN
  "ETB": 0.031,  // 1 UGX ≈ 0.031 ETB
  "XOF": 0.16,   // 1 UGX ≈ 0.16 XOF
  "XAF": 0.16,   // 1 UGX ≈ 0.16 XAF
  "ZMW": 0.0072, // 1 UGX ≈ 0.0072 ZMW
  "BWP": 0.0037, // 1 UGX ≈ 0.0037 BWP
  "SSP": 0.38,   // 1 UGX ≈ 0.38 SSP
  "SOS": 0.15,   // 1 UGX ≈ 0.15 SOS
  "BIF": 0.77,   // 1 UGX ≈ 0.77 BIF
  "CDF": 0.73,   // 1 UGX ≈ 0.73 CDF
  "MAD": 0.0027, // 1 UGX ≈ 0.0027 MAD
  "PKR": 0.076,  // 1 UGX ≈ 0.076 PKR
  "BDT": 0.030,  // 1 UGX ≈ 0.030 BDT
  "IDR": 4.26,   // 1 UGX ≈ 4.26 IDR
  "MYR": 0.0012, // 1 UGX ≈ 0.0012 MYR
  "SGD": 0.00036, // 1 UGX ≈ 0.00036 SGD
  "THB": 0.0096, // 1 UGX ≈ 0.0096 THB
  "VND": 6.7,    // 1 UGX ≈ 6.7 VND
  "PHP": 0.015,  // 1 UGX ≈ 0.015 PHP
  "KRW": 0.36,   // 1 UGX ≈ 0.36 KRW
};

export function convertFromUGX(amountUGX: number, targetCurrencyCode: string): number {
  const rate = exchangeRatesFromUGX[targetCurrencyCode];
  if (!rate) return amountUGX; // Return original if no rate found
  return amountUGX * rate;
}

export function formatPrice(amount: number, currency: CurrencyInfo): string {
  // For currencies with small decimals, round appropriately
  const formatted = currency.code === "USD" || currency.code === "EUR" || currency.code === "GBP"
    ? amount.toFixed(2)
    : Math.round(amount).toLocaleString();
  
  return `${currency.symbol} ${formatted}`;
}

export function formatPriceForCountry(priceUGX: number, userCountry: string | null | undefined): string {
  const currency = getCurrencyForCountry(userCountry);
  
  // If user is from Uganda, just show UGX
  if (currency.code === "UGX") {
    return `UGX ${priceUGX.toLocaleString()}`;
  }
  
  // Convert and format
  const convertedAmount = convertFromUGX(priceUGX, currency.code);
  return formatPrice(convertedAmount, currency);
}
