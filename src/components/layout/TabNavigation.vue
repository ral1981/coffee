<template>
  <nav class="nav-tabs" role="tablist" aria-label="Main navigation">
    <div class="tab-list">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ 
          active: modelValue === tab.id,
          disabled: tab.disabled 
        }"
        :aria-selected="modelValue === tab.id"
        :aria-controls="`${tab.id}-panel`"
        :disabled="tab.disabled"
        role="tab"
        @click="handleTabClick(tab)"
      >
        <!-- Icon (optional) -->
        <component 
          v-if="tab.icon" 
          :is="tab.icon"
          class="tab-icon"
          :size="iconSize"
        />
        
        <!-- SVG Icon fallback for string icons -->
        <svg 
          v-else-if="tab.iconSvg" 
          class="tab-icon"
          :width="iconSize" 
          :height="iconSize" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path :d="tab.iconSvg"/>
        </svg>

        <!-- Tab Label -->
        <span class="tab-label">{{ tab.label }}</span>

        <!-- Badge/Counter (optional) -->
        <span 
          v-if="tab.badge && tab.badge > 0" 
          class="tab-badge"
          :aria-label="`${tab.badge} items`"
        >
          {{ formatBadgeCount(tab.badge) }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every(tab => 
        tab.id && 
        tab.label && 
        typeof tab.id === 'string' && 
        typeof tab.label === 'string'
      )
    }
  },
  iconSize: {
    type: [String, Number],
    default: 20
  },
  variant: {
    type: String,
    default: 'default', // 'default' | 'pills' | 'underline'
    validator: (value) => ['default', 'pills', 'underline'].includes(value)
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'tab-change'])

// Event handlers
const handleTabClick = (tab) => {
  if (tab.disabled) return
  
  emit('update:modelValue', tab.id)
  emit('tab-change', tab.id, tab)
}

// Helper function to format badge counts
const formatBadgeCount = (count) => {
  if (count > 99) return '99+'
  return count.toString()
}

// Computed classes for dynamic styling
const tabClasses = computed(() => ({
  [`nav-tabs--${props.variant}`]: props.variant !== 'default'
}))
</script>

