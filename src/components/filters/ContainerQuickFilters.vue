<template>
  <div class="container-filters">
    <div class="container-header">
      <strong>Quick Filters</strong>
    </div>
    <div class="container-tags">
      <button
        v-for="container in containers"
        :key="container.id"
        class="container-tag"
        :class="{ active: isActive(container) }"
        @click="$emit('container-click', container)"
      >
        <div 
          class="container-dot" 
          :style="{ background: container.color }"
        ></div>
        {{ container.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  containers: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue', 'container-click'])

const isActive = (container) => {
  return props.modelValue.some(c => c.id === container.id)
}
</script>

<style scoped>
.container-filters {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.container-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}
.container-tags {
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.container-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.container-tag.active {
  background: #22c55e20;
  border-color: #22c55e;
  color: #22c55e;
}
.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}
</style>