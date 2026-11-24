import { Injectable } from '@angular/core';

const STORAGE_KEY = 'cb_attribution_v1';

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  referrer?: string;
  capturedAt?: string;
}

/**
 * Captures UTM / click-ID attribution once on first landing and persists it in
 * sessionStorage so it survives navigation. Ad landing pages read it back when
 * a lead is submitted so every lead is tagged with the campaign that produced it.
 */
@Injectable({ providedIn: 'root' })
export class UtmService {
  /** Called once at app bootstrap. Reads the current URL + document.referrer. */
  capture(): void {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const incoming: Attribution = {
      utmSource: params.get('utm_source') ?? undefined,
      utmMedium: params.get('utm_medium') ?? undefined,
      utmCampaign: params.get('utm_campaign') ?? undefined,
      utmContent: params.get('utm_content') ?? undefined,
      utmTerm: params.get('utm_term') ?? undefined,
      gclid: params.get('gclid') ?? undefined,
      fbclid: params.get('fbclid') ?? undefined,
    };

    const hasIncoming = Object.values(incoming).some((v) => v);
    const existing = this.read();

    // First-touch wins, but a fresh ad click (new UTMs in the URL) refreshes it.
    if (!existing || hasIncoming) {
      const merged: Attribution = {
        ...(existing ?? {}),
        ...incoming,
        landingPage: existing?.landingPage ?? window.location.pathname + window.location.search,
        referrer: existing?.referrer ?? (document.referrer || undefined),
        capturedAt: existing?.capturedAt ?? new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // sessionStorage full / blocked — silently ignore
      }
    }
  }

  /** Returns the captured attribution, if any. */
  read(): Attribution | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Attribution) : null;
    } catch {
      return null;
    }
  }

  /**
   * A short, human-readable one-line summary of the captured attribution,
   * suitable for appending to a lead's message so the agent can see where the
   * lead came from. Returns '' when there is nothing to report.
   */
  describe(): string {
    const a = this.read();
    if (!a) return '';
    const parts: string[] = [];
    if (a.utmSource) parts.push(`source=${a.utmSource}`);
    if (a.utmMedium) parts.push(`medium=${a.utmMedium}`);
    if (a.utmCampaign) parts.push(`campaign=${a.utmCampaign}`);
    if (a.utmContent) parts.push(`content=${a.utmContent}`);
    if (a.utmTerm) parts.push(`term=${a.utmTerm}`);
    if (a.gclid) parts.push(`gclid=${a.gclid}`);
    if (a.fbclid) parts.push(`fbclid=${a.fbclid}`);
    return parts.length ? `Ad tracking: ${parts.join(' · ')}` : '';
  }
}
