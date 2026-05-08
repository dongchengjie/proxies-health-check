import countries from "i18n-iso-countries";
import CountryFlagHandler, { type CountryFlag } from "country-flag-emojis";
import en from "i18n-iso-countries/langs/en.json";
import zh from "i18n-iso-countries/langs/zh.json";
import * as OpenCC from "opencc-js";
import deterministic from "json-stringify-deterministic";
import crypto from "crypto";

// Support english & chinese languages
countries.registerLocale(en);
countries.registerLocale(zh);

// Territories and disputed areas have higher priority
const locationPrivilegeRank = Object.fromEntries(
  [
    ["HK", "MO", "TW"],
    ["AI", "BM", "FK", "GI", "GS", "IO", "KY", "MS", "PN", "SH", "TC", "VG", "GG", "IM", "JE"],
    ["AS", "GU", "MP", "PR", "UM", "VI"],
    ["GF", "GP", "MQ", "RE", "YT", "NC", "PF", "TF", "WF", "BL", "MF", "PM"],
    ["AW", "CW", "SX", "BQ"],
    ["FO", "GL"],
    ["BV", "SJ"],
    ["CC", "CX", "NF", "HM"],
    ["CK", "NU", "TK"],
    ["AX"],
    ["AQ"],
    ["EH", "PS", "XK"]
  ]
    .flat()
    .map((c, i) => [c, i])
);

const countryFlags = Object.keys(countries.getAlpha2Codes())
  .map(alpha2 => CountryFlagHandler.byCountryCode(alpha2))
  .sort((a, b) => {
    const ra = locationPrivilegeRank[a.isoAlpha2];
    const rb = locationPrivilegeRank[b.isoAlpha2];
    if (ra === undefined && rb === undefined) {
      return a.isoAlpha2.localeCompare(b.isoAlpha2);
    }
    if (ra !== undefined && rb !== undefined) return ra - rb;
    return ra !== undefined ? -1 : 1;
  });

const detectCountryFromProxyName = (name?: string): CountryFlag | undefined => {
  if (!name) return undefined;

  // Convert traditional Chinese characters to simplified Chinese characters
  const hkConverter = OpenCC.Converter({ from: "hk", to: "cn" });
  const twConverter = OpenCC.Converter({ from: "tw", to: "cn" });
  name = hkConverter(name);
  name = twConverter(name);

  let country: CountryFlag | undefined;

  // If the name contains a country alpha-3 code, determine the country
  const hasAlpha3 = countryFlags.some(item => {
    const alpha3 = item.isoAlpha3.toUpperCase();
    const r1 = new RegExp(`[-_ ]${alpha3}`);
    const r2 = new RegExp(`${alpha3}[-_ ]`);
    if (r1.exec(name) || r2.exec(name)) {
      country = item;
      return true;
    }
    return false;
  });
  if (hasAlpha3 && country) return country;

  // If the name contains a country flag, determine the country
  const hasFlag = countryFlags.some(item => {
    if (name.includes(item.flag)) {
      country = item;
      return true;
    }
    return false;
  });
  if (hasFlag && country) return country;

  // If the name contains a country name, determine the country
  const hasName = countryFlags.some(item => {
    const countryNames = countries.getName(item.isoAlpha2, "zh", {
      select: "all"
    });
    if (countryNames && countryNames.some(cn => name.includes(cn))) {
      country = item;
      return true;
    }
    return false;
  });
  if (hasName && country) return country;

  // If the name contains a country flag short code, determine the country
  const hasShortCode = countryFlags.some(item => {
    const sc1 = `:flag-${item.isoAlpha2.toLowerCase()}:`;
    const sc2 = `:${item.isoAlpha2.toLowerCase()}:`;
    if (name.includes(sc1) || name.includes(sc2)) {
      country = item;
      return true;
    }
    return false;
  });
  if (hasShortCode && country) return country;

  return undefined;
};

const hashCode = (proxy: any): string => {
  const stringify = deterministic({ ...proxy, name: undefined });
  return crypto.createHash("sha256").update(stringify).digest().toHex().toUpperCase().slice(0, 8);
};

export const normalize = (proxies: any[]) => {
  proxies = proxies
    .map(proxy => {
      if (!proxy.name) return undefined;

      const country = detectCountryFromProxyName(proxy.name);
      if (country) {
        const countryName = countries.getName(country.isoAlpha2, "zh", {
          select: "official"
        });
        if (countryName) {
          return {
            ...proxy,
            name: `${country.flag} ${countryName}-${hashCode(proxy)}`
          };
        }
      }
      return {
        ...proxy,
        name: `🏁 未知-${hashCode(proxy)}`
      };
    })
    .filter(Boolean);

  // Sort proxy keys in alphabetical order, but keep fixedKeys at the front
  const fixedKeys = ["name", "type", "server", "port"];
  proxies = proxies.map(proxy => {
    const obj = JSON.parse(deterministic(proxy));
    const otherKeys = Object.keys(obj).filter(k => !fixedKeys.includes(k));
    const orderedKeys = [...fixedKeys.filter(k => k in obj), ...otherKeys];
    return Object.fromEntries(orderedKeys.map(k => [k, obj[k]]));
  });

  // Deduplicate proxies by renaming proxies with number suffixes
  const nameCounter: Record<string, number> = {};
  proxies = proxies.map(proxy => {
    const name = proxy.name;
    if (name) {
      nameCounter[name] = (nameCounter[name] || 0) + 1;
      if (nameCounter[name] > 1) {
        return { ...proxy, name: `${name}-${nameCounter[name]}` };
      }
    }
    return proxy;
  });
  return proxies;
};
