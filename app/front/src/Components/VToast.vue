<template>
  <div ref="tooltip" :id="id" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="toast-header">
      <div class="d-flex justify-content-between w-100">
        <div class="d-inline">
          <i class="bi bi-info-circle me-2"></i>
          <strong class="me-auto">{{ title || 'Informacja' }}</strong>
        </div>
        <div class="d-inline">
          <small class="text-body-secondary">{{ presentTime }}</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>
    <div class="toast-body">
      {{ infoText }}
    </div>
  </div>

</template>

<script>
import { formatDate } from '@/functions/functions';
import { Toast } from 'bootstrap';


export default {
  name: "VToast",
  props: {
    title: {
      type: String,
      required: false,
      default: '',
    },
    infoText: {
      type: String,
      required: false,
      default: '',
    },
    infoType: {
      type: String,
      required: false,
      default: 'primary',
    },
    duration: {
      type: Number,
      required: false,
      default: 5000,
    },
  },
  data() {
    return {
      timeShowed: new Date(),
      tooltip: null,
      id: 'id-' + Math.random().toString(36).substr(2, 9),
    }
  },
  emits: ['remove'],
  computed: {
    presentTime() {
      return formatDate(this.timeShowed, true, false);
    },

  },
  methods: {
    closeToast() {
      this.$emit('remove');
    },
  },
  mounted() {
    this.tooltip = new Toast(this.$refs.tooltip, {
      delay: this.duration,
      autohide: true,
      animation: false,
    });
    this.$refs.tooltip.addEventListener('hidden.bs.toast', () => {
      this.closeToast();
    });
    this.tooltip.show();
  }
};
</script>