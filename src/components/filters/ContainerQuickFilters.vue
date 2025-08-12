<template>
  <div v-if="containers.length > 0" class="container-filters">
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
  
  <!-- Debug info - remove this after fixing -->
  <div v-else class="debug-info" style="background: #fee; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
    <strong>Debug: No containers available</strong>
    <p>Containers received: {{ containers.length }}</p>
    <pre>{{ JSON.stringify(containers, null, 2) }}</pre>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { 
    type: Array, 
    default: () => [] 
  },
  containers: { 
    type: Array, 
    default: () => [],
    validator: (containers) => {
      // Allow empty array, but if not empty, check structure
      return containers.length === 0 || containers.every(c => 
        c && typeof c === 'object' && c.id && c.name
      )
    }
  }
})

defineEmits(['update:modelValue', 'container-click'])

const isActive = (container) => {
  return props.modelValue.some(c => c.id === container.id)
}

// Debug logging
console.log('ContainerQuickFilters - containers prop:', props.containers)
console.log('ContainerQuickFilters - modelValue prop:', props.modelValue)
</script>

<style scoped>
.container-filters {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 1rem;
}

.container-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #333;
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
  color: #6b7280;
}

.container-tag:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.container-tag.active {
  background: #22c55e20;
  border-color: #22c55e;
  color: #22c55e;
  font-weight: 500;
}

.container-tag.active:hover {
  background: #22c55e30;
}

.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.container-tag.active .container-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.debug-info {
  font-size: 0.875rem;
  color: #dc2626;
}

.debug-info pre {
  background: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 640px) {
  .container-tags {
    gap: 0.375rem;
  }
  
  .container-tag {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
}
</style>