/**
 * Employer email policy.
 *
 * This is intentionally a policy gate, not proof of employment. OTP delivery
 * proves the person controls the inbox; the recruiter role is only granted
 * after both checks pass. A domain allowlist can be used for legacy accounts
 * or a deliberate beta cohort.
 *
 * Keep this list conservative: blocking a provider that a real company uses is
 * worse than allowing an uncommon personal domain. The important cases are the
 * large consumer mailbox providers and disposable-inbox services.
 */

const PERSONAL_EMAIL_DOMAINS = new Set([
  // Google
  "gmail.com",
  "googlemail.com",
  // Microsoft consumer mail
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // Yahoo / AOL
  "yahoo.com",
  "aol.com",
  "aim.com",
  "rocketmail.com",
  "ymail.com",
  // Privacy-focused personal providers
  "protonmail.com",
  "protonmail.ch",
  "proton.me",
  "pm.me",
  "tutanota.com",
  "tutanota.de",
  "tuta.io",
  "tuta.com",
  "hey.com",
  "fastmail.com",
  "fastmail.fm",
  "hushmail.com",
  "mailfence.com",
  "startmail.com",
  "runbox.com",
  "posteo.de",
  "mailbox.org",
  "disroot.org",
  "riseup.net",
  "autistici.org",
  "openmailbox.org",
  // Webmail / ISP mail
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "gmx.at",
  "gmx.ch",
  "web.de",
  "mail.com",
  "email.com",
  "lycos.com",
  "excite.com",
  "juno.com",
  "netzero.net",
  "earthlink.net",
  "comcast.net",
  "xfinity.com",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "bellsouth.net",
  "pacbell.net",
  "ameritech.net",
  "swbell.net",
  "nvbell.net",
  "prodigy.net",
  "cox.net",
  "charter.net",
  "spectrum.net",
  "roadrunner.com",
  "twc.com",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
  "talktalk.net",
  "ntlworld.com",
  "blueyonder.co.uk",
  "tiscali.co.uk",
  "orange.net",
  "free.fr",
  "orange.fr",
  "wanadoo.fr",
  "laposte.net",
  "sfr.fr",
  "bbox.fr",
  "aliceadsl.fr",
  "t-online.de",
  "freenet.de",
  "arcor.de",
  "libero.it",
  "virgilio.it",
  "tin.it",
  "alice.it",
  "tiscali.it",
  "fastwebnet.it",
  "seznam.cz",
  "centrum.cz",
  "email.cz",
  "volny.cz",
  "wp.pl",
  "o2.pl",
  "interia.pl",
  "onet.pl",
  "gazeta.pl",
  "mail.ru",
  "inbox.ru",
  "bk.ru",
  "list.ru",
  "rambler.ru",
  "yandex.com",
  "yandex.ru",
  "ya.ru",
  "abv.bg",
  "mail.bg",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "sohu.com",
  "139.com",
  "foxmail.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
  "rediffmail.com",
  "rediff.com",
  "bigpond.com",
  "optusnet.com.au",
  "iinet.net.au",
  "dodo.com.au",
  "shaw.ca",
  "rogers.com",
  "bell.net",
  "telus.net",
  "sympatico.ca",
  // Email-alias services (the underlying inbox is usually personal)
  "duck.com",
  "simplelogin.com",
  "simplelogin.io",
  "anonaddy.com",
  "addy.io",
  "33mail.com",
  "mozmail.com",
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "grr.la",
  "spam4.me",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "tempmail.net",
  "temp-mail.org",
  "temp-mail.io",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "cool.fr.nf",
  "jetable.org",
  "trashmail.com",
  "trashmail.net",
  "trash-mail.com",
  "dispostable.com",
  "fakeinbox.com",
  "getnada.com",
  "nada.email",
  "maildrop.cc",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mailcatch.com",
  "mytemp.email",
  "burnermail.io",
  "tempmailaddress.com",
  "tempmailo.com",
  "mohmal.com",
  "harakirimail.com",
  "mail.tm",
  "inboxkitten.com",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "vjuum.com",
  "laafd.com",
  "txcct.com",
  "emailfake.com",
  "generator.email",
  "tempail.com",
  "tempinbox.com",
  "mailtemp.net",
  "mail-temp.com",
  "mailsac.com",
  "correotemporal.org",
  "tempr.email",
  "discard.email",
  "spamfree24.org",
  "trashmail.de",
  "wegwerfemail.de",
  "einmalpost.de",
  "emaildienst.de",
]);

