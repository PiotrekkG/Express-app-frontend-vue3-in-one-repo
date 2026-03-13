<template>
  <template v-if="infoText">
    <span v-if="onlyText" class="alert alert-primary my-2" v-text="infoText"></span>
    <div v-else class="alert my-2" :class="`alert-${infoType}`" v-text="infoText"></div>
  </template>
</template>

<script>
import { apiInfoMessages } from '@/apiInfoMessages';

export default {
  name: "VApiInfo",
  props: {
    name: {
      required: false,
      type: String,
    },
    onlyText: {
      type: Boolean,
      required: false,
      default: false
    },
  },
  data() {
    return {
    }
  },
  computed: {
    infoText() {
      if (this.name && apiInfoMessages[this.name]) {
        return apiInfoMessages[this.name][0];
      }
      return null;
    },
    infoType() {
      if (this.name && apiInfoMessages[this.name]) {
        return apiInfoMessages[this.name][1];
      }
      return 'primary';
    },
  },
  methods: {
  },
  mounted() {
  }
};
</script>