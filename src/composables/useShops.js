// Create composables/useShops.js
import { ref } from 'vue'
import { useToast } from './useToast'

const shops = ref([])
const loading = ref(false)
const highlightedShopId = ref(null)

export function useShops() {
  const { success, error } = useToast()

  const fetchShops = async () => {
    loading.value = true
    try {
      const { supabase } = await import('../lib/supabase')
      
      const { data, error: fetchError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      shops.value = data || []
      console.log(`✅ Fetched ${shops.value.length} shops`)
      
    } catch (err) {
      console.error('❌ Error fetching shops:', err)
      error('Failed to load shops', 'Could not refresh shop list')
    } finally {
      loading.value = false
    }
  }

  const addShopToList = (newShop) => {
    const existingIndex = shops.value.findIndex(shop => shop.id === newShop.id)
    if (existingIndex !== -1) {
      shops.value[existingIndex] = newShop
    } else {
      shops.value.unshift(newShop)
    }
  }

  const highlightShop = (shopId) => {
    highlightedShopId.value = shopId
  }

  const clearHighlight = () => {
    highlightedShopId.value = null
  }

  return {
    shops,
    loading,
    highlightedShopId,
    fetchShops,
    addShopToList,
    highlightShop,
    clearHighlight
  }
}