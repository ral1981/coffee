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
  // FIXED: Renamed to match what components expect
  const activeContainerIds = ref([])  // Was activeContainersIds (typo)
  const showFavoritesOnly = ref(false)
  
  // Get favorites functionality
  const { favoriteIds, isFavorited, getFavoriteCoffees, isLoaded, fetchFavorites } = useFavorites()

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

  // FIXED: Compute activeContainers from IDs (no need for containers parameter)
  const activeContainers = computed(() => {
    // This will be computed by the component that has access to containers
    // For now, return array of objects with just IDs for compatibility
    return activeContainerIds.value.map(id => ({ id }))
  })

  // Container counts for each container
  const containerCounts = computed(() => {
    if (!coffees?.value) return {}
    
    const counts = {}
    const relevantCoffees = showFavoritesOnly.value 
      ? coffees.value.filter(coffee => isFavorited(coffee.id))
      : coffees.value
    
    relevantCoffees.forEach(coffee => {
      const containerIds = coffee.containerIds || 
        coffee.coffee_container_assignments?.map(a => a.container_id) || []
      
      containerIds.forEach(containerId => {
        counts[containerId] = (counts[containerId] || 0) + 1
      })
    })
    
    return counts
  })

  // Main filtered results
  const filteredCoffees = computed(() => {
    if (!coffees?.value) return []
    
    let filtered = [...coffees.value]
    
    // Apply favorites filter first - but only if favorites are loaded or not filtering by favorites
    if (showFavoritesOnly.value) {
      console.log('Filtering by favorites:', {
        totalCoffees: filtered.length,
        favoritesLoaded: isLoaded?.value,
        favoriteIdsCount: favoriteIds?.value?.length || 0,
        showFavoritesOnly: showFavoritesOnly.value
      })
      
      if (!isLoaded?.value) {
        console.warn('Favorites filter requested but favorites not loaded yet')
        // Return empty array or show loading state
        return []
      }
      
      const beforeCount = filtered.length
      filtered = filtered.filter(coffee => {
        const isFav = isFavorited(coffee.id)
        return isFav
      })
      
      console.log('Favorites filter results:', {
        before: beforeCount,
        after: filtered.length,
        favoriteCoffees: filtered.map(c => c.name)
      })
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
      console.log('🔍 Applying origin filter:', filters.value.origin)
      filtered = filtered.filter(coffee => coffee.origin === filters.value.origin)
      console.log('🔍 After origin filter:', filtered.length)
    }
    
    if (filters.value.shop) {
      console.log('🔍 Applying shop filter:', filters.value.shop)
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
    
    // FIXED: Apply container filters using IDs correctly
    if (activeContainerIds.value.length > 0) {
      filtered = filtered.filter(coffee => {
        const coffeeContainerIds = coffee.containerIds || 
          coffee.coffee_container_assignments?.map(a => a.container_id) || []
        
        return activeContainerIds.value.some(containerId =>
          coffeeContainerIds.includes(containerId)  // Fixed: was container.id
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
      activeContainerIds.value.length > 0 ||
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
    activeContainerIds.value = []  // Fixed: was activeContainers.value
  }

  const clearFavoritesFilter = () => {
    showFavoritesOnly.value = false
  }

  const clearAllFilters = () => {
    console.log('useFilters - clearAllFilters called')
    searchQuery.value = ''
    clearFilters()
    clearContainerFilters()
    clearFavoritesFilter()
  }

  // Container filter management
  const toggleContainerFilter = (container) => {
    const containerId = typeof container === 'object' ? container.id : container
    const index = activeContainerIds.value.indexOf(containerId)
    
    if (index > -1) {
      activeContainerIds.value.splice(index, 1)
    } else {
      activeContainerIds.value.push(containerId)
    }
  }

  const addContainerFilter = (container) => {
    const containerId = typeof container === 'object' ? container.id : container
    const exists = activeContainerIds.value.includes(containerId)
    if (!exists) {
      activeContainerIds.value.push(containerId)
    }
  }

  const removeContainerFilter = (containerId) => {
    activeContainerIds.value = activeContainerIds.value.filter(id => id !== containerId)
  }

  // Favorites filter management
  const toggleFavoritesFilter = async (show = !showFavoritesOnly.value) => {
    console.log('useFilters - toggleFavoritesFilter called with:', show)
    
    // If turning on favorites filter, ensure favorites are loaded
    if (show && !isLoaded?.value) {
      console.log('Favorites not loaded, fetching...')
      try {
        await fetchFavorites()
        console.log('Favorites loaded successfully in useFilters')
      } catch (error) {
        console.error('Failed to load favorites:', error)
        // Don't set the filter if we couldn't load favorites
        return
      }
    }
    
    showFavoritesOnly.value = show
    console.log('Favorites filter set to:', show)
  }

  // Ensure favorites are loaded when needed
  const ensureFavoritesLoaded = async () => {
    if (!isLoaded?.value) {
      console.log('Ensuring favorites are loaded...')
      await fetchFavorites()
    }
    return isLoaded?.value
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
      const containerName = query.container
      console.log('Single container from URL:', containerName)
    } else if (query.containers) {
      const containerNames = query.containers.split(',')
      console.log('Multiple containers from URL:', containerNames)
    }
    
    if (query.favorites === 'true') {
      // Don't immediately set favorites filter - let the component handle loading
      console.log('Favorites filter detected in URL - will be handled by component')
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
    
    // Only update URL for single container selections
    if (activeContainers.value.length === 1) {
      query.container = activeContainers.value[0].name
    }
    
    if (showFavoritesOnly.value) {
      query.favorites = 'true'
    }
    
    // Check if query actually changed
    const currentQuery = route.query
    const queryChanged = Object.keys(query).length !== Object.keys(currentQuery).length ||
      Object.keys(query).some(key => query[key] !== currentQuery[key])
    
    // FIXED: Only update route if there's a meaningful change
    if (queryChanged) {
      console.log('Updating route with query:', query)
      // Use replace instead of push to avoid navigation that triggers re-renders
      router.replace({ query }).catch(() => {})
    } else {
      console.log('Skipping route update - no change')
    }
  }

  // Bulk operations for favorites
  const addAllFilteredToFavorites = async () => {
    await ensureFavoritesLoaded()
    
    const { addToFavorites } = useFavorites()
    const unfavoritedCoffees = filteredCoffees.value.filter(coffee => !isFavorited(coffee.id))
    
    console.log('Adding to favorites:', {
      totalFiltered: filteredCoffees.value.length,
      unfavorited: unfavoritedCoffees.length
    })
    
    if (unfavoritedCoffees.length === 0) {
      return {
        success: true,
        addedCount: 0,
        message: 'All filtered coffees are already in favorites'
      }
    }
    
    let successCount = 0
    const results = []
    
    for (const coffee of unfavoritedCoffees) {
      try {
        const result = await addToFavorites(coffee.id)
        if (result.success) {
          successCount++
        }
        results.push({ coffee, result })
      } catch (error) {
        console.error('Failed to add coffee to favorites:', coffee.name, error)
        results.push({ coffee, error })
      }
    }
    
    return {
      success: successCount > 0,
      addedCount: successCount,
      results
    }
  }

  const exportFavoritesData = async () => {
    await ensureFavoritesLoaded()
    
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
  const applyPresetFilter = async (preset) => {
    clearAllFilters()
    
    switch (preset) {
      case 'favorites':
        await toggleFavoritesFilter(true)
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
    activeContainerIds,  // Fixed export name
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
    ensureFavoritesLoaded,
    
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