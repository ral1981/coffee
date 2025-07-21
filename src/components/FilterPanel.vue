<template>
  <div class="mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-900 border-l-4 border-l-blue-500">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900">🔍 Filter Coffees</h3>
      
      <!-- Toggle Button -->
      <button 
        @click="togglePanel"
        class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        :title="isOpen ? 'Hide Filters' : 'Show Filters'"
      >
        <ChevronDown v-if="!isOpen" class="w-6 h-6"/>
        <ChevronUp v-else class="w-6 h-6"/>
      </button>
    </div>

    <!-- Filters -->
    <div v-show="isOpen" class="space-y-4">
      
      <!-- Clear Filters Button -->
      <div class="flex justify-end">
        <button 
          @click="clearFilters"
          class="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          🔄 Clear All Filters
        </button>
      </div>

      <!-- Container Filters -->
      <div class="bg-gray-50 rounded-md p-3 border-l-4 border-gray-300">
        <h4 class="uppercase text-sm font-semibold text-gray-700 mb-2">
          Container Status
        </h4>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="filters.green"
              class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
            <span class="flex items-center gap-1">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              Green Container
            </span>
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="filters.grey"
              class="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
            />
            <span class="flex items-center gap-1">
              <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
              Grey Container
            </span>
          </label>
        </div>
      </div>

      <!-- Origin Filter -->
      <div class="bg-blue-50 rounded-md p-3 border-l-4 border-blue-300">
        <h4 class="uppercase text-sm font-semibold text-blue-700 mb-2">
          Origin
        </h4>
        <select
          v-model="filters.origin"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Origins</option>
          <option v-for="origin in origins" :key="origin" :value="origin">
            {{ origin }}
          </option>
        </select>
      </div>

      <!-- Shop Filter -->
      <div class="bg-orange-50 rounded-md p-3 border-l-4 border-orange-400">
        <h4 class="uppercase text-sm font-semibold text-orange-700 mb-2">
          Coffee Shop
        </h4>
        <select
          v-model="filters.shop"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Shops</option>
          <option v-for="shop in shops" :key="shop" :value="shop">
            {{ shop }}
          </option>
        </select>
      </div>
    </div>

    <!-- Result Count -->
    <div class="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600 text-center">
      Showing <span class="font-semibold">{{ filteredCount }}</span> of <span class="font-semibold">{{ totalCount }}</span> coffees
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, reactive, watch, onMounted } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

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

const route = useRoute()
const router = useRouter()

onMounted(() => {
  filters.green = route.query.green === 'true'
  filters.grey = route.query.grey === 'true'
  filters.origin = route.query.origin || ''
  filters.shop = route.query.shop || ''

  emit('filter-change', { ...filters }) // ✅ trigger filtering on load
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

  const query = {}
  if (filters.green) query.green = 'true'
  if (filters.grey) query.grey = 'true'
  if (filters.origin) query.origin = filters.origin
  if (filters.shop) query.shop = filters.shop

  router.replace({
    path: route.path,
    query
  })
}, { deep: true })
</script>