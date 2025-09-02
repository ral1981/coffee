<template>
  <div class="container-filters">
    <div class="filter-content">
      <!-- Using Reusable Component -->
      <ContainerAssignmentGrid
        :available-containers="containers"
        :selected-containers="modelValue"
        :container-counts="containerCounts"
        :disabled="false"
        variant="filter"
        title="Containers"
        :show-title="true"
        :show-counts="true"
        @update:selectedContainers="handleSelectionUpdate"
        @container-changed="handleContainerChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ContainerAssignmentGrid from '../../shared/ContainerAssignmentGrid.vue'

const props = defineProps({
  modelValue: {
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
  }
})

const emit = defineEmits(['update:modelValue'])

// Handle selection updates from the grid
const handleSelectionUpdate = (updatedSelection) => {
  emit('update:modelValue', updatedSelection)
}

// Handle individual container changes (for logging or additional logic)
const handleContainerChange = (data) => {
  const { action, container } = data
  console.log(`Container filter ${action}:`, container.name)
}

// Clear all selections method (can be exposed via ref if needed)
const clearAllSelections = () => {
  emit('update:modelValue', [])
}

// Expose methods for parent components if needed
defineExpose({
  clearAllSelections
})
</script>
<style scoped>
.container-filters {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-content {
  padding: 1rem;
}

/* Override ContainerAssignmentGrid styles for filter variant to match existing design */
.filter-content :deep(.container-assignment-grid.variant-filter .container-title) {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: none;
  letter-spacing: normal;
}

.filter-content :deep(.container-assignment-grid.variant-filter .container-grid) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Apply existing sophisticated filter tag styling to the new component */
.filter-content :deep(.container-filter-tag) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
}

