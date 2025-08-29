<template>
  <div class="container-filters">
    <div class="filter-content">
      <div class="filter-group">
        <label class="filter-label">Containers</label>
        <div class="container-tags">
          <BaseFilterTag
            v-for="container in containers"
            :key="container.id"
            :label="container.name"
            :color-dot="container.color || '#6b7280'"
            :active="isContainerSelected(container)"
            :multi-selected="modelValue.length > 1 && isContainerSelected(container)"
            variant="container"
            @click="handleContainerToggle(container)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseFilterHeader from '../shared/BaseFilterHeader.vue'
import BaseFilterTag from '../shared/BaseFilterTag.vue'
import { Archive, X } from 'lucide-vue-next'

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

// Methods
const isContainerSelected = (container) => {
  return props.modelValue.some(c => c.id === container.id)
}

const handleContainerToggle = (container) => {
  console.log('📦 ContainerFilters - handleContainerToggle:', container.name)
  
  const isCurrentlySelected = isContainerSelected(container)
  let newSelection
  
  if (isCurrentlySelected) {
    // Remove from selection
    newSelection = props.modelValue.filter(c => c.id !== container.id)
    console.log('➖ Removed container:', container.name)
  } else {
    // Add to selection
    newSelection = [...props.modelValue, container]
    console.log('➕ Added container:', container.name)
  }
  
  emit('update:modelValue', newSelection)
}

const clearAllSelections = () => {
  console.log('🧹 ContainerFilters - clearAllSelections')
  emit('update:modelValue', [])
}
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

