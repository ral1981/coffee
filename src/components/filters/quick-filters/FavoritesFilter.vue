<template>
  <div class="favorites-filter">
    <div class="filter-content">
      <div class="filter-group">
        <div class="favorites-tags">
          <BaseFilterTag
            label="Show Favorites"
            :active="modelValue"
            variant="favorites"
            icon="Heart"
            @click="handleFavoritesToggle"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseFilterHeader from '../shared/BaseFilterHeader.vue'
import BaseFilterTag from '../shared/BaseFilterTag.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  favoriteCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

const handleFavoritesToggle = () => {
  console.log('💖 FavoritesFilter - handleFavoritesToggle:', !props.modelValue)
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.favorites-filter {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-content {
  padding: 1rem;
}

.filter-group { 
  display: flex; 
  flex-direction: column; 
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
}

.favorites-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Enhanced styling for favorites */
.favorites-filter :deep(.filter-tag.variant-favorites) {
  min-width: 120px;
  justify-content: center;
}

.favorites-filter :deep(.filter-tag.variant-favorites .icon.filled) {
  fill: currentColor;
  animation: heartbeat 0.3s ease-in-out;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .favorites-filter {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .favorites-filter :deep(.filter-tag.variant-favorites .icon.filled) {
    animation: none;
  }
}
</style>