<template>
  <div class="quick-filters">
    <!-- Container Filters -->
    <ContainerFilters
      :model-value="activeContainerIds"
      :containers="containers"
      :container-counts="containerCounts"
      @update:model-value="$emit('update:activeContainerIds', $event)"
    />

    <!-- Favorites Filter -->
    <FavoritesFilter
      :model-value="showFavorites"
      :favorite-count="favoriteCount"
      @update:model-value="$emit('update:showFavorites', $event)"
    />

    <!-- Filter Actions -->
    <FilterActions
      :filtered-count="filteredCount"
      :has-any-favorites="hasAnyFavorites"
      :has-any-filters="hasAnyFilters"
      @export-favorites="$emit('export-favorites')"
      @clear-filters="$emit('clear-filters')"
      @add-all-to-favorites="$emit('add-all-to-favorites')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ContainerFilters from './quick-filters/ContainerFilters.vue'
import FavoritesFilter from './quick-filters/FavoritesFilter.vue'
import FilterActions from './quick-filters/FilterActions.vue'

const props = defineProps({
  activeContainerIds: {
    type: Array,
    default: () => []
  },
  containers: {
    type: Array,
    default: () => []
  },
  containerCounts: {
    type: Object,
    default: () => ({})
  },
  filteredCount: {
    type: Number,
    default: 0
  },
  showFavorites: {
    type: Boolean,
    default: false
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  additionalFilters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:activeContainerIds',
  'update:showFavorites',
  'export-favorites',
  'clear-filters',
  'add-all-to-favorites'
])

// Computed properties
const hasAnyFavorites = computed(() => {
  return props.favoriteCount > 0
})

const hasAnyFilters = computed(() => {
  return activeContainerIds.value.length > 0 ||
         showFavorites.value ||
         props.additionalFilters.origin ||
         props.additionalFilters.shop
})
</script>

<style scoped>
.quick-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Enhanced spacing and visual hierarchy */
.quick-filters > * {
  transition: all 0.2s ease;
}

.quick-filters > *:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Mobile optimization */
@media (max-width: 768px) {
  .quick-filters {
    gap: 0.75rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .quick-filters > * {
    transition: none;
  }
  
  .quick-filters > *:hover {
    transform: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

/* Print styles */
@media print {
  .quick-filters {
    display: none;
  }
}
</style>