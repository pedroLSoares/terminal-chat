import ComponentsBuilder from './components.js';
import { constants } from './constants.js';

export default class TerminalController {
  #usersCollors = new Map();
  constructor() {}

  #pickCollor() {
    return `#${(((1 << 24) * Math.random()) | 0).toString(16)}-fg`;
  }

  #getUserCollor(userName) {
    if (this.#usersCollors.has(userName))
      return this.#usersCollors.get(userName);

    const collor = this.#pickCollor();
    this.#usersCollors.set(userName, collor);

    return collor;
  }

  #onInputReceived(eventEmitter) {
    return function () {
      const message = this.getValue();
      eventEmitter.emit(constants.events.app.MESSAGE_SENT, message);
      this.clearValue();
    };
  }

  #onMessageReceived({ screen, chat }) {
    return (msg) => {
      const { userName, message } = msg;
      const collor = this.#getUserCollor(userName);
      chat.addItem(`{${collor}}{bold}${userName}{/}: ${message}`);
      screen.render();
    };
  }

  #onLogChanged({ screen, activityLog }) {
    return (msg) => {
      const [username] = msg.split(/\s/);
      const collor = this.#getUserCollor(username);
      activityLog.addItem(`{${collor}}{bold}${msg.toString()}{/}`);
      screen.render();
    };
  }

  #onStatusChanged({ screen, status }) {
    return (users) => {
      //remove o primeiro elemente e retorna ele
      const { content } = status.items.shift();
      status.clearItems();
      status.addItem(content);

      users.forEach((username) => {
        const collor = this.#getUserCollor(username);
        status.addItem(`{${collor}}{bold}${username}{/}`);
      });

      screen.render();
    };
  }

  #registerEvents(eventEmitter, components) {
    eventEmitter.on(
      constants.events.app.MESSAGE_RECEIVED,
      this.#onMessageReceived(components)
    );
    eventEmitter.on(
      constants.events.app.ACTIVITY_LOG_UPDATED,
      this.#onLogChanged(components)
    );
    eventEmitter.on(
      constants.events.app.STATUS_UPDATED,
      this.#onStatusChanged(components)
    );
  }

  async initializeTable(eventEmitter) {
    const components = new ComponentsBuilder()
      .setScreen({
        title: 'HackerChat - Pedro Levada',
      })
      .setLayoutComponent()
      .setInputComponent(this.#onInputReceived(eventEmitter))
      .setChatComponent()
      .setActivityLogComponent()
      .setStatusComponent()
      .build();

    this.#registerEvents(eventEmitter, components);
    components.input.focus();
    components.screen.render();
  }
}
