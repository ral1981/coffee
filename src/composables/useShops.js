// Enhanced useShops.js with global event system for auto-refresh
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'

// Global event emitter for shop changes
const shopEvents = reactive({
  listeners: []
})

export const emitShopChange = (type, shopData) => {
  console.log('🔔 Emitting shop change:', type, shopData)
  shopEvents.listeners.forEach(listener => {
    try {
      listener(type, shopData)
    } catch (error) {
      console.error('Error in shop change listener:', error)
    }
  })
}

// Global shops data
const globalShops = ref([])
const loading = ref(false)

export function useShops() {
  const { error, success, warning } = useToast()
  
  // Local reactive references to global data
  const shops = globalShops
  const isLoading = loading

  // Fetch shops from database
  const fetchShops = async () => {
    loading.value = true
    try {
      console.log('🔄 Fetching shops from database...')
      
      const { data, error: fetchError } = await supabase
        .from('shops')
        .select('*')
        .order('name')
      
      if (fetchError) {
        throw fetchError
      }
      
      globalShops.value = data || []
      console.log('✅ Shops loaded:', globalShops.value.length)
      
      return data || []
    } catch (err) {
      console.error('❌ Error fetching shops:', err)
      error('Load Error', 'Failed to load shops from database')
      return []
    } finally {
      loading.value = false
    }
  }

  // Add shop to list
  const addShopToList = (newShop) => {
    if (!newShop || !newShop.id) return
    
    // Check if shop already exists
    const existingIndex = globalShops.value.findIndex(s => s.id === newShop.id)
    
    if (existingIndex === -1) {
      // Add new shop
      globalShops.value.unshift(newShop)
      console.log('✅ Shop added to global list:', newShop.name)
    } else {
      // Update existing shop
      globalShops.value[existingIndex] = newShop
      console.log('🔄 Shop updated in global list:', newShop.name)
    }
    
    // Emit change event
    emitShopChange('added', newShop)
  }

  // Delete shope from list
  const deleteShop = async (shopId, shopName) => {
    try {
      console.log(`🗑️ Deleting shop: ${shopName} (ID: ${shopId})`)
      
      // Check for associated coffee beans first
      const { count: coffeeCount, error: countError } = await supabase
        .from('coffee_beans')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
      
      if (countError) {
        console.warn('Error counting associated coffees:', countError)
      }

      console.log(`📊 Found ${coffeeCount || 0} associated coffee beans`)

      // Prevent deletion if there are associated coffees
      if (coffeeCount && coffeeCount > 0) {
        const message = `Cannot delete "${shopName}" because it has ${coffeeCount} coffee${coffeeCount === 1 ? '' : 's'} associated with it.`
        
        warning('Cannot Delete Shop', message)
        console.log(`❌ Delete prevented - shop has ${coffeeCount} associated coffees`)
        
        return { 
          success: false, 
          error: message,
          coffeeCount: coffeeCount,
          preventedByAssociations: true
        }
      }
      
      // Delete the shop (only if no associated coffees)
      const { error: deleteError } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId)
      
      if (deleteError) {
        console.error('Error deleting shop:', deleteError)
        throw new Error(`Failed to delete shop: ${deleteError.message}`)
      }
      
      // Update local shops array
      const shopIndex = globalShops.value.findIndex(s => s.id === shopId)
      if (shopIndex > -1) {
        globalShops.value.splice(shopIndex, 1)
      }
      
      // Emit global shop change event
      emitShopChange('deleted', { id: shopId, name: shopName })
      
      console.log(`✅ Successfully deleted shop: ${shopName}`)
      return { success: true }
      
    } catch (err) {
      console.error('❌ Error in deleteShop:', err)
      error('Delete Failed', err.message)
      return { success: false, error: err.message }
    }
  }

  // Highlighting functionality
  const highlightedShopId = ref(null)
  const highlightTimeout = ref(null)

  const highlightShop = (shopId) => {
    // Clear existing timeout
    if (highlightTimeout.value) {
      clearTimeout(highlightTimeout.value)
    }
    
    highlightedShopId.value = shopId
    console.log('✨ Highlighting shop:', shopId)
    
    // Auto-clear highlight after 5 seconds
    highlightTimeout.value = setTimeout(() => {
      highlightedShopId.value = null
      console.log('🧹 Auto-cleared shop highlight')
    }, 5000)
  }

  const clearHighlight = () => {
    if (highlightTimeout.value) {
      clearTimeout(highlightTimeout.value)
      highlightTimeout.value = null
    }
    highlightedShopId.value = null
  }

  // Event listener for external shop changes
  const handleShopChange = (type, shopData) => {
    console.log('📡 Received shop change event:', type, shopData)
    
    switch (type) {
      case 'created':
        addShopToList(shopData)
        break
      case 'updated':
        addShopToList(shopData) // addShopToList handles both add and update
        break
      case 'deleted':
        if (shopData.id) {
          removeShopFromList(shopData.id)
        }
        break
      case 'refresh':
        // Force refresh from database
        fetchShops()
        break
    }
  }

  // Setup event listener on mount
  onMounted(() => {
    console.log('🔌 Setting up shop change listener')
    shopEvents.listeners.push(handleShopChange)
    
    // Initial load if shops are empty
    if (globalShops.value.length === 0) {
      fetchShops()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    console.log('🔌 Cleaning up shop change listener')
    const index = shopEvents.listeners.indexOf(handleShopChange)
    if (index !== -1) {
      shopEvents.listeners.splice(index, 1)
    }
    clearHighlight()
  })

  return {
    // Data
    shops,
    loading: isLoading,
    highlightedShopId,
    
    // Methods
    fetchShops,
    addShopToList,
    deleteShop,
    highlightShop,
    clearHighlight
  }
}

// Utility function to trigger shop refresh from anywhere in the app
export const triggerShopRefresh = () => {
  emitShopChange('refresh', null)
}