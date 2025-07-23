<template>
  <div class="mb-6 flex justify-center">
    <div
      :class="[
        'bg-white border shadow-sm cursor-pointer relative transform-gpu origin-center',
        // Conditional overflow control - allow overflow during collapse animation
        isOpen ? '' : 'overflow-hidden',
        // Enhanced styling for active filters
        !isOpen && hasActiveFilters ? [
          'border-blue-500 shadow-lg',
          'ring-2 ring-blue-200 ring-opacity-50'
        ] : 'border-gray-200 shadow-sm'
      ]"
      :style="{
        width: isOpen ? '100%' : '64px',
        maxWidth: isOpen ? '56rem' : '64px',
        height: isOpen ? 'auto' : '64px',
        padding: isOpen ? '16px' : '0',
        borderRadius: isOpen ? '12px' : '16px',
        transition: `width 0.7s ease-in-out ${isOpen ? '0ms' : '400ms'}, 
                     max-width 0.7s ease-in-out ${isOpen ? '0ms' : '400ms'}, 
                     height 0.7s ease-in-out ${isOpen ? '0ms' : '800ms'}, 
                     padding 0.7s ease-in-out ${isOpen ? '0ms' : '400ms'}, 
                     border-radius 0.7s ease-in-out ${isOpen ? '0ms' : '400ms'},
                     border-color 0.3s ease-in-out,
                     box-shadow 0.3s ease-in-out`
      }"
      class="flex flex-col"
    >
      <!-- Filter Icon with Counter Dot -->
      <div
        class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out flex-shrink-0 z-20"
        style="top: 32px;"
      >
        <!-- Icon Container -->
        <div class="relative">
          <SlidersHorizontal
            :class="[
              'w-10 h-10 cursor-pointer transition-all duration-500',
              // Enhanced icon styling for active filters with rotation effect
              hasActiveFilters ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-800',
              // Subtle rotation animation when expanding
              isOpen ? 'rotate-90' : 'rotate-0'
            ]"
            @click="togglePanel"
            :title="isOpen ? 'Hide Filters' : hasActiveFilters ? `Show Filters (${activeFilterCount} active)` : 'Show Filters'"
          />
          
          <!-- Counter Dot (when collapsed and has active filters) -->
          <div 
            v-if="hasActiveFilters"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm transition-all duration-300"
            :class="isOpen ? 'scale-75' : 'opacity-100 scale-100'"
          >
            {{ activeFilterCount }}
          </div>
        </div>
      </div>

      <!-- Expanded Content -->
      <div
        v-show="isOpen"
        class="pt-12 w-full transition-all duration-700 ease-out"
        :class="isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'"
        :style="{ transitionDelay: isOpen ? '200ms' : '0ms' }"
      >
        <!-- Filters Container -->
        <div>
          <!-- Desktop: Single Row Layout -->
          <div class="hidden lg:flex items-center justify-center gap-6 flex-wrap mb-4">
            <!-- Container Tags -->
            <div class="flex items-center gap-2 transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
                :style="{ transitionDelay: isOpen ? '400ms' : '300ms' }">
              <span class="relative text-sm font-medium text-gray-600">
                Container Quick Filters:
                <span v-if="filters.green || filters.grey"
                      class="absolute -top-1 -left-3 w-2 h-2 bg-red-500 rounded-full"></span>
              </span>
              <button
                @click="toggleContainer('green')"
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105',
                  filters.green 
                    ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm' 
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                ]"
              >
                <div class="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                Green
              </button>
              <button
                @click="toggleContainer('grey')"
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105',
                  filters.grey 
                    ? 'bg-gray-200 text-gray-800 border-2 border-gray-400 shadow-sm' 
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                ]"
              >
                <div class="w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
                Grey
              </button>
            </div>

              <!-- Origin Filter -->
              <div class="flex items-center gap-2 transform transition-all duration-600 ease-out"
                  :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
                  :style="{ transitionDelay: isOpen ? '500ms' : '200ms' }">
              <span class="relative text-sm font-medium text-gray-600">
                Origin:
                <span v-if="filters.origin"
                      class="absolute -top-1 -left-3 w-2 h-2 bg-red-500 rounded-full"></span>
              </span>
              <select
                v-model="filters.origin"
                :disabled="hasContainerFilter"
                :class="[
                  'px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px] transition-all duration-200',
                  hasContainerFilter ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:border-gray-400'
                ]"
              >
                <option value="">All Origins</option>
                <option v-for="origin in origins" :key="origin" :value="origin">
                  {{ origin }}
                </option>
              </select>
            </div>

            <!-- Shop Filter -->
            <div class="flex items-center gap-2 transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
                :style="{ transitionDelay: isOpen ? '600ms' : '100ms' }">
              <span class="relative text-sm font-medium text-gray-600">
                Shop:
                <span v-if="filters.shop"
                      class="absolute -top-1 -left-3 w-2 h-2 bg-red-500 rounded-full"></span>
              </span>
              <select
                v-model="filters.shop"
                :disabled="hasContainerFilter"
                :class="[
                  'px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-[120px] transition-all duration-200',
                  hasContainerFilter ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:border-gray-400'
                ]"
              >
                <option value="">All Shops</option>
                <option v-for="shop in shops" :key="shop" :value="shop">
                  {{ shop }}
                </option>
              </select>
            </div>

            <!-- Clear Filters Button -->
            <button 
              @click="clearFilters"
              v-if="hasActiveFilters"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-600 transform hover:scale-105"
              :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
              :style="{ transitionDelay: isOpen ? '700ms' : '0ms' }"
              title="Clear All Filters"
            >
              <X class="w-4 h-4"/>
              Clear
            </button>
          </div>

          <!-- Mobile: Stacked Layout -->
          <div class="lg:hidden space-y-4 mb-4">
          <!-- Container Tags -->
          <div class="text-center transform transition-all duration-600 ease-out"
              :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
              :style="{ transitionDelay: isOpen ? '400ms' : '300ms' }">
              <span class="text-sm font-medium text-gray-600 block mb-2">Container Quick Filters</span>
              <div class="flex justify-center gap-2">
                <button
                  @click="toggleContainer('green')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105',
                    filters.green 
                      ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  ]"
                >
                  <div class="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  Green
                </button>
                <button
                  @click="toggleContainer('grey')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105',
                    filters.grey 
                      ? 'bg-gray-200 text-gray-800 border-2 border-gray-400 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  ]"
                >
                  <div class="w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
                  Grey
                </button>
              </div>
            </div>

            <!-- Origin Filter -->
            <div class="text-center transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
                :style="{ transitionDelay: isOpen ? '500ms' : '200ms' }">
              <label class="text-sm font-medium text-gray-600 block mb-2">Origin</label>
              <select
                v-model="filters.origin"
                :disabled="hasContainerFilter"
                :class="[
                  'w-full max-w-xs mx-auto px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
                  hasContainerFilter ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:border-gray-400'
                ]"
              >
                <option value="">All Origins</option>
                <option v-for="origin in origins" :key="origin" :value="origin">
                  {{ origin }}
                </option>
              </select>
            </div>

            <!-- Shop Filter -->
            <div class="text-center transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
                :style="{ transitionDelay: isOpen ? '600ms' : '100ms' }">
              <label class="text-sm font-medium text-gray-600 block mb-2">Coffee Shop</label>
              <select
                v-model="filters.shop"
                :disabled="hasContainerFilter"
                :class="[
                  'w-full max-w-xs mx-auto px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200',
                  hasContainerFilter ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:border-gray-400'
                ]"
              >
                <option value="">All Shops</option>
                <option v-for="shop in shops" :key="shop" :value="shop">
                  {{ shop }}
                </option>
              </select>
            </div>

            <!-- Clear Filters Button -->
            <div class="text-center transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
                :style="{ transitionDelay: isOpen ? '700ms' : '0ms' }"
                v-if="hasActiveFilters">
              <button 
                @click="clearFilters"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-300 transform hover:scale-105"
                title="Clear All Filters"
              >
                <X class="w-4 h-4"/>
                Clear All Filters
              </button>
            </div>
          </div>

          <!-- Result Count with Active Filters Summary -->
          <div class="pt-3 border-t border-gray-200 text-sm text-gray-600 text-center space-y-2 transform transition-all duration-600 ease-out"
              :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
              :style="{ transitionDelay: isOpen ? '800ms' : '0ms' }">
            <div>
              Showing <span class="font-semibold">{{ filteredCount }}</span> of <span class="font-semibold">{{ totalCount }}</span> coffees
            </div>
            
            <!-- Active Filters Summary -->
            <div v-if="hasActiveFilters" class="flex flex-wrap justify-center gap-2 mt-2">
              <span
                v-for="filter in activeFilters"
                :key="filter.key"
                class="inline-flex items-center bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full"
              >
                {{ filter.label }}
                <button
                  @click="removeFilter(filter.key)"
                  class="ml-1 text-red-500 hover:text-red-700"
                >×</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-vue-next'

