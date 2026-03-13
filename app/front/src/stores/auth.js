import { defineStore } from 'pinia'
import { fetchData, wait } from '../functions/Utils';
import router from '../router/index';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    checked: false,
    user: null,
  }),
  getters: {
    // doubleCount: (state) => state.count * 2,
  },
  actions: {
    async isAuthenticated() {
      if (!this.checked) {
        await this.waitForCheck();
      }
      return !!this.user;
    },
    async waitForCheck() {
      while (!this.checked) {
        await wait(50);
      }
    },
    async check() {
      const response = await fetchData('/auth/me');

      this.checked = true;
      if (response.data?.user) {
        this.user = response.data.user;
      }
    },
    async logout() {
      await fetchData('/auth/logout');
      this.user = null;

      // check if current route requires auth, if so redirect to login
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push({ name: 'UnloggedView' });
      }
    },
    async loginAsGuest(userName) {
      // this.user = userName;

      const response = await fetchData('/auth/joinAsGuest', { name: userName }, 'POST');

      // this.user = response.data?.user ?? null;
      // if(this.user) {
      //   router.push('/game');
      // // } else {
      // //   alert('Nie udało się dołączyć jako gość. Spróbuj ponownie.');
      // }

      if (response.data?.user) {
        this.user = response.data.user;
      }
      return response;
    },
    async login(username, password, rememberMe) {
      const response = await fetchData('/auth/login', {
        username,
        password,
        rememberMe,
      }, 'POST');

      if (response.data?.user) {
        this.user = response.data.user;
      }
      return response;
    },
    async register(username, email, password, passwordConfirm) {
      const response = await fetchData('/auth/register', {
        username,
        email,
        password,
        passwordConfirm,
      }, 'POST');
      return response;
    },
    async changePassword(email, password, passwordConfirm) {
      const response = await fetchData('/auth/change-password', {
        email,
        password,
        passwordConfirm,
      }, 'POST');
      return response;
    }
  },
})