<style scoped>
/* Base Navigation Styles */
.nav-tabs {
  background: var(--nav-background, #ffffff);
  border-bottom: 1px solid var(--border-light, #e5e5e5);
  position: sticky;
  top: var(--header-height, 60px);
  z-index: var(--nav-z-index, 90);
  margin-bottom: var(--nav-margin-bottom, 1rem);
}

.tab-list {
  display: flex;
  max-width: var(--max-content-width, 1200px);
  margin: 0 auto;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.tab-list::-webkit-scrollbar {
  display: none; /* Webkit browsers */
}

/* Tab Item Styles */
.tab-item {
  flex: 1;
  min-width: max-content;
  padding: var(--tab-padding, 1rem);
  text-align: center;
  border: none;
  background: none;
  font-size: var(--tab-font-size, 1rem);
  font-weight: var(--tab-font-weight, 500);
  color: var(--tab-color, #666);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tab-gap, 0.25rem);
  white-space: nowrap;
  user-select: none;
}

/* Active Tab State */
.tab-item.active {
  color: var(--tab-active-color, #333);
  font-weight: var(--tab-active-font-weight, 600);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: var(--tab-active-border-height, 3px);
  background: var(--primary-green, #22c55e);
  border-radius: var(--tab-active-border-radius, 2px 2px 0 0);
}

/* Hover States */
.tab-item:hover:not(.active):not(.disabled) {
  color: var(--tab-hover-color, #333);
  background: var(--tab-hover-background, rgba(0, 0, 0, 0.04));
}

/* Disabled State */
.tab-item.disabled {
  color: var(--tab-disabled-color, #ccc);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Focus State */
.tab-item:focus-visible {
  outline: 2px solid var(--focus-color, #22c55e);
  outline-offset: -2px;
  z-index: 1;
}

/* Tab Icon */
.tab-icon {
  color: inherit;
  flex-shrink: 0;
}

/* Tab Label */
.tab-label {
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

/* Tab Badge */
.tab-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: var(--badge-background, #ef4444);
  color: var(--badge-color, #ffffff);
  font-size: var(--badge-font-size, 0.75rem);
  font-weight: var(--badge-font-weight, 600);
  line-height: 1;
  padding: var(--badge-padding, 0.25rem 0.5rem);
  border-radius: var(--badge-border-radius, 12px);
  min-width: var(--badge-min-width, 1.25rem);
  height: var(--badge-height, 1.25rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Variant: Pills */
.nav-tabs--pills .tab-list {
  padding: var(--pills-padding, 0.5rem);
  gap: var(--pills-gap, 0.5rem);
  background: var(--pills-background, #f8f9fa);
  border-bottom: none;
}

.nav-tabs--pills .tab-item {
  border-radius: var(--pills-border-radius, 8px);
  padding: var(--pills-item-padding, 0.5rem 1rem);
  flex: none;
  min-width: auto;
}

.nav-tabs--pills .tab-item.active {
  background: var(--primary-green, #22c55e);
  color: white;
}

.nav-tabs--pills .tab-item.active::after {
  display: none;
}

/* Variant: Underline */
.nav-tabs--underline .tab-item {
  border-bottom: 2px solid transparent;
  padding-bottom: calc(var(--tab-padding, 1rem) - 2px);
}

.nav-tabs--underline .tab-item.active {
  border-bottom-color: var(--primary-green, #22c55e);
}

.nav-tabs--underline .tab-item.active::after {
  display: none;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .tab-item {
    padding: var(--tab-padding-mobile, 0.75rem 0.5rem);
    font-size: var(--tab-font-size-mobile, 0.875rem);
    gap: var(--tab-gap-mobile, 0.125rem);
  }
  
  .tab-label {
    font-size: 0.75rem;
  }
  
  .tab-badge {
    top: 0.125rem;
    right: 0.125rem;
    font-size: 0.625rem;
    min-width: 1rem;
    height: 1rem;
  }
  
  /* Stack icon and text on very small screens */
  .tab-item {
    flex-direction: column;
  }
}

/* Medium screens - horizontal layout with icons */
@media (min-width: 641px) and (max-width: 1024px) {
  .tab-item {
    flex-direction: row;
    gap: var(--tab-gap-medium, 0.5rem);
  }
}

/* Large screens */
@media (min-width: 1024px) {
  .nav-tabs {
    margin-bottom: var(--nav-margin-bottom-desktop, 1.5rem);
  }
  
  .tab-list {
    padding: 0 2rem;
  }
  
  .tab-item {
    flex-direction: row;
    gap: var(--tab-gap-large, 0.75rem);
    padding: var(--tab-padding-large, 1.25rem 1.5rem);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .nav-tabs {
    background: var(--nav-background-dark, #1f2937);
    border-bottom-color: var(--border-dark, #374151);
  }
  
  .tab-item {
    color: var(--tab-color-dark, #9ca3af);
  }
  
  .tab-item.active {
    color: var(--tab-active-color-dark, #f9fafb);
  }
  
  .tab-item:hover:not(.active):not(.disabled) {
    color: var(--tab-hover-color-dark, #f3f4f6);
    background: var(--tab-hover-background-dark, rgba(255, 255, 255, 0.1));
  }
  
  .nav-tabs--pills .tab-list {
    background: var(--pills-background-dark, #374151);
  }
  
  .nav-tabs--pills .tab-item {
    color: var(--pills-item-color-dark, #d1d5db);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .tab-item {
    border: 1px solid transparent;
  }
  
  .tab-item.active {
    border-color: currentColor;
  }
  
  .tab-item:focus-visible {
    outline-width: 3px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .tab-item {
    transition: none;
  }
}
</style>