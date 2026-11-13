// "Hide opinion" is remembered per reader in a cookie. The URL wins when it
// says `?opinion=hide` or `?opinion=show`; otherwise the stored choice applies.
// middleware.ts writes the cookie whenever the URL carries an explicit choice.

export const OPINION_COOKIE = "gn_hide_opinion";
export const OPINION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function resolveOpinion(param: string | undefined, cookieValue: string | undefined) {
  const stored = cookieValue === "1";
  const hide = param === "hide" ? true : param === "show" ? false : stored;
  // Value for the `opinion` query param in links that should end up hidden or
  // shown. "show" is only needed to override a stored "hide".
  const paramFor = (h: boolean): string | null => (h ? "hide" : stored ? "show" : null);
  return { hide, paramFor };
}
