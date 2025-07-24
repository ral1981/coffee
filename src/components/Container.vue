<template>
  <button
    @click="handleClick"
    :disabled="!isLoggedIn"
    :class="[ 
      'container-card', 
      containerColorClass,
      { assigned, clickable: isLoggedIn, disabled: !isLoggedIn }
    ]"
  >
    <div class="icon-label-wrapper">
      <div class="icon-square" :class="containerColorClass">
        <img src="../assets/icons/bean_01.svg" alt="bean icon" class="icon" />
      </div>
      <span class="container-label">{{ containerColorLabel }}</span>
    </div>
  </button>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      required: true
    },
    assigned: Boolean,
    activeCoffee: Object,
    coffee: Object,
    isLoggedIn: Boolean
  },
  computed: {
    containerColorClass() {
      return this.color === 'green' ? 'green' : 'grey';
    },
    containerColorLabel() {
      return this.color === 'green' ? 'GREEN' : 'GREY';
    }
  },
  methods: {
    handleClick() {
      if (!this.isLoggedIn) return;

      const otherCoffee = this.activeCoffee;
      const isAssigned = this.assigned;

      if (!isAssigned) {
        if (otherCoffee) {
          const msg = `Container "${this.color}" is already used by "${otherCoffee.name}". Replace it?`;
          if (!confirm(msg)) return;
        } else {
          const msg = `Add "${this.coffee.name}" to "${this.color}" container?`;
          if (!confirm(msg)) return;
        }

        this.$emit('update-container', {
          coffee: this.coffee,
          container: this.color,
          assign: true
        });
      } else {
        const msg = `Remove "${this.coffee.name}" from "${this.color}" container?`;
        if (!confirm(msg)) return;

        this.$emit('update-container', {
          coffee: this.coffee,
          container: this.color,
          assign: false
        });
      }
    }
  }
};
</script>

<style scoped>
.container-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  opacity: 1;
  border: none;
}

.container-card.clickable {
  cursor: pointer;
}

/* Only show blue outline when this specific container is assigned */
.container-card.assigned {
  box-shadow: 0 0 0 3px #2196f3;
  transform: scale(1.02);
}

.container-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.icon-label-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}

.icon {
  width: 24px;
  height: 24px;
}

.container-label {
  font-size: 14px;
  font-weight: bold;
}

/* Green container styling */
.green .icon-square {
  background-color: #a8d5a2;
}

.green .container-label {
  color: #2b7a2b;
}

/* Grey container styling */
.grey .icon-square {
  background-color: #ccc;
}

.grey .container-label {
  color: #666;
}
</style>