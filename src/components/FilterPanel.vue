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
        width: isOpen ? '100%' : '80px',
        maxWidth: isOpen ? '56rem' : '80px',
        height: isOpen ? 'auto' : '80px',
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
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out flex flex-col items-center flex-shrink-0 z-20"
        :style="{ top: isOpen ? '32px' : '50%' }"
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

          <!-- Counter (when collapsed and has active filters) -->
          <div 
            v-if="!isOpen"
            :class="[
              'mt-2 text-xs font-bold transition-all duration-500 ease-in-out text-center',
              hasActiveFilters ? 'text-red-500' : 'text-gray-500'
            ]"
            :style="{ transitionDelay: isOpen ? '0ms' : '400ms' }"
          >
            {{ filteredCount }}/{{ totalCount }}
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
            <!-- Container Tags (Dynamic) -->
            <div class="flex items-center gap-2 transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
                :style="{ transitionDelay: isOpen ? '400ms' : '300ms' }">
              <span class="relative text-sm font-medium text-gray-600">
                Container Quick Filters:
                <span v-if="filters.containers.length > 0"
                      class="absolute -top-1 -left-3 w-2 h-2 bg-red-500 rounded-full"></span>
              </span>
              
              <!-- Dynamic container buttons -->
              <button
                v-for="container in containers"
                :key="container.id"
                @click="toggleContainer(container.id)"
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105',
                  filters.containers.includes(container.id)
                    ? 'text-white border-2 shadow-sm' 
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                ]"
                :style="filters.containers.includes(container.id) ? {
                  backgroundColor: container.color,
                  borderColor: `${container.color}80`
                } : {}"
              >
                <div 
                  class="w-2.5 h-2.5 rounded-full"
                  :style="{ backgroundColor: container.color }"
                ></div>
                {{ container.name }}
              </button>
              
              <!-- Show message if no containers -->
              <span v-if="!containers || containers.length === 0" class="text-sm text-gray-400 italic">
                No containers available
              </span>
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

            <!-- Coffee Name Filter -->
            <div
              class="text-center transform transition-all duration-600 ease-out"
              :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
              :style="{ transitionDelay: isOpen ? '700ms' : '0ms' }"
            >
              <span class="text-sm font-medium text-gray-600">
                Coffee Name:
                  <span v-if="filters.name"
                    class="absolute -top-1 -left-3 w-2 h-2 bg-red-500 rounded-full"></span>                
              </span>
              <input
                v-model="filters.name"                
                :disabled="hasContainerFilter"
                :class="[
                  'px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-[120px] transition-all duration-200',
                  hasContainerFilter ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:border-gray-400'
                ]"
                placeholder="Search by name"
              />
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
              Clear All Filters
            </button>
          </div>

          <!-- Mobile: Stacked Layout -->
          <div class="lg:hidden space-y-4 mb-4">
            <!-- Container Tags -->
            <div class="text-center transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
                :style="{ transitionDelay: isOpen ? '400ms' : '300ms' }">
              <span class="text-sm font-medium text-gray-600 block mb-2">Container Quick Filters</span>
              <div class="flex flex-wrap justify-center gap-2">
                <button
                  v-for="container in containers"
                  :key="container.id"
                  @click="toggleContainer(container.id)"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 transform hover:scale-105',
                    filters.containers.includes(container.id)
                      ? 'text-white border-2 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  ]"
                  :style="filters.containers.includes(container.id) ? {
                    backgroundColor: container.color,
                    borderColor: `${container.color}80`
                  } : {}"
                >
                  <div 
                    class="w-2.5 h-2.5 rounded-full"
                    :style="{ backgroundColor: container.color }"
                  ></div>
                  {{ container.name }}
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

            <!-- Coffee Name Filter -->
            <div class="text-center transform transition-all duration-600 ease-out"
                :class="isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
                :style="{ transitionDelay: isOpen ? '600ms' : '100ms' }">
              <label class="text-sm font-medium text-gray-600 block mb-2">Coffee Name
                <span v-if="filters.name"
                    class="absolute -top-1 -left-3 w-2 h-2 bg-red-500 rounded-full"></span>
              </label>
              <input
                v-model="filters.name"
                :disabled="hasContainerFilter"
                :class="[
                  'px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-[120px] transition-all duration-200',
                  hasContainerFilter ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:border-gray-400'
                ]"
                placeholder="Search by name"
              />
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
          <div class="pt-3 border-t border-gray-200 text-sm text-center space-y-2 transform transition-all duration-600 ease-out"
              :class="[
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                hasActiveFilters ? 'text-red-500' : 'text-gray-600'
              ]"
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
import { ref, reactive, watch, onMounted, computed, nextTick } from 'vue'
import { useToast } from '../composables/useToast'
import { SlidersHorizontal, X } from 'lucide-vue-next'
import { debounce } from 'lodash-es'