const isOpen = ref(false)
const isCollapsing = ref(false)
const initialized = ref(false)

const togglePanel = () => {
  if (isOpen.value) {
    // Starting to collapse
    isCollapsing.value = true
    isOpen.value = false
    
    // Stop showing overflow after elements have animated out
    setTimeout(() => {
      isCollapsing.value = false
    }, 400)
  } else {
    // Opening - no special handling needed
    isCollapsing.value = false
    isOpen.value = true
  }
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

// 1) container‐only check stays the same
const hasContainerFilter = computed(() => filters.green || filters.grey)

// 2) build a single list of “active” filters
const activeFilters = computed(() => {
  const arr = []
  if (filters.green)  arr.push({ key: 'green',  label: 'Green' })
  if (filters.grey)   arr.push({ key: 'grey',   label: 'Grey' })
  // only count origin/shop if no container is active
  if (!hasContainerFilter.value) {
    if (filters.origin) arr.push({ key: 'origin', label: filters.origin })
    if (filters.shop)   arr.push({ key: 'shop',   label: filters.shop })
  }
  return arr
})

// 3) expose the flags you need in the template
const hasActiveFilters   = computed(() => activeFilters.value.length > 0)
const activeFilterCount  = computed(() => activeFilters.value.length)

// Toggle container filter
const toggleContainer = (container) => {
  if (container === 'green') {
    filters.green = !filters.green
  } else if (container === 'grey') {
    filters.grey = !filters.grey
  }
  
  // Clear other filters when container filter is applied
  if (hasContainerFilter.value) {
    filters.origin = ''
    filters.shop = ''
  }
}

// remove a single filter when clicking the × on a chip
function removeFilter(key) {
  if (key === 'green' || key === 'grey') {
    filters[key] = false
  } else {
    filters[key] = ''
  }
}

// Parse URL parameters into filter object
const parseUrlFilters = () => {
  const urlFilters = {
    green: false,
    grey: false,
    origin: '',
    shop: ''
  }

  // Handle container parameter
  if (route.query.container) {
    const containerParam = route.query.container
    let containers = []
    
    if (Array.isArray(containerParam)) {
      containers = containerParam
    } else if (typeof containerParam === 'string') {
      containers = containerParam.split(',').map(c => c.trim()).filter(c => c)
    }

    urlFilters.green = containers.includes('green')
    urlFilters.grey = containers.includes('grey')
  }

  // Handle other filters (only if no container filter)
  if (!urlFilters.green && !urlFilters.grey) {
    urlFilters.origin = route.query.origin || ''
    urlFilters.shop = route.query.shop || ''
  }

  return urlFilters
}

// Apply filters from URL to reactive filters
const loadFiltersFromUrl = () => {
  const urlFilters = parseUrlFilters()
  
  // Update reactive filters
  Object.assign(filters, urlFilters)
  
  // Emit the change to parent
  emit('filter-change', { ...filters }, true)
}

// Update URL based on current filters
const updateUrl = () => {
  if (!initialized.value) return

  const query = {}

  // Handle container filters
  const containerList = []
  if (filters.green) containerList.push('green')
  if (filters.grey) containerList.push('grey')
  
  if (containerList.length > 0) {
    query.container = containerList.join(',')
  }

  // Handle other filters (only if no container filter)
  if (!hasContainerFilter.value) {
    if (filters.origin) {
      query.origin = filters.origin
    }
    if (filters.shop) {
      query.shop = filters.shop
    }
  }

  // Use router.replace to avoid adding to history
  router.replace({
    path: route.path,
    query
  })
}

const clearFilters = () => {
  filters.green = false
  filters.grey = false
  filters.origin = ''
  filters.shop = ''
}

// Initialize filters from URL when component mounts
onMounted(() => {
  loadFiltersFromUrl()
  initialized.value = true
})

// Watch for filter changes and update URL
watch(filters, () => {
  if (!initialized.value) return
  
  emit('filter-change', { ...filters }, false)
  updateUrl()
}, { deep: true })

// Watch for route changes (when URL is manually changed)
watch(() => route.query, () => {
  if (!initialized.value) return
  
  // Temporarily disable URL updates to prevent infinite loop
  initialized.value = false
  loadFiltersFromUrl()
  initialized.value = true
}, { deep: true })
</script>