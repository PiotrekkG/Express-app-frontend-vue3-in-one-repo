<template>
  <Teleport to="body">
    <div class="modal fade" :id="id" tabindex="-1" :aria-labelledby="id + 'Label'" aria-hidden="true"
      ref="modalElement">
      <div class="modal-dialog" :class="modalSize">
        <div class="modal-content">
          <div class="modal-header" v-if="showHeader">
            <h5 class="modal-title" :id="id + 'Label'">
              <slot name="title">{{ title }}</slot>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <slot name="body"></slot>
          </div>
          <div class="modal-footer" v-if="showFooter">
            <slot name="footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { Modal } from 'bootstrap';

export default {
  name: "VModal",
  props: {
    title: {
      type: String,
      required: false,
      default: 'Modal'
    },
    size: {
      type: String,
      required: false,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
    },
    showState: {
      type: Boolean,
      required: false,
      default: false
    },
    showHeader: {
      type: Boolean,
      required: false,
      default: true
    },
    showFooter: {
      type: Boolean,
      required: false,
      default: true
    },
    backdrop: {
      type: [Boolean, String],
      required: false,
      default: true,
      validator: (value) => [true, false, 'static'].includes(value)
    },
    keyboard: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      modal: null,
      id: 'id-' + Math.random().toString(36).substr(2, 9),
    }
  },
  emits: ['show', 'shown', 'hide', 'closed'],
  computed: {
    modalSize() {
      if (this.size === 'sm') return 'modal-sm';
      if (this.size === 'lg') return 'modal-lg';
      if (this.size === 'xl') return 'modal-xl';
      return '';
    }
  },
  methods: {
    show() {
      if (this.modal) {
        this.modal.show();
      }
    },
    hide() {
      if (this.modal) {
        this.modal.hide();
      }
    },
    toggle() {
      if (this.modal) {
        this.modal.toggle();
      }
    }
  },
  watch: {
    showState(newVal) {
      if (newVal) {
        this.show();
      } else {
        this.hide();
      }
    }
  },
  mounted() {
    this.modal = new Modal(this.$refs.modalElement, {
      backdrop: this.backdrop,
      keyboard: this.keyboard
    });

    // if (this.showState) {
    //   this.show();
    // }
    this.$watch('showState', (newVal) => {
      if (newVal) {
        this.show();
      } else {
        this.hide();
      }
    }, { immediate: true });

    // Dodaj event listenery dla eventów Bootstrap Modal
    this.$refs.modalElement.addEventListener('show.bs.modal', () => {
      this.$emit('show');
    });

    this.$refs.modalElement.addEventListener('shown.bs.modal', () => {
      this.$emit('shown');
    });

    this.$refs.modalElement.addEventListener('hide.bs.modal', () => {
      this.$emit('hide');
    });

    this.$refs.modalElement.addEventListener('hidden.bs.modal', () => {
      this.$emit('closed');
    });
  },
  beforeUnmount() {
    // Cleanup event listeners i modal instance
    if (this.modal) {
      this.modal.dispose();
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }
};
</script>

<style scoped>
/* Dodatkowe style jeśli potrzebne */
</style>