const props = defineProps({
  origins: Array,
  shops: Array,
  names: Array,
  containers: Array,
  filteredCount: Number,
  totalCount: Number
})

const emit = defineEmits(['filter-change'])

// UI state
const isOpen = ref(false)
const isCollapsing = ref(false)
const initialized = ref(false)

// Filter state
const filters = reactive({
  origin: '',
  shop: '',
  name: '',
  containers: []
})

const route = useRoute()
const router = useRouter()
const { success, warning, info } = useToast()

// Computed properties
const hasContainerFilter = computed(() => filters.containers.length > 0)

const activeFilters = computed(() => {
  const arr = []
  
  // Add container filters
  filters.containers.forEach(containerId => {
    const container = props.containers?.find(c => c.id === containerId)
    if (container) {
      arr.push({ 
        key: `container-${containerId}`, 
        label: container.name,
        color: container.color 
      })
    }
  })
  
  // Only show other filters if no container filter is active
  if (!hasContainerFilter.value) {
    if (filters.origin) arr.push({ key: 'origin', label: filters.origin })
    if (filters.shop) arr.push({ key: 'shop', label: filters.shop })
    if (filters.name) arr.push({ key: 'name', label: filters.name })
  }
  return arr
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)
const activeFilterCount = computed(() => activeFilters.value.length)

// UI handlers
const togglePanel = () => {
  if (isOpen.value) {
    isCollapsing.value = true
    isOpen.value = false
    setTimeout(() => {
      isCollapsing.value = false
    }, 400)
  } else {
    isCollapsing.value = false
    isOpen.value = true
  }
}

// Filter handlers
const toggleContainer = (containerId) => {
  const hadOtherFilters = filters.origin || filters.shop
  
  const index = filters.containers.indexOf(containerId)
  if (index > -1) {
    filters.containers.splice(index, 1)
  } else {
    filters.containers.push(containerId)
  }
  
  // Clear other filters when container filter is applied
  if (hasContainerFilter.value && hadOtherFilters) {
    warning('Filters cleared', 'Origin and shop filters cleared when selecting container')
    filters.origin = ''
    filters.shop = ''
  }
}

const removeFilter = (key) => {
  if (key.startsWith('container-')) {
    const containerId = key.replace('container-', '')
    const index = filters.containers.indexOf(containerId)
    if (index > -1) {
      filters.containers.splice(index, 1)
    }
  } else if (key === 'origin' || key === 'shop') {
    filters[key] = ''
  } else if (key === 'name') {
    filters[key] = ''
  }
}

const clearFilters = () => {
  Object.assign(filters, {
    containers: [],
    origin: '',
    shop: '',
    name: ''
  })
}

// URL handling
const parseUrlFilters = () => {
  try {
    const urlFilters = {
      containers: [],
      origin: '',
      shop: '',
      name: ''
    }

    // Handle container parameter
    if (route.query.container) {
      const containerParam = route.query.container
      const containerNames = Array.isArray(containerParam) 
        ? containerParam 
        : containerParam.split(',').map(c => c.trim()).filter(c => c)

      // Convert container names to IDs
      containerNames.forEach(name => {
        const container = props.containers?.find(c => 
          c.name.toLowerCase() === name.toLowerCase()
        )
        if (container) {
          urlFilters.containers.push(container.id)
        }
      })
    }

    // Handle other filters (only if no container filter)
    if (urlFilters.containers.length === 0) {
      urlFilters.origin = route.query.origin || ''
      urlFilters.shop = route.query.shop || ''
    }
    urlFilters.name = route.query.name || ''

    return urlFilters
  } catch (err) {
    console.error('Error parsing URL filters:', err)
    warning('URL error', 'Invalid filter parameters in URL, using defaults')
    return { containers: [], origin: '', shop: '', name: '' }
  }
}

const loadFiltersFromUrl = () => {
  const urlFilters = parseUrlFilters()
  Object.assign(filters, urlFilters)
  emit('filter-change', { ...urlFilters }, true)
}

// In FilterPanel.vue, update the updateUrl function:
const updateUrl = () => {
  if (!initialized.value) return

  const query = {}

  // Handle container filters
  const containerList = []
  if (filters.containers && filters.containers.length > 0) {
    // Convert container IDs back to names for URL
    filters.containers.forEach(containerId => {
      const container = props.containers?.find(c => c.id === containerId)
      if (container) {
        containerList.push(container.name)
      }
    })
  }
  
  if (containerList.length > 0) {
    query.container = containerList.join(',')
  }

  // Handle other filters (only if no container filter)
  if (!hasContainerFilter.value) {
    if (filters.origin) query.origin = filters.origin
    if (filters.shop) query.shop = filters.shop
  }

  try {
    // Add check to prevent infinite loops
    const currentQuery = JSON.stringify(route.query)
    const newQuery = JSON.stringify(query)
    
    if (currentQuery !== newQuery) {
      router.replace({ path: route.path, query }).catch(err => {
        // Silently handle router errors to prevent console spam
        if (!err.message.includes('redundant navigation')) {
          console.error('Router navigation error:', err)
        }
      })
    }
  } catch (err) {
    console.error('Error updating URL:', err)
  }
}

const debouncedUpdateUrl = debounce(updateUrl, 100)

// Feedback helpers
const showFilterFeedback = () => {
  nextTick(() => {
    setTimeout(() => {
      if (!hasActiveFilters.value) return
      
      if (props.filteredCount === 0) {
        info('No results found', 'Try adjusting your filters to see more coffees')
      } else if (props.filteredCount > 0) {
        const resultText = props.filteredCount === 1 ? '1 coffee' : `${props.filteredCount} coffees`
      }
    }, 100)
  })
}

// Lifecycle
onMounted(() => {
  loadFiltersFromUrl()
  initialized.value = true
})

// Watchers
watch(filters, (newFilters) => {
  if (!initialized.value) return
  
  const isFromUrlChange = JSON.stringify(newFilters) === JSON.stringify(parseUrlFilters())
  
  if (!isFromUrlChange) {
    emit('filter-change', { ...filters }, false)
    showFilterFeedback()
    debouncedUpdateUrl()
  }
}, { deep: true })

watch(() => route.query, (newQuery, oldQuery) => {
  if (!initialized.value) return
  
  // Prevent infinite loops by checking if query actually changed
  if (JSON.stringify(newQuery) === JSON.stringify(oldQuery)) {
    return
  }
  
  const wasInitialized = initialized.value
  initialized.value = false
  loadFiltersFromUrl()
  initialized.value = wasInitialized
}, { deep: true })

watch(() => props.filteredCount, (newCount, oldCount) => {
  if (!initialized.value || !hasActiveFilters.value || oldCount === undefined) return
  
  if (oldCount > 0 && newCount === 0) {
    warning('No matches', 'Your current filters don\'t match any coffees')
  }
})
</script>