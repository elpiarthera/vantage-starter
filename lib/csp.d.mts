/**
 * Build the Content-Security-Policy header value.
 *
 * @param rawDomain Clerk custom/satellite domain, with or without scheme.
 *   Defaults to `process.env.NEXT_PUBLIC_CLERK_DOMAIN`. When unset or blank the
 *   custom-domain source is omitted entirely and the directive stays well-formed.
 */
export declare function buildCsp(rawDomain?: string | undefined): string;
