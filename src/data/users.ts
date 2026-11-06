/** Test identities. Never a real person's address: example.test is reserved for testing (RFC 2606). */
export const emails = {
  valid: (tag = "qa") => `${tag}+${Date.now()}@example.test`,
  invalid: ["", "plainaddress", "no-at-sign.example.test", "a@", "@example.test", "a b@example.test"],
};
