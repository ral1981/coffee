<template>
  <div class="results-counter">
    <span class="counter-text">
      Showing <strong>{{ showing }} of {{ total }}</strong> {{ itemText }}
      <span v-if="isFiltered" class="filtered-indicator">(filtered)</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  showing: { 
    type: Number, 
    default: 0 
  },
  total: { 
    type: Number, 
    default: 0 
  },
  itemName: { 
    type: String, 
    default: 'coffee' 
  },
  isFiltered: { 
    type: Boolean, 
    default: false 
  }
})

// Compute the correct plural/singular form
const itemText = computed(() => {
  const name = props.itemName.toLowerCase()
  
  // Handle special cases
  const specialPlurals = {
    'coffee': 'coffees',
    'shop': 'shops',
    'container': 'containers',
    'item': 'items'
  }
  
  if (props.total === 1) {
    // Singular form
    return specialPlurals[name] ? name : name
  } else {
    // Plural form
    return specialPlurals[name] || `${name}s`
  }
})
</script>

<style scoped>
.results-counter {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 1.5rem;
}

.counter-text { 
  font-size: 1rem; 
  color: #666; 
}

.counter-text strong {
  color: #111827;
  font-weight: 600;
}

.filtered-indicator { 
  color: #22c55e; 
  font-weight: 500; 
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .results-counter {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .counter-text {
    font-size: 0.875rem;
  }
}
</style>