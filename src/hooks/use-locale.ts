import { useState, useEffect } from 'react';
import { Client, Locale } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const locale = new Locale(client);

interface LocaleData {
  country: string;
  countryCode: string;
  continent: string;
  continentCode: string;
  ip: string;
  currency: string;
}

export function useLocale() {
  const [localeData, setLocaleData] = useState<LocaleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocale = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await locale.get();
        setLocaleData({
          country: result.country,
          countryCode: result.countryCode,
          continent: result.continent,
          continentCode: result.continentCode,
          ip: result.ip,
          currency: result.currency,
        });
      } catch (err) {
        console.error('Failed to fetch locale data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch locale data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocale();
  }, []);

  return {
    localeData,
    isLoading,
    error,
    // Generic country check function
    isCountry: (countryCode: string) => localeData?.countryCode === countryCode,
    // Generic continent check function
    isContinent: (continentCode: string) => localeData?.continentCode === continentCode,
    // Specific country checks for convenience
    isIsrael: localeData?.countryCode === 'IL',
    isUS: localeData?.countryCode === 'US',
    isUK: localeData?.countryCode === 'GB',
    isCanada: localeData?.countryCode === 'CA',
    isGermany: localeData?.countryCode === 'DE',
    isFrance: localeData?.countryCode === 'FR',
    // Continent checks
    isEurope: localeData?.continentCode === 'EU',
    isNorthAmerica: localeData?.continentCode === 'NA',
    isAsia: localeData?.continentCode === 'AS',
  };
}
