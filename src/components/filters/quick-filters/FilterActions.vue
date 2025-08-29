<template>
  <div v-if="hasAnyFilters" class="filter-actions">
    <div class="filter-content">
      <div class="actions-row">
        <BaseActionButton
          icon="Download"
          label="Export"
          variant="primary"
          size="small"
          :disabled="!hasAnyFavorites"
          :loading="exportLoading"
          @click="handleExportFavorites"
        />
        
        <BaseActionButton
          icon="Trash2"
          label="Clear All"
          variant="danger"
          size="small"
          :disabled="!hasAnyFilters"
          @click="handleClearFilters"
        />
        
        <BaseActionButton
          icon="Heart"
          label="Add All"
          variant="success"
          size="small"
          :disabled="filteredCount === 0"
          :loading="addAllLoading"
          @click="handleAddAllToFavorites"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseFilterHeader from '../shared/BaseFilterHeader.vue'
import BaseActionButton from '../shared/BaseActionButton.vue'

const props = defineProps({
  filteredCount: {
    type: Number,
    default: 0
  },
  hasAnyFavorites: {
    type: Boolean,
    default: false
  },
  hasAnyFilters: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'export-favorites',
  'clear-filters', 
  'add-all-to-favorites'
])

// Loading states for async operations
const exportLoading = ref(false)
const addAllLoading = ref(false)

const handleExportFavorites = async () => {
  console.log('📤 FilterActions - handleExportFavorites')
  exportLoading.value = true
  
  try {
    emit('export-favorites')
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    exportLoading.value = false
  }
}

const handleClearFilters = () => {
  console.log('🧹 FilterActions - handleClearFilters')
  emit('clear-filters')
}

const handleAddAllToFavorites = async () => {
  console.log('❤️ FilterActions - handleAddAllToFavorites')
  addAllLoading.value = true
  
  try {
    emit('add-all-to-favorites')
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 800))
  } finally {
    addAllLoading.value = false
  }
}
</script>

<style scoped>
.filter-actions {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-content {
  padding: 1rem;
}

.actions-row {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

/* Action button enhancements for single row layout */
.filter-actions :deep(.action-btn) {
  flex: 1;
  min-width: 0;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.filter-actions :deep(.btn-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-actions :deep(.action-btn.variant-primary) {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.filter-actions :deep(.action-btn.variant-primary:hover:not(.disabled)) {
  background: linear-gradient(135deg, #16a34a, #15803d);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
}

.filter-actions :deep(.action-btn.variant-danger:hover:not(.disabled)) {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  transform: translateY(-1px);
}

.filter-actions :deep(.action-btn.variant-success:hover:not(.disabled)) {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  transform: translateY(-1px);
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .actions-row {
    gap: 0.375rem;
  }
  
  .filter-actions :deep(.action-btn) {
    padding: 0.25rem 0.375rem;
    font-size: 0.6875rem;
  }
  
  .filter-content {
    padding: 0.75rem;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .filter-actions {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .filter-actions :deep(.action-btn) {
    border-width: 2px;
    font-weight: 600;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .filter-actions :deep(.action-btn:hover) {
    transform: none;
  }
}
</style>