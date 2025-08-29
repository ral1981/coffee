<template>
  <div class="quick-filters">
    <!-- Container Filters -->
    <ContainerFilters
      v-model="localActiveContainers"
      :containers="containers"
      :container-counts="containerCounts"
    />

    <!-- Favorites Filter -->
    <FavoritesFilter
      v-model="localShowFavorites"
      :favorite-count="favoriteCount"
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
import { ref, watch, computed } from 'vue'
import ContainerFilters from './quick-filters/ContainerFilters.vue'
import FavoritesFilter from './quick-filters/FavoritesFilter.vue'
import FilterActions from './quick-filters/FilterActions.vue'

const props = defineProps({
  activeContainers: {
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
  'update:activeContainers',
  'update:showFavorites',
  'export-favorites',
  'clear-filters',
  'add-all-to-favorites'
])

// Local state management
const localActiveContainers = ref([...props.activeContainers])
const localShowFavorites = ref(props.showFavorites)

// Computed properties
const hasAnyFavorites = computed(() => {
  return props.favoriteCount > 0
})

const hasAnyFilters = computed(() => {
  return localActiveContainers.value.length > 0 ||
         localShowFavorites.value ||
         props.additionalFilters.origin ||
         props.additionalFilters.shop
})

// Watchers for prop synchronization
watch(() => props.activeContainers, (newValue) => {
  console.log('🔄 QuickFilters - activeContainers prop changed:', {
    previous: localActiveContainers.value.map(c => c.name),
    incoming: newValue.map(c => c.name),
    hasChanged: JSON.stringify(newValue) !== JSON.stringify(localActiveContainers.value)
  })
  
  // Only update if actually different to avoid infinite loops
  if (JSON.stringify(newValue) !== JSON.stringify(localActiveContainers.value)) {
    localActiveContainers.value = [...newValue]
    console.log('✅ Updated local activeContainers to match prop')
  }
}, { immediate: true, deep: true })

watch(() => props.showFavorites, (newValue) => {
  localShowFavorites.value = newValue
}, { immediate: true })

// Emit changes back to parent
watch(localActiveContainers, (newValue) => {
  console.log('📦 QuickFilters - localActiveContainers changed:', {
    current: newValue.map(c => c.name),
    count: newValue.length
  })
  emit('update:activeContainers', [...newValue])
}, { deep: true })

watch(localShowFavorites, (newValue) => {
  console.log('💖 QuickFilters - localShowFavorites changed:', newValue)
  emit('update:showFavorites', newValue)
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