.container-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Empty state */
.container-tags:empty::after {
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
.container-tags.loading::after {
  content: "Loading containers...";
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

/* Enhanced selection states */
.container-filters :deep(.filter-tag.variant-container) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.container-filters :deep(.filter-tag.variant-container::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.container-filters :deep(.filter-tag.variant-container:hover::before) {
  left: 100%;
}

.container-filters :deep(.filter-tag.variant-container.active) {
  background: linear-gradient(135deg, #22c55e20, #16a34a15);
  border-color: #22c55e;
  color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  font-weight: 600;
}

.container-filters :deep(.filter-tag.variant-container.multi-selected) {
  background: linear-gradient(135deg, #22c55e30, #16a34a20);
  border-color: #16a34a;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

.container-filters :deep(.filter-tag.variant-container:hover:not(.active)) {
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* Container color dot enhancements */
.container-filters :deep(.color-dot) {
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.container-filters :deep(.filter-tag.active .color-dot) {
  box-shadow: 
    0 0 0 2px rgba(255, 255, 255, 0.9),
    0 0 8px currentColor,
    0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.2);
}

.container-filters :deep(.filter-tag.multi-selected .color-dot) {
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
.container-filters :deep(.selection-indicator) {
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
.container-filters :deep(.tag-count) {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
}

.container-filters :deep(.filter-tag.active .tag-count) {
  background: rgba(255, 255, 255, 0.95);
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
}

.container-filters :deep(.filter-tag:hover .tag-count) {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

/* Interactive hover effects */
.container-filters:hover :deep(.filter-tag:not(:hover):not(.active)) {
  opacity: 0.7;
  transform: scale(0.98);
}

.container-filters:hover :deep(.filter-tag:hover),
.container-filters:hover :deep(.filter-tag.active) {
  opacity: 1;
  z-index: 1;
}

/* Animation for tag appearance */
.container-filters :deep(.filter-tag) {
  animation: tagAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.container-filters :deep(.filter-tag:nth-child(1)) { animation-delay: 0s; }
.container-filters :deep(.filter-tag:nth-child(2)) { animation-delay: 0.05s; }
.container-filters :deep(.filter-tag:nth-child(3)) { animation-delay: 0.1s; }
.container-filters :deep(.filter-tag:nth-child(4)) { animation-delay: 0.15s; }
.container-filters :deep(.filter-tag:nth-child(5)) { animation-delay: 0.2s; }
.container-filters :deep(.filter-tag:nth-child(n+6)) { animation-delay: 0.25s; }

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
.container-filters :deep(.filter-tag:focus) {
  outline: 3px solid #22c55e;
  outline-offset: 2px;
  z-index: 2;
  position: relative;
}

.container-filters :deep(.filter-tag:focus-visible) {
  box-shadow: 
    0 0 0 3px rgba(34, 197, 94, 0.3),
    0 4px 12px rgba(34, 197, 94, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
  .filter-content {
    padding: 0.875rem;
  }
  
  .container-tags {
    gap: 0.4rem;
  }
  
  .container-filters :deep(.filter-tag) {
    padding: 0.4rem 0.7rem;
    font-size: 0.8125rem;
  }
  
  .container-filters :deep(.color-dot) {
    width: 7px;
    height: 7px;
  }
  
  .container-filters :deep(.tag-count) {
    font-size: 0.7rem;
    padding: 0.0625rem 0.3rem;
  }
}

@media (max-width: 640px) {
  .filter-content {
    padding: 0.75rem;
  }
  
  .container-tags {
    gap: 0.375rem;
  }
  
  .container-filters :deep(.filter-tag) {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .container-filters :deep(.color-dot) {
    width: 6px;
    height: 6px;
  }
  
  .container-filters :deep(.tag-count) {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.25rem;
  }
  
  .container-filters :deep(.selection-indicator) {
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
  
  .container-tags:empty::after,
  .container-tags.loading::after {
    color: #6b7280;
  }
  
  .container-filters :deep(.filter-tag.variant-container) {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .container-filters :deep(.filter-tag.variant-container.active) {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15));
    border-color: #22c55e;
    color: #34d399;
  }
  
  .container-filters :deep(.filter-tag.variant-container.multi-selected) {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2));
    border-color: #16a34a;
  }
  
  .container-filters :deep(.filter-tag.variant-container:hover:not(.active)) {
    background: linear-gradient(135deg, #4b5563, #374151);
    border-color: #6b7280;
  }
  
  .container-filters :deep(.tag-count) {
    background: rgba(31, 41, 55, 0.8);
    color: #d1d5db;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .container-filters :deep(.filter-tag.active .tag-count) {
    background: rgba(31, 41, 55, 0.9);
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.3);
  }
  
  .container-filters :deep(.selection-indicator) {
    background: rgba(31, 41, 55, 0.95);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .container-filters {
    border: 2px solid #000;
  }
  
  .container-filters :deep(.filter-tag) {
    border-width: 2px;
    font-weight: 600;
  }
  
  .container-filters :deep(.filter-tag.active) {
    border-width: 3px;
    font-weight: 700;
    background: #f0f9ff !important;
    color: #0c4a6e !important;
  }
  
  .container-filters :deep(.color-dot) {
    border: 2px solid #000;
    outline: 1px solid #fff;
  }
  
  .container-filters :deep(.tag-count) {
    border: 1px solid currentColor;
    font-weight: 700;
    background: #fff !important;
  }
  
  .container-filters :deep(.selection-indicator) {
    border: 2px solid #000;
    background: #fff !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .container-filters,
  .container-filters :deep(.filter-tag),
  .container-filters :deep(.color-dot),
  .container-filters :deep(.tag-count) {
    animation: none;
    transition: none;
  }
  
  .container-filters:hover,
  .container-filters :deep(.filter-tag:hover),
  .container-filters :deep(.filter-tag.active) {
    transform: none;
  }
  
  .container-filters :deep(.selection-indicator) {
    animation: none;
  }
  
  .container-tags.loading::after {
    animation: none;
  }
  
  .container-filters :deep(.filter-tag.variant-container::before) {
    display: none;
  }
  
  .container-filters :deep(.filter-tag.multi-selected .color-dot) {
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
  
  .container-filters :deep(.filter-tag.active) {
    background: #f0f0f0 !important;
    border: 2px solid #000 !important;
    color: #000 !important;
    box-shadow: none !important;
  }
  
  .container-filters :deep(.color-dot) {
    border: 1px solid #000;
    box-shadow: none !important;
  }
  
  .container-filters :deep(.tag-count) {
    background: white !important;
    color: #000 !important;
    border: 1px solid #000;
  }
  
  .container-filters :deep(.selection-indicator) {
    background: white !important;
    border: 1px solid #000;
  }
}

/* Large screen enhancements */
@media (min-width: 1200px) {
  .container-tags {
    gap: 0.625rem;
  }
  
  .container-filters :deep(.filter-tag) {
    padding: 0.625rem 1rem;
  }
  
  .container-filters :deep(.color-dot) {
    width: 10px;
    height: 10px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .container-filters :deep(.filter-tag) {
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
    min-height: 44px; /* WCAG touch target size */
  }
  
  .container-filters :deep(.color-dot) {
    width: 8px;
    height: 8px;
  }
  
  .container-filters :deep(.selection-indicator) {
    padding: 4px;
  }
  
  /* Remove hover effects on touch devices */
  .container-filters:hover :deep(.filter-tag:not(:hover):not(.active)) {
    opacity: 1;
    transform: none;
  }
}

/* Ultra-wide screen support */
@media (min-width: 1600px) {
  .filter-content {
    padding: 1.25rem;
  }
  
  .container-tags {
    gap: 0.75rem;
  }
  
  .container-filters :deep(.filter-tag) {
    padding: 0.75rem 1.25rem;
    font-size: 0.9375rem;
  }
}
</style>