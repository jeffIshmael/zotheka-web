import { NextResponse } from "next/server";

const ELEMENTPAY_API = process.env.ELEMENTPAY_API_URL || "https://api.elementpay.net/api/v1";
const API_KEY = process.env.ELEMENTPAY_LIVE_API_KEY;

export const dynamic = "force-dynamic";

function getMinimumAmount(countryData: any) {
  let minAmount = 5000;
  try {
    const momoProviders = countryData?.payment_methods?.mobile_money?.providers || [];
    const bankProviders = countryData?.payment_methods?.bank?.providers || [];
    const allProviders = [...momoProviders, ...bankProviders];
    
    if (allProviders.length > 0) {
      // Find the absolute minimum across all providers
      minAmount = Math.min(...allProviders.map(p => p.min_amount).filter(val => typeof val === 'number'));
    }
  } catch (e) {
    // default to 5000 on error
  }
  return minAmount === Infinity ? 5000 : minAmount;
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "ElementPay API key not configured" }, { status: 500 });
  }

  try {
    // 1. Fetch full catalog
    const catalogRes = await fetch(`${ELEMENTPAY_API}/partner/catalog`, {
      headers: { "X-API-Key": API_KEY },
      cache: "no-store"
    });
    const catalogData = await catalogRes.json();

    const onRampCountries = catalogData?.data?.onramp?.countries || {};
    const offRampCountries = catalogData?.data?.offramp?.countries || {};

    // 2. Extract all unique currencies
    const uniqueCurrencies = new Set<string>();
    Object.values(onRampCountries).forEach((c: any) => c.currency && uniqueCurrencies.add(c.currency));
    Object.values(offRampCountries).forEach((c: any) => c.currency && uniqueCurrencies.add(c.currency));
    
    const currenciesStr = Array.from(uniqueCurrencies).join(",");

    // 3. Fetch rates for all currencies
    let ratesMap: Record<string, any> = {};
    if (currenciesStr) {
      const ratesRes = await fetch(`${ELEMENTPAY_API}/partner/rates/indicative?fiat=${currenciesStr}`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store"
      });
      const ratesData = await ratesRes.json();
      const ratesArray = ratesData?.data?.rates || [];
      ratesArray.forEach((rateInfo: any) => {
        ratesMap[rateInfo.code] = rateInfo;
      });
    }

    // 4. Build response array
    const buildResponse = (countriesDict: Record<string, any>, isOnRamp: boolean) => {
      return Object.values(countriesDict).filter((c: any) => c.enabled).map((c: any) => {
        const rateInfo = ratesMap[c.currency] || {};
        const minAmount = getMinimumAmount(c);
        
        let rateStr = "N/A";
        if (isOnRamp && rateInfo.buy) {
          rateStr = `1 USD = ${rateInfo.buy} ${c.currency}`;
        } else if (!isOnRamp && rateInfo.sell) {
          rateStr = `1 USD = ${rateInfo.sell} ${c.currency}`;
        }

        return {
          country: c.country_name,
          countryCode: c.country_code,
          currency: c.currency,
          rate: rateStr,
          minimumAmount: minAmount,
          updatedAt: rateInfo.updatedAt || new Date().toISOString()
        };
      });
    };

    return NextResponse.json({
      success: true,
      onRamp: buildResponse(onRampCountries, true),
      offRamp: buildResponse(offRampCountries, false)
    });
  } catch (error) {
    console.error("Rates fetch error", error);
    return NextResponse.json({ error: "Failed to fetch ElementPay rates" }, { status: 500 });
  }
}
