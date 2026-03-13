<template>
  <div class="container">
    <div class="w-50 mt-5 mx-auto">
      <div v-if="form == 'login'" class="w-100 m-auto">
        <form @submit="submitLogin">
          <h1 class="h3 mb-2 fw-normal text-center">Zaloguj się do konta</h1>
          <VApiInfo :name="login.info" />
          <!-- <div v-if="loginError" class="alert alert-warning my-2">
            Nieprawidłowe dane logowania. Spróbuj ponownie.
          </div> -->
          <div class="form-floating">
            <input type="text" class="form-control rounded-bottom-0 border-bottom-0" id="floatingInput"
              placeholder="username" v-model="login.username">
            <label for="floatingInput">Nazwa użytkownika</label>
            <div v-if="login.fieldsInfo && login.fieldsInfo.username" class="invalid-feedback">
              <VApiInfo v-for="(msg, index) in login.fieldsInfo.username" :key="index" :name="msg" :only-text="true" />
            </div>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control rounded-top-0" id="floatingPassword" placeholder="Password"
              v-model="login.password">
            <label for="floatingPassword">Hasło</label>
          </div>
          <div class="form-check text-start my-3">
            <input class="form-check-input" type="checkbox" value="remember-me" id="checkDefault"
              v-model="login.rememberMe">
            <label class="form-check-label" for="checkDefault">Zapamiętaj mnie</label>
          </div>
          <button class="btn btn-primary w-100 py-2 mt-2" type="submit">Zaloguj</button>
        </form>
        <p class="mt-3 text-center">Nie pamiętasz loginu lub hasła do konta? <a href="#" @click="form = 'password-change'">Zmień
            hasło</a></p>
        <p class="mt-1 text-center">Nie posiadasz konta? <a href="#" @click="form = 'register'">Zarejestruj się</a></p>
      </div>
      <div v-else-if="form == 'password-change'" class="w-100 m-auto">
        <form @submit="submitPasswordChange">
          <!-- <img class="mb-4" src="/docs/5.3/assets/brand/bootstrap-logo.svg" alt="" width="72" height="57"> -->
          <h1 class="h3 mb-2 fw-normal text-center">Zmiana hasła do konta</h1>
          <VApiInfo :name="passwordChange.info" />
          <div class="alert alert-primary my-2">
            Po wprowadzeniu danych i zatwierdzeniu formularza, otrzymasz na skrzynkę pocztową wiadomość z linkiem
            potwierdzającym zmianę hasła oraz przypomnienie swojej nazwy użytkownika.
          </div>
          <div class="form-floating">
            <input type="email" class="form-control rounded-bottom-0 border-bottom-0" id="floatingInputEmail"
              placeholder="name@example.com" v-model="passwordChange.email">
            <label for="floatingInputEmail">Adres email</label>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control rounded-0 border-bottom-0" id="floatingPassword"
              placeholder="Password" v-model="passwordChange.password">
            <label for="floatingPassword">Hasło</label>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control rounded-top-0" id="floatingPassword2" placeholder="Password"
              v-model="passwordChange.password2">
            <label for="floatingPassword2">Powtórz hasło</label>
          </div>
          <button class="btn btn-primary w-100 py-2 mt-2" type="submit">Wyślij link</button>
        </form>
        <p class="mt-3 text-center">Już posiadasz konto? <a href="#" @click="form = 'login'">Zaloguj się</a></p>
      </div>
      <div v-else class="w-100 m-auto">
        <form @submit="submitRegister">
          <!-- <img class="mb-4" src="/docs/5.3/assets/brand/bootstrap-logo.svg" alt="" width="72" height="57"> -->
          <h1 class="h3 mb-2 fw-normal text-center">Rejestrowanie nowego konta</h1>
          <VApiInfo :name="register.info" />
          <div class="form-floating">
            <input type="text" class="form-control rounded-bottom-0 border-bottom-0" id="floatingInputUsername"
              placeholder="name" v-model="register.username">
            <label for="floatingInputUsername">Nazwa użytkownika</label>
          </div>
          <div class="form-floating">
            <input type="email" class="form-control rounded-bottom-0 border-bottom-0" id="floatingInputEmail"
              placeholder="name@example.com" v-model="register.email">
            <label for="floatingInputEmail">Adres email</label>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control rounded-0 border-bottom-0" id="floatingPassword"
              placeholder="Password" v-model="register.password">
            <label for="floatingPassword">Hasło</label>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control rounded-top-0" id="floatingPassword2" placeholder="Password"
              v-model="register.password2">
            <label for="floatingPassword2">Powtórz hasło</label>
          </div>
          <div class="form-check text-start my-3">
            <input class="form-check-input" type="checkbox" value="rules-accept" id="rulesAccept">
            <label class="form-check-label" for="rulesAccept">Akceptuję <a href="#" target="_blank">regulamin
                strony</a>.</label>
          </div>
          <button class="btn btn-primary w-100 py-2 mt-2" type="submit">Zarejestruj się</button>
        </form>
        <p class="mt-3 text-center">Już posiadasz konto? <a href="#" @click="form = 'login'">Zaloguj się</a></p>
      </div>
    </div>
  </div>
