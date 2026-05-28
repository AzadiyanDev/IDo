import { Component } from '@angular/core';

@Component({
  selector: 'ido-profile-page',
  standalone: true,
  template: `
    <section class="page">
      <header class="page-header"><h1 class="page-title">Profile</h1></header>
      <article class="card">
        <strong>Profile</strong>
        <p class="muted">Name, avatar, contact info, settings, theme, language, and notifications.</p>
      </article>
    </section>
  `
})
export class ProfilePageComponent {}
