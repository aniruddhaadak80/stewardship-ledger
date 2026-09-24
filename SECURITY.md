# Security Policy

## Reporting

Please report suspected vulnerabilities privately through the repository’s GitHub security advisory form. Do not open a public issue with exploit details or personal data.

## Data handling

The public casebook is designed for synthetic or non-sensitive records. Do not submit secrets, credentials, private personal information, regulated data, or operational security details.

## Trust boundaries

- External research feeds are untrusted input and are normalized before display.
- The MCP endpoint is intentionally public and can mutate cases; production operators should add authentication, rate limits, and abuse controls before using it for sensitive records.
- SHA-384 seals provide tamper evidence for the stored record chain, not confidentiality or authorization.
- The in-memory fallback is for local development only and is not production persistence.

## Scope

The project is educational and does not claim to provide a certified AI safety assurance process.
