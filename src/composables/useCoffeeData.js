import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useCoffeeData() {
  const coffees = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const expandedCards = ref(new Set())
  const error = ref(null)

  const toggleCardExpansion = (coffeeId) => {
    const newExpanded = new Set(expandedCards.value)
    if (newExpanded.has(coffeeId)) {
      newExpanded.delete(coffeeId)
    } else {
      newExpanded.add(coffeeId)
    }
    expandedCards.value = newExpanded
  }

  const fetchCoffees = async (userId = null) => {
    loading.value = true
    error.value = null
    
    try {
      // Build query for coffee beans with related data
      let query = supabase
        .from('coffee_beans')
        .select(`
          *,
          shops (
            id,
            name,
            url,
            logo
          ),
          coffee_container_assignments (
            id,
            assigned_at,
            containers (
              id,
              name,
              color,
              display_order
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Filter by user if provided
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw supabaseError
      }

      // Transform Supabase data to match UI expectations
      coffees.value = transformSupabaseData(data || [])
      
    } catch (err) {
      console.error('Failed to fetch coffees from Supabase:', err)
      error.value = err.message
      coffees.value = []
    } finally {
      loading.value = false
    }
  }

  const refreshCoffees = async (userId = null) => {
    console.log('Refreshing coffees from Supabase...')
    await fetchCoffees(userId)
  }

  // Transform Supabase data to match UI expectations
  const transformSupabaseData = (supabaseData) => {
    return supabaseData.map(coffee => {
      // Handle container assignments
      const containers = coffee.coffee_container_assignments?.map(assignment => 
        assignment.containers
      ).filter(Boolean).sort((a, b) => a.display_order - b.display_order) || []

      // Handle legacy boolean container fields for backward compatibility
      const legacyContainers = []
      if (coffee.in_green_container) {
        legacyContainers.push({ id: 'green', name: 'Green Container', color: '#22c55e' })
      }
      if (coffee.in_grey_container) {
        legacyContainers.push({ id: 'grey', name: 'Grey Container', color: '#6b7280' })
      }

      // Use new container system, fallback to legacy
      const allContainers = containers.length > 0 ? containers : legacyContainers

      return {
        id: coffee.id,
        name: coffee.name,
        shop: coffee.shops?.name || coffee.shop_name,
        shopId: coffee.shop_id,
        shopUrl: coffee.shops?.url,
        shopLogo: coffee.shops?.logo,
        beanUrl: coffee.bean_url,
        origin: coffee.origin,
        region: coffee.region,
        altitude: coffee.altitude_meters,
        variety: coffee.botanic_variety,
        farmProducer: coffee.farm_producer,
        processing: coffee.processing_method,
        scaScore: coffee.sca,
        flavor: coffee.flavor,
        notes: coffee.notes,
        
        // Recipe information
        recipe: {
          ratio: coffee.recipe_ratio,
          inGrams: coffee.recipe_in_grams,
          outGrams: coffee.recipe_out_grams,
          timeSeconds: coffee.recipe_time_seconds,
          temperatureC: coffee.recipe_temperature_c
        },

        // Container information
        containers: allContainers,
        container: allContainers[0] || null, // Primary container for backward compatibility
        
        // Legacy boolean flags
        inGreenContainer: coffee.in_green_container,
        inGreyContainer: coffee.in_grey_container,
        
        // Metadata
        userId: coffee.user_id,
        createdAt: coffee.created_at,
        
        // Include all original data for flexibility
        _original: coffee
      }
    })
  }

  // Add new coffee to Supabase
  const addCoffee = async (coffeeData) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('coffee_beans')
        .insert([{
          name: coffeeData.name,
          shop_name: coffeeData.shopName,
          bean_url: coffeeData.beanUrl,
          origin: coffeeData.origin,
          region: coffeeData.region,
          altitude_meters: coffeeData.altitude,
          botanic_variety: coffeeData.variety,
          farm_producer: coffeeData.farmProducer,
          processing_method: coffeeData.processing,
          sca: coffeeData.scaScore,
          flavor: coffeeData.flavor,
          recipe_ratio: coffeeData.recipe?.ratio,
          recipe_in_grams: coffeeData.recipe?.inGrams,
          recipe_out_grams: coffeeData.recipe?.outGrams,
          recipe_time_seconds: coffeeData.recipe?.timeSeconds,
          recipe_temperature_c: coffeeData.recipe?.temperatureC,
          notes: coffeeData.notes,
          user_id: coffeeData.userId,
          shop_id: coffeeData.shopId,
          // Legacy container fields
          in_green_container: coffeeData.inGreenContainer || false,
          in_grey_container: coffeeData.inGreyContainer || false
        }])
        .select(`
          *,
          shops (id, name, url, logo)
        `)

      if (supabaseError) {
        throw supabaseError
      }

      // Add container assignments if provided
      if (data && data[0] && coffeeData.containerIds?.length > 0) {
        await assignContainers(data[0].id, coffeeData.containerIds, coffeeData.userId)
      }

      // Add to local state
      if (data && data[0]) {
        const transformedCoffee = transformSupabaseData([data[0]])[0]
        coffees.value.unshift(transformedCoffee)
      }

      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Failed to add coffee:', err)
      return { success: false, error: err.message }
    }
  }

  // Assign containers to a coffee
  const assignContainers = async (coffeeId, containerIds, userId) => {
    try {
      // Remove existing assignments
      await supabase
        .from('coffee_container_assignments')
        .delete()
        .eq('coffee_id', coffeeId)

      // Add new assignments
      if (containerIds && containerIds.length > 0) {
        const assignments = containerIds.map(containerId => ({
          coffee_id: coffeeId,
          container_id: containerId,
          assigned_by: userId
        }))

        const { error: assignmentError } = await supabase
          .from('coffee_container_assignments')
          .insert(assignments)

        if (assignmentError) {
          throw assignmentError
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to assign containers:', err)
      return { success: false, error: err.message }
    }
  }

  // Update coffee in Supabase
  const updateCoffee = async (coffeeId, updates) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('coffee_beans')
        .update({
          name: updates.name,
          shop_name: updates.shopName,
          bean_url: updates.beanUrl,
          origin: updates.origin,
          region: updates.region,
          altitude_meters: updates.altitude,
          botanic_variety: updates.variety,
          farm_producer: updates.farmProducer,
          processing_method: updates.processing,
          sca: updates.scaScore,
          flavor: updates.flavor,
          recipe_ratio: updates.recipe?.ratio,
          recipe_in_grams: updates.recipe?.inGrams,
          recipe_out_grams: updates.recipe?.outGrams,
          recipe_time_seconds: updates.recipe?.timeSeconds,
          recipe_temperature_c: updates.recipe?.temperatureC,
          notes: updates.notes,
          shop_id: updates.shopId,
          in_green_container: updates.inGreenContainer,
          in_grey_container: updates.inGreyContainer
        })
        .eq('id', coffeeId)
        .select(`
          *,
          shops (id, name, url, logo)
        `)

      if (supabaseError) {
        throw supabaseError
      }

      // Update container assignments if provided
      if (updates.containerIds !== undefined) {
        await assignContainers(coffeeId, updates.containerIds, updates.userId)
      }

      // Update local state
      if (data && data[0]) {
        const transformedCoffee = transformSupabaseData([data[0]])[0]
        const index = coffees.value.findIndex(c => c.id === coffeeId)
        if (index !== -1) {
          coffees.value[index] = transformedCoffee
        }
      }

      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Failed to update coffee:', err)
      return { success: false, error: err.message }
    }
  }

  // Delete coffee from Supabase
  const deleteCoffee = async (coffeeId) => {
    try {
      const { error: supabaseError } = await supabase
        .from('coffee_beans')
        .delete()
        .eq('id', coffeeId)

      if (supabaseError) {
        throw supabaseError
      }

      // Remove from local state
      coffees.value = coffees.value.filter(c => c.id !== coffeeId)

      return { success: true }
    } catch (err) {
      console.error('Failed to delete coffee:', err)
      return { success: false, error: err.message }
    }
  }

  // Fetch available containers for a user
  const fetchContainers = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Failed to fetch containers:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    coffees,
    loading,
    loadingMore,
    expandedCards,
    error,
    toggleCardExpansion,
    fetchCoffees,
    refreshCoffees,
    addCoffee,
    updateCoffee,
    deleteCoffee,
    assignContainers,
    fetchContainers,
    transformSupabaseData
  }
}