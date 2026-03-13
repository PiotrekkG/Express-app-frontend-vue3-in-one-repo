<template>
  <div class="text-center">
    <!-- <h2>Witaj w grze Czołgi multiplayer - Online Tank Shooter!</h2>
    <p>Dołącz do emocjonujących bitew czołgów online i rywalizuj z graczami z całego świata!</p> -->
    <router-link to="/guest" class="btn btn-info">Graj jako gość (bez rejestracji)</router-link>
    lub
    <div class="btn-group">
      <router-link to="/guest" class="btn btn-primary">Zaloguj się</router-link>
      <router-link to="/guest" class="btn btn-secondary">Zarejestruj się</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {};
  },
  computed: {},
  methods: {},
  created() {},
  mounted() {},
}
</script>