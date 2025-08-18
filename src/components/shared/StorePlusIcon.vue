<template>
  <div class="store-plus-icon">
    <Store :size="iconSize" class="store-icon" />
    <Plus :size="plusSize" class="plus-icon" />
  </div>
</template>

<script setup>
import { Store, Plus } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: Number,
    default: 24
  }
})

const iconSize = computed(() => props.size)
const plusSize = computed(() => Math.round(props.size * 0.5))
</script>

<style scoped>
.store-plus-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.store-icon {
  position: relative;
  z-index: 1;
}

.plus-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.9);
  color: #22c55e;
  border-radius: 50%;
  padding: 1px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>