</template>

<script>
import VApiInfo from '@/Components/VApiInfo.vue';
import { handleRequestResponse } from '@/functions/Utils';
import { useAuthStore } from '@/stores/auth';
import { useInfoStore } from '@/stores/info';

export default {
  name: "VAuth",
  props: {
    formType: {
      type: String,
      default: 'login', // Possible values: 'login', 'password-change', 'register'
      validator: value => ['login', 'password-change', 'register'].includes(value)
    }
  },
  data() {
    return {
      authStore: useAuthStore(),
      infoStore: useInfoStore(),

      form: this.formType,
      login: {
        info: null,
        fieldsInfo: null,
        username: '',
        password: '',
        rememberMe: false
      },
      register: {
        info: null,
        fieldsInfo: null,
        username: '',
        email: '',
        password: '',
        password2: '',
        rulesAccept: false
      },
      passwordChange: {
        info: null,
        fieldsInfo: null,
        email: '',
        password: '',
        password2: ''
      },
    }
  },
  components: {
    VApiInfo,
  },
  methods: {
    async submitLogin(event) {
      event.preventDefault();

      const response = await this.authStore.login(this.login.username, this.login.password, this.login.rememberMe);
      this.login.info = response.data?.info || response.internalError?.info || response.externalError?.info || null;
      this.login.fieldsInfo = response.externalError?.fields || null;
      handleRequestResponse(response, () => {
        this.$router.push({ name: 'Home' });
      });
    },
    async submitPasswordChange(event) {
      event.preventDefault();

      // verify passwords match
      if (this.passwordChange.password !== this.passwordChange.password2) {
        this.passwordChange.info = 'PASSWORDS_DO_NOT_MATCH';
        return;
      }

      const response = await this.authStore.changePassword(this.passwordChange.email, this.passwordChange.password, this.passwordChange.password2);
      this.passwordChange.info = response.data?.info || response.internalError?.info || response.externalError?.info || null;
      this.passwordChange.fieldsInfo = response.externalError?.fields || null;
      handleRequestResponse(response, () => {
        this.form = 'login';
      });
    },
    async submitRegister(event) {
      event.preventDefault();

      // verify passwords match
      if (this.register.password !== this.register.password2) {
        this.register.info = 'PASSWORDS_DO_NOT_MATCH';
        return;
      }

      const response = await this.authStore.register(this.register.username, this.register.email, this.register.password, this.register.password2);
      this.register.info = response.data?.info || response.internalError?.info || response.externalError?.info || null;
      this.register.fieldsInfo = response.externalError?.fields || null;
      handleRequestResponse(response, () => {
        this.form = 'login';
        this.login.username = this.register.username;
      });
    }
  },
  mounted() {
    this.$watch('formType', (newVal) => {
      if (['login', 'password-change', 'register'].includes(newVal)) {
        this.form = newVal;

        // this.login.username = '';
        this.login.password = '';

        this.passwordChange.email = '';
        this.passwordChange.password = '';
        this.passwordChange.password2 = '';

        // this.register.username = '';
        this.register.email = '';
        this.register.password = '';
        this.register.password2 = '';
      }
    });
  }
};
</script>