/** Country/tenant variants of consumer providers. */
const PERSONAL_EMAIL_PATTERNS = [
  /^yahoo\.[a-z.]+$/,
  /^hotmail\.[a-z.]+$/,
  /^outlook\.[a-z.]+$/,
  /^live\.[a-z.]+$/,
  /^gmx\.[a-z.]+$/,
  /^rediffmail\.[a-z.]+$/,
  /^tutanota\.[a-z.]+$/,
];

const RESERVED_DOMAINS = new Set(["example.com", "example.org", "example.net", "example.edu", "test.com"]);

const RESERVED_TLDS = [".example", ".invalid", ".localhost", ".test"];

const EMAIL_RE = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;

export const EMPLOYER_EMAIL_MESSAGE =
  "Use your company email address. Personal inboxes such as Gmail, Yahoo, Outlook, and iCloud are not accepted.";

export type EmployerEmailCheck = {
  allowed: boolean;
  domain: string;
  message: string | null;
};

function configuredEntries(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function matchesAllowlist(email: string, domain: string) {
  return configuredEntries(process.env.EMPLOYER_EMAIL_ALLOWLIST).some((entry) =>
    entry.includes("@") ? email === entry : domain === entry || domain.endsWith(`.${entry}`),
  );
}

function matchesExtraBlocklist(domain: string) {
  return configuredEntries(process.env.EMPLOYER_EMAIL_BLOCKLIST).some(
    (entry) => domain === entry || domain.endsWith(`.${entry}`),
  );
}

function isPersonalDomain(domain: string) {
  return (
    PERSONAL_EMAIL_DOMAINS.has(domain) ||
    PERSONAL_EMAIL_PATTERNS.some((pattern) => pattern.test(domain))
  );
}

function rejection(domain: string, message: string): EmployerEmailCheck {
  return { allowed: false, domain, message };
}

/**
 * Checks whether an address is eligible for the employer flow. The allowlist
 * is checked first so a legacy account can be explicitly permitted.
 */
export function checkEmployerEmail(value: string): EmployerEmailCheck {
  const email = value.trim().toLowerCase();
  const match = EMAIL_RE.exec(email);
  const domain = match?.[1]?.replace(/\.$/, "") ?? "";

  if (!domain) {
    return rejection("", "Enter a valid work email address.");
  }

  // An explicit blocklist is a deliberate override and always wins, even over
  // an allowlist entry.
  if (matchesExtraBlocklist(domain)) {
    return rejection(domain, "That email domain is not accepted. Use your company email address.");
  }

  if (matchesAllowlist(email, domain)) {
    return { allowed: true, domain, message: null };
  }

  if (
    RESERVED_DOMAINS.has(domain) ||
    RESERVED_TLDS.some((suffix) => domain.endsWith(suffix)) ||
    domain === "localhost" ||
    !domain.includes(".")
  ) {
    return rejection(domain, "Use a real company email address.");
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return rejection(domain, "Disposable inboxes are not accepted. Use your company email address.");
  }

  if (isPersonalDomain(domain)) {
    return rejection(domain, EMPLOYER_EMAIL_MESSAGE);
  }

  return { allowed: true, domain, message: null };
}

/** Throws a user-facing error when an address cannot be used for an employer account. */
export function assertEmployerEmail(value: string) {
  const result = checkEmployerEmail(value);
  if (!result.allowed) {
    throw new Error(result.message ?? EMPLOYER_EMAIL_MESSAGE);
  }
  return result;
}
