import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { UtmService } from '../../core/services/utm.service';
import { LP_CONFIGS, LP_FALLBACK, LpConfig } from './lp-configs';

@Component({
  selector: 'app-lp-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="lp-hero" [style]="heroStyle()">
      <div class="lp-hero-inner">
        <div class="lp-copy">
          <p class="lp-eyebrow">{{ config().eyebrow }}</p>
          <h1>{{ config().headline }}</h1>
          <p class="lp-sub">{{ config().subhead }}</p>

          <p class="lp-listing" *ngIf="listingAddress()">
            <span class="lp-listing-addr">{{ listingAddress() }}</span>
            <span class="lp-listing-price" *ngIf="listingPrice()">{{ listingPrice() | currency:'USD':'symbol':'1.0-0' }}</span>
          </p>

          <ul class="lp-bullets">
            <li *ngFor="let b of config().bullets">
              <span class="lp-check" aria-hidden="true">&#10003;</span>
              <span>{{ b }}</span>
            </li>
          </ul>

          <div class="lp-proof" *ngIf="config().proof?.length">
            <div class="lp-proof-item" *ngFor="let p of config().proof!">
              <div class="lp-proof-value">{{ p.value }}</div>
              <div class="lp-proof-label">{{ p.label }}</div>
            </div>
          </div>
        </div>

        <aside class="lp-form-card" id="lead-form">
          <ng-container *ngIf="!submitted(); else thanks">
            <h2>{{ config().formHeadline }}</h2>
            <p class="lp-form-sub" *ngIf="config().formSubhead">{{ config().formSubhead }}</p>

            <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
              <label *ngFor="let field of config().formFields">
                <span>{{ field.label }}<em *ngIf="field.required"> *</em></span>
                <textarea *ngIf="field.type === 'textarea'"
                  rows="3"
                  [name]="field.key"
                  [(ngModel)]="form[field.key]"
                  [placeholder]="field.placeholder ?? ''"
                  [required]="!!field.required"></textarea>
                <input *ngIf="field.type !== 'textarea'"
                  [type]="field.type ?? 'text'"
                  [name]="field.key"
                  [(ngModel)]="form[field.key]"
                  [placeholder]="field.placeholder ?? ''"
                  [required]="!!field.required"
                  [autocomplete]="autocompleteFor(field.key)" />
              </label>

              <p class="lp-error" *ngIf="submitError()">{{ submitError() }}</p>

              <button type="submit" class="lp-cta" [disabled]="submitting() || f.invalid">
                {{ submitting() ? 'Sending\u2026' : config().ctaLabel }}
              </button>
              <p class="lp-reassurance" *ngIf="config().ctaReassurance">{{ config().ctaReassurance }}</p>
            </form>
          </ng-container>

          <ng-template #thanks>
            <div class="lp-thanks" id="lp-thanks">
              <div class="lp-thanks-icon" aria-hidden="true">&#10003;</div>
              <h2>{{ config().thankYouHeadline }}</h2>
              <p>{{ config().thankYouBody }}</p>
              <a routerLink="/listings" class="lp-cta lp-cta-secondary">Browse listings</a>
            </div>
          </ng-template>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #14201b; }

    .lp-hero {
      background-size: cover; background-position: center; background-repeat: no-repeat;
      color: #fff; padding: clamp(2.5rem, 6vw, 5rem) 1.5rem clamp(3rem, 8vw, 6rem);
      min-height: 100vh; box-sizing: border-box;
    }
    .lp-hero-inner {
      max-width: 1180px; margin: 0 auto; display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 3rem; align-items: start;
    }
    @media (max-width: 900px) { .lp-hero-inner { grid-template-columns: 1fr; gap: 2rem; } }

    .lp-eyebrow {
      font-size: 0.78rem; letter-spacing: 0.25em; text-transform: uppercase;
      color: #C9A96E; margin: 0 0 1rem;
    }
    .lp-copy h1 {
      font-size: clamp(2.1rem, 5vw, 3.4rem); line-height: 1.1; margin: 0 0 1.25rem; font-weight: 700;
    }
    .lp-sub { font-size: 1.1rem; line-height: 1.6; margin: 0 0 1.5rem; max-width: 56ch; color: rgba(255,255,255,0.92); }

    .lp-listing {
      display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1rem;
      margin: 0 0 1.5rem; padding: 0.85rem 1rem; border-radius: 10px;
      background: rgba(0,0,0,0.28); border: 1px solid rgba(201,169,110,0.35);
    }
    .lp-listing-addr { font-weight: 600; font-size: 1.02rem; }
    .lp-listing-price { color: #C9A96E; font-weight: 700; font-size: 1.15rem; }

    .lp-bullets { list-style: none; padding: 0; margin: 0 0 2rem; }
    .lp-bullets li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.5rem 0; font-size: 1.02rem; line-height: 1.5; }
    .lp-check {
      display: inline-flex; align-items: center; justify-content: center;
      flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%;
      background: #C9A96E; color: #1A3A2A; font-weight: 700; font-size: 0.85rem; margin-top: 0.15rem;
    }

    .lp-proof {
      display: flex; gap: 2rem; flex-wrap: wrap; padding-top: 1.25rem;
      border-top: 1px solid rgba(255,255,255,0.18);
    }
    .lp-proof-value { font-size: 1.7rem; font-weight: 700; color: #C9A96E; line-height: 1; }
    .lp-proof-label { font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-top: 0.35rem; }

    .lp-form-card {
      background: #fff; color: #222; border-radius: 14px; padding: 2rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.35); position: sticky; top: 1.5rem;
    }
    @media (max-width: 900px) { .lp-form-card { position: static; } }
    .lp-form-card h2 { font-size: 1.55rem; margin: 0 0 0.4rem; color: #1A3A2A; font-weight: 700; }
    .lp-form-sub { color: #666; margin: 0 0 1.25rem; font-size: 0.95rem; }

    .lp-form-card form label { display: block; margin-bottom: 0.85rem; }
    .lp-form-card form label > span { display: block; font-size: 0.82rem; font-weight: 600; color: #333; margin-bottom: 0.35rem; }
    .lp-form-card form label em { color: #C84B00; font-style: normal; }
    .lp-form-card input, .lp-form-card textarea {
      width: 100%; box-sizing: border-box; padding: 0.7rem 0.9rem;
      border: 1px solid #d8d8d0; border-radius: 8px; font-size: 1rem; font-family: inherit;
      background: #fff; color: #1A3A2A; transition: border-color 0.15s, box-shadow 0.15s;
    }
    .lp-form-card input:focus, .lp-form-card textarea:focus {
      outline: none; border-color: #1A3A2A; box-shadow: 0 0 0 3px rgba(26,58,42,0.14);
    }
    .lp-form-card textarea { resize: vertical; min-height: 80px; }

    .lp-error {
      background: #fdecec; color: #b54545; border-left: 3px solid #b54545;
      padding: 0.65rem 0.85rem; border-radius: 4px; margin: 0.5rem 0 1rem; font-size: 0.9rem;
    }

    .lp-cta {
      display: block; width: 100%; background: #1A3A2A; color: #fff; border: 0;
      padding: 0.95rem 1.5rem; border-radius: 8px; font-size: 1.05rem; font-weight: 700;
      font-family: inherit; cursor: pointer; transition: background 0.15s, transform 0.05s;
      margin-top: 0.5rem; text-align: center; text-decoration: none;
    }
    .lp-cta:hover:not(:disabled) { background: #12291d; }
    .lp-cta:active:not(:disabled) { transform: translateY(1px); }
    .lp-cta:disabled { opacity: 0.6; cursor: not-allowed; }
    .lp-cta-secondary { background: #fff; color: #1A3A2A; border: 1px solid #1A3A2A; margin-top: 1.5rem; }
    .lp-cta-secondary:hover { background: #f5f5f0; }

    .lp-reassurance { text-align: center; font-size: 0.8rem; color: #888; margin: 0.75rem 0 0; }

    .lp-thanks { text-align: center; padding: 1rem 0; color: #222; }
    .lp-thanks-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 50%; background: #1A3A2A; color: #fff;
      font-size: 1.8rem; font-weight: 700; margin-bottom: 1rem;
    }
    .lp-thanks h2 { margin: 0 0 0.65rem; color: #1A3A2A; }
    .lp-thanks p { color: #444; line-height: 1.55; margin: 0 auto; max-width: 40ch; }
  `]
})
export class LpPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private utm = inject(UtmService);
  private title = inject(Title);

  config = signal<LpConfig>(LP_FALLBACK);
  heroStyle = computed(() => {
    const c = this.config();
    const overlay = c.heroOverlay ?? 'rgba(26, 58, 42, 0.55)';
    return {
      'background-image': `linear-gradient(${overlay}, ${overlay}), url('${c.heroImage}')`,
    };
  });

  form: Record<string, string> = { name: '', email: '', phone: '', message: '' };

  submitting = signal(false);
  submitted = signal(false);
  submitError = signal<string | null>(null);
  listingKey = signal<string | null>(null);
  listingAddress = signal<string | null>(null);
  listingPrice = signal<number | null>(null);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const config = LP_CONFIGS[slug] ?? LP_FALLBACK;
    this.config.set(config);
    this.title.setTitle(config.pageTitle);

    const q = this.route.snapshot.queryParamMap;
    const key = q.get('listingKey')?.trim() || null;
    const address = q.get('listingAddress')?.trim() || null;
    const priceRaw = q.get('listingPrice');
    const price = priceRaw ? Number(priceRaw) : NaN;

    this.listingKey.set(key);
    this.listingAddress.set(address);
    this.listingPrice.set(Number.isFinite(price) ? price : null);

    if (address && !this.form['message']) {
      this.form['message'] = `Hi, I'm interested in ${address}. Please send details.`;
    }
  }

  autocompleteFor(key: string): string {
    return key === 'email' ? 'email' : key === 'phone' ? 'tel' : key === 'name' ? 'name' : 'off';
  }

  submit(form: NgForm) {
    if (form.invalid || this.submitting()) return;
    const c = this.config();

    this.submitting.set(true);
    this.submitError.set(null);

    const message = this.buildMessage();

    this.api.submitContactRequest({
      name: (this.form['name'] || '').trim(),
      email: (this.form['email'] || '').trim(),
      phone: (this.form['phone'] || '').trim(),
      message,
      source: c.leadSource,
    }).subscribe({
      next: () => {
        this.submitted.set(true);
        this.submitting.set(false);
        queueMicrotask(() => {
          document.getElementById('lp-thanks')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      },
      error: () => {
        this.submitError.set('Sorry \u2014 we could not submit your request. Please try again or call us directly.');
        this.submitting.set(false);
      },
    });
  }

  /** Combine the visitor's note with listing + ad-tracking context for the agent. */
  private buildMessage(): string {
    const lines: string[] = [];
    const note = (this.form['message'] || '').trim();
    if (note) lines.push(note);

    const context: string[] = [];
    const address = this.listingAddress();
    if (address) {
      const price = this.listingPrice();
      context.push(`Property: ${address}${price ? ` (${this.formatPrice(price)})` : ''}`);
    }
    const key = this.listingKey();
    if (key) context.push(`Listing ID: ${key}`);
    context.push(`Landing page: /lp/${this.config().slug}`);
    const tracking = this.utm.describe();
    if (tracking) context.push(tracking);

    if (context.length) {
      if (lines.length) lines.push('');
      lines.push('— Lead context —');
      lines.push(...context);
    }
    return lines.join('\n');
  }

  private formatPrice(n: number): string {
    try {
      return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    } catch {
      return `$${Math.round(n)}`;
    }
  }
}
