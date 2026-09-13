// Most integration tests create many guest accounts via supertest, which all
// share one "IP" — the production anti-abuse cap (env.guestSignupsPerIpPerDay,
// default 3/day) would 429 most of them. Bump it for the whole test run; the
// dedicated rate-limit test overrides it directly via createApp's
// guestSignupsPerIpPerDay dep instead of relying on this env var.
process.env.GUEST_SIGNUPS_PER_IP_PER_DAY = process.env.GUEST_SIGNUPS_PER_IP_PER_DAY ?? '100000';
