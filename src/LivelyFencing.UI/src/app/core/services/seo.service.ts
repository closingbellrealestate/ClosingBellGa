import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Per-route SEO settings, supplied via `data: { seo: {...} }` in app.routes.ts. */
export interface SeoData {
  title?: string;
  description?: string;
  /** Keep the page out of search results (app/admin screens, 404s). */
  noindex?: boolean;
  /** The page's component calls SeoService.set() itself once its data is known. */
  dynamic?: boolean;
}

export const SITE_ORIGIN = 'https://closingbellga.com';
export const SITE_NAME = 'Closing Bell Real Estate';
export const DEFAULT_DESCRIPTION =
  'The Closing Bell Real Estate Team with Willow Bend Properties helps buyers and sellers in ' +
  'Dawsonville, Dahlonega, Gainesville, Cumming and North Georgia. Search homes for sale or call 678-206-6389.';

/**
 * Sets <title>, meta description, canonical link, robots and Open Graph tags.
 * Route-level defaults are applied on every navigation; components with dynamic
 * content (e.g. a listing) call `set()` again once their data loads.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);
  private router = inject(Router);

  /** Call once from the root component. */
  init() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      let snap: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
      while (snap.firstChild) snap = snap.firstChild;
      const seo: SeoData = snap.data['seo'] ?? {};
      if (seo.dynamic) return;
      // Anything without explicit SEO data (internal /cq, /portal screens) is noindex.
      this.set({ noindex: !snap.data['seo'], ...seo });
    });
  }

  set(seo: SeoData) {
    const title = seo.title ? `${seo.title} | ${SITE_NAME}` : `${SITE_NAME} | North Georgia Homes for Sale`;
    const description = seo.description ?? DEFAULT_DESCRIPTION;
    const url = SITE_ORIGIN + this.router.url.split(/[?#]/)[0].replace(/\/+$/, '');
    const canonical = url === SITE_ORIGIN ? SITE_ORIGIN + '/' : url;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: seo.noindex ? 'noindex, nofollow' : 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.setCanonical(canonical);
  }

  private setCanonical(href: string) {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }
}
