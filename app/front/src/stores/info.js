import { apiInfoMessages } from '../apiInfoMessages';
import { defineStore } from 'pinia'

export const useInfoStore = defineStore('infoStore', {
  state: () => ({
    _toasts: [],
    _alerts: [],
  }),
  getters: {
    anyToast: (state) => {
      return state._toasts && state._toasts.length > 0;
    },
    anyAlert: (state) => {
      return state._alerts && state._alerts.length > 0;
    },
  },
  actions: {
    addAppInfo(messageType) {
      console.log('addAppInfo called with messageType:', messageType);
      if (!messageType) return;
      if (apiInfoMessages[messageType]) {
        const [message, type, displayMethod] = apiInfoMessages[messageType];
        if (displayMethod === 'toast') {
          this.addToast(message, type);
        } else if (displayMethod === 'alert') {
          this.addAlert(message, type);
        }
      }
    },
    addToast(message, type = 'info', duration = 3000, title = null) {
      this._toasts.push({ message, type, title, duration });
    },
    getToast() {
      return this._toasts.shift();
    },
    addAlert(message, type = 'info', title = null) {
      this._alerts.push({ message, type, title });
    },
    getAlert() {
      return this._alerts.shift();
    },
  },
})