.filter-content :deep(.container-filter-tag::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.filter-content :deep(.container-filter-tag:hover::before) {
  left: 100%;
}

.filter-content :deep(.container-filter-tag.active) {
  background: linear-gradient(135deg, #22c55e20, #16a34a15);
  border-color: #22c55e;
  color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  font-weight: 600;
}

.filter-content :deep(.container-filter-tag.multi-selected) {
  background: linear-gradient(135deg, #22c55e30, #16a34a20);
  border-color: #16a34a;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

.filter-content :deep(.container-filter-tag:hover:not(.active)) {
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* Container color dot enhancements */
.filter-content :deep(.container-dot) {
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.filter-content :deep(.container-filter-tag.active .container-dot) {
  box-shadow: 
    0 0 0 2px rgba(255, 255, 255, 0.9),
    0 0 8px currentColor,
    0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.2);
}

.filter-content :deep(.container-filter-tag.multi-selected .container-dot) {
  animation: colorPulse 1.5s ease-in-out infinite;
}

@keyframes colorPulse {
  0%, 100% {
    transform: scale(1.2);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.8;
  }
}

/* Selection indicator enhancement */
.filter-content :deep(.selection-indicator) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  padding: 2px;
  animation: checkmarkAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
}

@keyframes checkmarkAppear {
  from {
    opacity: 0;
    transform: scale(0) rotate(180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Count styling */
.filter-content :deep(.container-count) {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
}

.filter-content :deep(.container-filter-tag.active .container-count) {
  background: rgba(255, 255, 255, 0.95);
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
}

.filter-content :deep(.container-filter-tag:hover .container-count) {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

/* Interactive hover effects */
.container-filters:hover :deep(.container-filter-tag:not(:hover):not(.active)) {
  opacity: 0.7;
  transform: scale(0.98);
}

.container-filters:hover :deep(.container-filter-tag:hover),
.container-filters:hover :deep(.container-filter-tag.active) {
  opacity: 1;
  z-index: 1;
}

/* Animation for tag appearance */
.filter-content :deep(.container-filter-tag) {
  animation: tagAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.filter-content :deep(.container-filter-tag:nth-child(1)) { animation-delay: 0s; }
.filter-content :deep(.container-filter-tag:nth-child(2)) { animation-delay: 0.05s; }
.filter-content :deep(.container-filter-tag:nth-child(3)) { animation-delay: 0.1s; }
.filter-content :deep(.container-filter-tag:nth-child(4)) { animation-delay: 0.15s; }
.filter-content :deep(.container-filter-tag:nth-child(5)) { animation-delay: 0.2s; }
.filter-content :deep(.container-filter-tag:nth-child(n+6)) { animation-delay: 0.25s; }

@keyframes tagAppear {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Focus management for accessibility */
.filter-content :deep(.container-filter-tag:focus) {
  outline: 3px solid #22c55e;
  outline-offset: 2px;
  z-index: 2;
  position: relative;
}

.filter-content :deep(.container-filter-tag:focus-visible) {
  box-shadow: 
    0 0 0 3px rgba(34, 197, 94, 0.3),
    0 4px 12px rgba(34, 197, 94, 0.2);
}

/* Empty state */
.filter-content :deep(.container-grid:empty::after) {
  content: "No containers available";
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
  width: 100%;
  display: block;
}

/* Loading state */
.filter-content :deep(.container-loading) {
  color: #6b7280;
  font-style: italic;
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
  width: 100%;
  display: block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive design */
@media (max-width: 768px) {
  .filter-content {
    padding: 0.875rem;
  }
  
  .filter-content :deep(.container-grid) {
    gap: 0.4rem;
  }
  
  .filter-content :deep(.container-filter-tag) {
    padding: 0.4rem 0.7rem;
    font-size: 0.8125rem;
  }
  
  .filter-content :deep(.container-dot) {
    width: 7px;
    height: 7px;
  }
  
  .filter-content :deep(.container-count) {
    font-size: 0.7rem;
    padding: 0.0625rem 0.3rem;
  }
}

@media (max-width: 640px) {
  .filter-content {
    padding: 0.75rem;
  }
  
  .filter-content :deep(.container-grid) {
    gap: 0.375rem;
  }
  
  .filter-content :deep(.container-filter-tag) {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .filter-content :deep(.container-dot) {
    width: 6px;
    height: 6px;
  }
  
  .filter-content :deep(.container-count) {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.25rem;
  }
  
  .filter-content :deep(.selection-indicator) {
    padding: 1px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .container-filters {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
  
  .container-filters:hover {
    background: rgba(31, 41, 55, 0.98);
    border-color: #4b5563;
  }
  
  .filter-content :deep(.container-loading) {
    color: #6b7280;
  }
  
  .filter-content :deep(.container-filter-tag) {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .filter-content :deep(.container-filter-tag.active) {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15));
    border-color: #22c55e;
    color: #34d399;
  }
  
  .filter-content :deep(.container-filter-tag.multi-selected) {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2));
    border-color: #16a34a;
  }
  
  .filter-content :deep(.container-filter-tag:hover:not(.active)) {
    background: linear-gradient(135deg, #4b5563, #374151);
    border-color: #6b7280;
  }
  
  .filter-content :deep(.container-count) {
    background: rgba(31, 41, 55, 0.8);
    color: #d1d5db;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .filter-content :deep(.container-filter-tag.active .container-count) {
    background: rgba(31, 41, 55, 0.9);
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.3);
  }
  
  .filter-content :deep(.selection-indicator) {
    background: rgba(31, 41, 55, 0.95);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .container-filters {
    border: 2px solid #000;
  }
  
  .filter-content :deep(.container-filter-tag) {
    border-width: 2px;
    font-weight: 600;
  }
  
  .filter-content :deep(.container-filter-tag.active) {
    border-width: 3px;
    font-weight: 700;
    background: #f0f9ff !important;
    color: #0c4a6e !important;
  }
  
  .filter-content :deep(.container-dot) {
    border: 2px solid #000;
    outline: 1px solid #fff;
  }
  
  .filter-content :deep(.container-count) {
    border: 1px solid currentColor;
    font-weight: 700;
    background: #fff !important;
  }
  
  .filter-content :deep(.selection-indicator) {
    border: 2px solid #000;
    background: #fff !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .container-filters,
  .filter-content :deep(.container-filter-tag),
  .filter-content :deep(.container-dot),
  .filter-content :deep(.container-count) {
    animation: none;
    transition: none;
  }
  
  .container-filters:hover,
  .filter-content :deep(.container-filter-tag:hover),
  .filter-content :deep(.container-filter-tag.active) {
    transform: none;
  }
  
  .filter-content :deep(.selection-indicator) {
    animation: none;
  }
  
  .filter-content :deep(.container-loading) {
    animation: none;
  }
  
  .filter-content :deep(.container-filter-tag::before) {
    display: none;
  }
  
  .filter-content :deep(.container-filter-tag.multi-selected .container-dot) {
    animation: none;
  }
}

/* Print styles */
@media print {
  .container-filters {
    box-shadow: none;
    border: 1px solid #000;
    background: white !important;
  }
  
  .filter-content :deep(.container-filter-tag.active) {
    background: #f0f0f0 !important;
    border: 2px solid #000 !important;
    color: #000 !important;
    box-shadow: none !important;
  }
  
  .filter-content :deep(.container-dot) {
    border: 1px solid #000;
    box-shadow: none !important;
  }
  
  .filter-content :deep(.container-count) {
    background: white !important;
    color: #000 !important;
    border: 1px solid #000;
  }
  
  .filter-content :deep(.selection-indicator) {
    background: white !important;
    border: 1px solid #000;
  }
}

/* Large screen enhancements */
@media (min-width: 1200px) {
  .filter-content :deep(.container-grid) {
    gap: 0.625rem;
  }
  
  .filter-content :deep(.container-filter-tag) {
    padding: 0.625rem 1rem;
  }
  
  .filter-content :deep(.container-dot) {
    width: 10px;
    height: 10px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .filter-content :deep(.container-filter-tag) {
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
    min-height: 44px; /* WCAG touch target size */
  }
  
  .filter-content :deep(.container-dot) {
    width: 8px;
    height: 8px;
  }
  
  .filter-content :deep(.selection-indicator) {
    padding: 4px;
  }
  
  /* Remove hover effects on touch devices */
  .container-filters:hover :deep(.container-filter-tag:not(:hover):not(.active)) {
    opacity: 1;
    transform: none;
  }
}

/* Ultra-wide screen support */
@media (min-width: 1600px) {
  .filter-content {
    padding: 1.25rem;
  }
  
  .filter-content :deep(.container-grid) {
    gap: 0.75rem;
  }
  
  .filter-content :deep(.container-filter-tag) {
    padding: 0.75rem 1.25rem;
    font-size: 0.9375rem;
  }
}
</style>