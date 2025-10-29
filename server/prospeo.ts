const PROSPEO_API_KEY = process.env.PROSPEO_API_KEY || "";
const PROSPEO_API_URL = "https://api.prospeo.io/email-finder";

export interface ProspeoEmailResult {
  email: string | null;
  confidence: string | null;
  success: boolean;
  error?: string;
}

export async function findEmailWithProspeo(
  firstName: string,
  lastName: string,
  domain: string
): Promise<ProspeoEmailResult> {
  if (!PROSPEO_API_KEY) {
    return {
      email: null,
      confidence: null,
      success: false,
      error: "Prospeo API key not configured",
    };
  }

  if (!domain) {
    return {
      email: null,
      confidence: null,
      success: false,
      error: "Domain is required",
    };
  }

  try {
    const response = await fetch(PROSPEO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KEY": PROSPEO_API_KEY,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        company_domain: domain,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Prospeo API error (${response.status}):`, errorText);
      return {
        email: null,
        confidence: null,
        success: false,
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    if (data.email) {
      return {
        email: data.email,
        confidence: data.score || data.confidence || null,
        success: true,
      };
    } else {
      return {
        email: null,
        confidence: null,
        success: false,
        error: data.message || "No email found",
      };
    }
  } catch (error) {
    console.error("Prospeo API request failed:", error);
    return {
      email: null,
      confidence: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
