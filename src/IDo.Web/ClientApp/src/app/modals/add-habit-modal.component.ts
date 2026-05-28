import { Component } from '@angular/core';

@Component({
  selector: 'ido-add-habit-modal',
  standalone: true,
  template: `
    <form class="modal-form">
      <h2>Add habit</h2>
      <input class="field" placeholder="Title">
      <input class="field" placeholder="Reminder time">
      <button class="primary-button" type="button">Create habit</button>
    </form>
  `,
  styles: [`.modal-form { display: grid; gap: 10px; } h2 { margin: 0 0 4px; }`]
})
export class AddHabitModalComponent {}
