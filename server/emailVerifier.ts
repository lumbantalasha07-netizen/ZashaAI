const MAILBOXLAYER_API_KEY = process.env.MAILBOXLAYER_API_KEY || "";
const MAILBOXLAYER_API_URL = "https://apilayer.net/api/check";

export interface EmailVerificationResult {
  email: string | null;
  valid: boolean;
  score: number | null;
  smtpCheck: boolean;
  error?: string;
}

export interface EmailGuess {
  pattern: string;
  email: string;
}

export function generateEmailPatterns(
  firstName: string,
  lastName: string,
  domain: string
): EmailGuess[] {
  if (!firstName || !domain) {
    return [];
  }

  const first = firstName.toLowerCase().trim();
  const last = lastName?.toLowerCase().trim() || "";
  const cleanDomain = domain.toLowerCase().trim();

  const patterns: EmailGuess[] = [];

  if (last) {
    patterns.push({
      pattern: "first.last@domain",
      email: `${first}.${last}@${cleanDomain}`,
    });
  }

  patterns.push({
    pattern: "first@domain",
    email: `${first}@${cleanDomain}`,
  });

  if (last) {
    patterns.push({
      pattern: "f.last@domain",
      email: `${first[0]}.${last}@${cleanDomain}`,
    });

    patterns.push({
      pattern: "firstl@domain",
      email: `${first}${last[0]}@${cleanDomain}`,
    });
  }

  return patterns;
}

export async function verifyEmailWithMailboxlayer(
  email: string
): Promise<EmailVerificationResult> {
  if (!MAILBOXLAYER_API_KEY) {
    return {
      email,
      valid: false,
      score: null,
      smtpCheck: false,
      error: "Mailboxlayer API key not configured",
    };
  }

  if (!email) {
    return {
      email: null,
      valid: false,
      score: null,
      smtpCheck: false,
      error: "Email is required",
    };
  }

  try {
    const url = `${MAILBOXLAYER_API_URL}?access_key=${MAILBOXLAYER_API_KEY}&email=${encodeURIComponent(
      email
    )}&smtp=1&format=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mailboxlayer API error (${response.status}):`, errorText);
      return {
        email,
        valid: false,
        score: null,
        smtpCheck: false,
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        email,
        valid: false,
        score: null,
        smtpCheck: false,
        error: data.error.info || data.error.type || "Mailboxlayer API error",
      };
    }

    const smtpCheck = data.smtp_check === true;
    const score = data.score || 0;
    const valid = smtpCheck && score > 0.7;

    return {
      email,
      valid,
      score,
      smtpCheck,
    };
  } catch (error) {
    console.error("Mailboxlayer API request failed:", error);
    return {
      email,
      valid: false,
      score: null,
      smtpCheck: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function findValidEmail(
  firstName: string,
  lastName: string,
  domain: string
): Promise<{
  foundEmail: string | null;
  guesses: EmailGuess[];
  verificationResults: EmailVerificationResult[];
}> {
  const guesses = generateEmailPatterns(firstName, lastName, domain);

  if (guesses.length === 0) {
    return {
      foundEmail: null,
      guesses: [],
      verificationResults: [],
    };
  }

  const verificationResults: EmailVerificationResult[] = [];
  let foundEmail: string | null = null;

  for (const guess of guesses) {
    const result = await verifyEmailWithMailboxlayer(guess.email);
    verificationResults.push(result);

    if (result.valid && !foundEmail) {
      foundEmail = result.email;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return {
    foundEmail,
    guesses,
    verificationResults,
  };
}
