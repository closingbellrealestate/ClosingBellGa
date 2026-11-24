import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="nf">
      <h1>Page not found</h1>
      <p>Sorry, we couldn't find that page. It may have moved or no longer exists.</p>
      <p class="links">
        <a routerLink="/">Home</a> &bull;
        <a routerLink="/listings">Search homes for sale</a> &bull;
        <a href="tel:+16782066389">Call 678-206-6389</a>
      </p>
    </section>
  `,
  styles: [`
    .nf { max-width: 640px; margin: 15vh auto; padding: 0 16px; text-align: center; }
    .nf h1 { font-size: 2rem; margin-bottom: .5rem; }
    .links a { color: #C9A96E; font-weight: 500; }
  `]
})
export class NotFoundComponent {}
