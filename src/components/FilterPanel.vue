<template>
  <div class="mb-4 p-4 border rounded bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
    <h3 class="text-lg font-semibold mb-2">🔍 Filter Coffees</h3>

    <!-- Toggle Button -->
    <button @click="togglePanel" style="margin-bottom: 0.5rem;">
      {{ isOpen ? '⬆️ Hide Filters' : '⬇️ Show Filters' }}
    </button>

    <!-- Filters -->
    <div v-if="isOpen">

      <div style="margin-top: 0.5rem;">
        <button @click="clearFilters">🔄 Clear All Filters</button>
      </div>

      <!-- Container Filters -->
      <div class="flex gap-4 mb-2">
        <label class="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
          <input type="checkbox" v-model="filters.green" />
          Green Container
        </label>
        <label class="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
          <input type="checkbox" v-model="filters.grey" />
          Grey Container
        </label>
      </div>

      <!-- Origin Filter -->
      <div class="mb-2">
        <select
          v-model="filters.origin"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Origins</option>
          <option v-for="origin in origins" :key="origin" :value="origin">
            {{ origin }}
          </option>
        </select>
      </div>

      <!-- Shop Filter -->
      <div>
        <select
          v-model="filters.shop"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Shops</option>
          <option v-for="shop in shops" :key="shop" :value="shop">
            {{ shop }}
          </option>
        </select>
      </div>
    </div>
  </div>
  <!-- Result Count -->
  <div class="mt-2 text-sm text-gray-600">
    Showing {{ filteredCount }} of {{ totalCount }} coffees
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const isOpen = ref(false)

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const props = defineProps({
  origins: Array,
  shops: Array,
  filteredCount: Number,
  totalCount: Number
})

const emit = defineEmits(['filter-change'])

const filters = reactive({
  green: false,
  grey: false,
  origin: '',
  shop: ''
})

const clearFilters = () => {
  filters.green = false
  filters.grey = false
  filters.origin = ''
  filters.shop = ''
  emit('filter-change', { ...filters })
}

// Watch for changes and emit the updated filters
watch(filters, () => {
  emit('filter-change', { ...filters })
}, { deep: true })
</script>