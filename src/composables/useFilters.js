import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFavorites } from './useFavorites'

export function useFilters(coffees) {
  const router = useRouter()
  const route = useRoute()
  
  // Filter state
  const searchQuery = ref('')
  const filters = ref({
    origin: '',
    shop: '',
    name: ''
  })
  const activeContainers = ref([])
  const showFavoritesOnly = ref(false)
  
  // Get favorites functionality
  const { favoriteIds, isFavorited, getFavoriteCoffees } = useFavorites()

  // Computed filter options
  const availableOrigins = computed(() => {
    if (!coffees?.value) return []
    const origins = new Set()
    coffees.value.forEach(coffee => {
      if (coffee.origin) origins.add(coffee.origin)
    })
    return Array.from(origins).sort()
  })

  const availableShops = computed(() => {
    if (!coffees?.value) return []
    const shops = new Set()
    coffees.value.forEach(coffee => {
      const shopName = coffee.shops?.name || coffee.shop_name
      if (shopName) shops.add(shopName)
    })
    return Array.from(shops).sort()
  })

  // Container counts for each container
  const containerCounts = computed(() => {
    if (!coffees?.value) return {}
    
    const counts = {}
    const relevantCoffees = showFavoritesOnly.value 
      ? coffees.value.filter(coffee => isFavorited(coffee.id))
      : coffees.value
    
    relevantCoffees.forEach(coffee => {
      if (coffee.containerIds) {
        coffee.containerIds.forEach(containerId => {
          counts[containerId] = (counts[containerId] || 0) + 1
        })
      }
    })
    
    return counts
  })

  // Main filtered results
  const filteredCoffees = computed(() => {
    if (!coffees?.value) return []
    
    let filtered = [...coffees.value]
    
    // Apply favorites filter first
    if (showFavoritesOnly.value) {
      filtered = filtered.filter(coffee => isFavorited(coffee.id))
    }
    
    // Apply search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      filtered = filtered.filter(coffee => {
        return (
          coffee.name?.toLowerCase().includes(query) ||
          coffee.origin?.toLowerCase().includes(query) ||
          coffee.region?.toLowerCase().includes(query) ||
          coffee.botanic_variety?.toLowerCase().includes(query) ||
          coffee.processing_method?.toLowerCase().includes(query) ||
          coffee.flavor?.toLowerCase().includes(query) ||
          coffee.farm_producer?.toLowerCase().includes(query) ||
          (coffee.shops?.name || coffee.shop_name)?.toLowerCase().includes(query)
        )
      })
    }
    
    // Apply filters
    if (filters.value.origin) {
      filtered = filtered.filter(coffee => coffee.origin === filters.value.origin)
    }
    
    if (filters.value.shop) {
      filtered = filtered.filter(coffee => {
        const shopName = coffee.shops?.name || coffee.shop_name
        return shopName === filters.value.shop
      })
    }
    
    if (filters.value.name) {
      const nameQuery = filters.value.name.toLowerCase()
      filtered = filtered.filter(coffee => 
        coffee.name?.toLowerCase().includes(nameQuery)
      )
    }
    
    // Apply container filters
    if (activeContainers.value.length > 0) {
      filtered = filtered.filter(coffee => {
        return activeContainers.value.some(container =>
          coffee.containerIds?.includes(container.id)
        )
      })
    }
    
    return filtered
  })

  // Filter status
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== '' ||
      filters.value.origin !== '' ||
      filters.value.shop !== '' ||
      filters.value.name !== '' ||
      activeContainers.value.length > 0 ||
      showFavoritesOnly.value
    )
  })

  const filteredCount = computed(() => filteredCoffees.value.length)
  const totalCount = computed(() => coffees?.value?.length || 0)

  // Methods
  const clearSearch = () => {
    searchQuery.value = ''
  }

  const clearFilters = () => {
    filters.value = {
      origin: '',
      shop: '',
      name: ''
    }
  }

  const clearContainerFilters = () => {
    activeContainers.value = []
  }

  const clearFavoritesFilter = () => {
    showFavoritesOnly.value = false
  }

  const clearAllFilters = () => {
    searchQuery.value = ''
    clearFilters()
    clearContainerFilters()
    clearFavoritesFilter()
  }

  // Container filter management
  const toggleContainerFilter = (container) => {
    const index = activeContainers.value.findIndex(c => c.id === container.id)
    if (index > -1) {
      activeContainers.value.splice(index, 1)
    } else {
      activeContainers.value.push(container)
    }
  }

  const addContainerFilter = (container) => {
    const exists = activeContainers.value.some(c => c.id === container.id)
    if (!exists) {
      activeContainers.value.push(container)
    }
  }

  const removeContainerFilter = (containerId) => {
    activeContainers.value = activeContainers.value.filter(c => c.id !== containerId)
  }

  // Favorites filter management
  const toggleFavoritesFilter = (show = !showFavoritesOnly.value) => {
    showFavoritesOnly.value = show
  }

  // URL synchronization
  const syncFiltersWithRoute = (query = {}) => {
    if (query.search) {
      searchQuery.value = query.search
    }
    
    if (query.origin) {
      filters.value.origin = query.origin
    }
    
    if (query.shop) {
      filters.value.shop = query.shop
    }
    
    if (query.container) {
      // Handle legacy container parameter
      const containerName = query.container
      // This will be handled by the parent component
    }
    
    if (query.favorites === 'true') {
      showFavoritesOnly.value = true
    }
  }

  const updateRoute = () => {
    const query = {}
    
    if (searchQuery.value.trim()) {
      query.search = searchQuery.value.trim()
    }
    
    if (filters.value.origin) {
      query.origin = filters.value.origin
    }
    
    if (filters.value.shop) {
      query.shop = filters.value.shop
    }
    
    if (activeContainers.value.length === 1) {
      query.container = activeContainers.value[0].name
    }
    
    if (showFavoritesOnly.value) {
      query.favorites = 'true'
    }
    
    // Only update route if query actually changed
    const currentQuery = route.query
    const queryChanged = Object.keys(query).length !== Object.keys(currentQuery).length ||
      Object.keys(query).some(key => query[key] !== currentQuery[key])
    
    if (queryChanged) {
      router.push({ query }).catch(() => {}) // Ignore navigation errors
    }
  }

  // Bulk operations for favorites
  const addAllFilteredToFavorites = async () => {
    const { addToFavorites } = useFavorites()
    const unfavoritedCoffees = filteredCoffees.value.filter(coffee => !isFavorited(coffee.id))
    
    const results = []
    for (const coffee of unfavoritedCoffees) {
      try {
        const result = await addToFavorites(coffee.id)
        results.push({ coffee, result })
      } catch (error) {
        results.push({ coffee, error })
      }
    }
    
    return results
  }

  const exportFavoritesData = async () => {
    const favoriteCoffees = await getFavoriteCoffees()
    
    const exportData = favoriteCoffees.map(coffee => ({
      name: coffee.name,
      shop: coffee.shops?.name || coffee.shop_name,
      origin: coffee.origin,
      region: coffee.region,
      variety: coffee.botanic_variety,
      processing: coffee.processing_method,
      flavor: coffee.flavor,
      favorited_date: coffee.favoritedAt,
      notes: coffee.favoriteNotes,
      url: coffee.bean_url
    }))
    
    // Create CSV
    const headers = ['Name', 'Shop', 'Origin', 'Region', 'Variety', 'Processing', 'Flavor', 'Favorited Date', 'Notes', 'URL']
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const key = header.toLowerCase().replace(' ', '_')
          const value = row[key] || ''
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ].join('\n')
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `coffee-favorites-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return exportData
  }

  // Preset filter combinations
  const applyPresetFilter = (preset) => {
    clearAllFilters()
    
    switch (preset) {
      case 'favorites':
        showFavoritesOnly.value = true
        break
      case 'recent':
        // Could add date filtering here
        break
      case 'no-container':
        // Filter for coffees without container assignments
        break
    }
  }

  return {
    // State
    searchQuery,
    filters,
    activeContainers,
    showFavoritesOnly,
    
    // Computed
    filteredCoffees,
    hasActiveFilters,
    filteredCount,
    totalCount,
    availableOrigins,
    availableShops,
    containerCounts,
    
    // Filter management
    clearSearch,
    clearFilters,
    clearContainerFilters,
    clearFavoritesFilter,
    clearAllFilters,
    
    // Container filters
    toggleContainerFilter,
    addContainerFilter,
    removeContainerFilter,
    
    // Favorites filters
    toggleFavoritesFilter,
    
    // URL sync
    syncFiltersWithRoute,
    updateRoute,
    
    // Bulk operations
    addAllFilteredToFavorites,
    exportFavoritesData,
    
    // Presets
    applyPresetFilter
  }
}