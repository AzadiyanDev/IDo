import { Component } from '@angular/core';

@Component({
  selector: 'ido-add-task-modal',
  standalone: true,
  template: `
    <form class="modal-form">
      <h2>Add task</h2>
      <input class="field" placeholder="Title">
      <textarea class="field" placeholder="Description"></textarea>
      <button class="primary-button" type="button">Create task</button>
    </form>
  `,
  styles: [`.modal-form { display: grid; gap: 10px; } h2 { margin: 0 0 4px; } textarea { min-height: 90px; resize: vertical; }`]
})
export class AddTaskModalComponent {}
