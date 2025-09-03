import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'
import { useLogo } from '../composables/useLogo'

export class CoffeeService {
  constructor() {
    const { success, error, warning, info } = useToast()
    const { getLogoUrl } = useLogo()
    
    this.toast = { success, error, warning, info }
    this.getLogoUrl = getLogoUrl
  }

  /**
   * Handle shop creation/lookup for coffee operations
   * @param {string} shopName - The shop name
   * @param {string} beanUrl - The specific coffee bean URL (NOT the shop's main URL)
   * @returns {Promise<number>} - The shop ID
   */
  async handleShop(shopName, beanUrl) {
    if (!shopName?.trim()) {
      throw new Error('Shop name is required')
    }

    const trimmedShopName = shopName.trim()
    
    // 1. Check if shop exists
    const { data: existingShop, error: lookupError } = await supabase
      .from('shops')
      .select('id')
      .eq('name', trimmedShopName)
      .maybeSingle()
    
    if (lookupError) {
      throw new Error(`Shop lookup failed: ${lookupError.message}`)
    }
    
    if (existingShop) {
      // Shop exists - DO NOT UPDATE existing shops
      console.log('✅ Found existing shop:', existingShop.id, '- no modifications')
      return existingShop.id
    }
    
    // 2. Create new shop with domain extracted from beanUrl
    console.log('➕ Creating new shop:', trimmedShopName)
    
    let shopMainUrl = null
    let shopLogo = null
    
    if (beanUrl?.trim()) {
      try {
        // Extract domain from bean URL for shop's main website
        const fullBeanUrl = beanUrl.startsWith('http') ? beanUrl : `https://${beanUrl}`
        const urlObj = new URL(fullBeanUrl)
        shopMainUrl = `${urlObj.protocol}//${urlObj.hostname}`
        shopLogo = this.getLogoUrl(shopMainUrl, null, 128)
        
        console.log('🌐 Extracted shop URL:', shopMainUrl, 'from bean URL:', fullBeanUrl)
      } catch (urlError) {
        console.warn('⚠️ Failed to extract domain from bean URL:', urlError)
        // Continue without URL/logo
      }
    }
    
    const { data: newShop, error: createError } = await supabase
      .from('shops')
      .insert([{
        name: trimmedShopName,
        url: shopMainUrl,
        logo: shopLogo
      }])
      .select('id')
      .single()
    
    if (createError) {
      throw new Error(`Shop creation failed: ${createError.message}`)
    }
    
    console.log('✅ Created new shop:', newShop.id)
    return newShop.id
  }

  /**
   * Save or update a coffee
   * @param {Object} coffeeData - The coffee data
   * @param {string} userId - The user ID
   * @param {string|null} existingCoffeeId - ID if updating existing coffee
   * @returns {Promise<Object>} - Success/failure result with coffee data
   */
  async saveCoffee(coffeeData, userId, existingCoffeeId = null) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      // Handle shop first
      const shopId = await this.handleShop(coffeeData.shop_name, coffeeData.bean_url)

      // Prepare coffee payload
      const coffeePayload = {
        name: coffeeData.name?.trim(),
        bean_url: coffeeData.bean_url?.trim() || null,
        shop_name: coffeeData.shop_name?.trim() || null,
        shop_id: shopId, // Required field
        origin: coffeeData.origin?.trim() || null,
        region: coffeeData.region?.trim() || null,
        altitude_meters: coffeeData.altitude_meters?.trim() || null,
        botanic_variety: coffeeData.botanic_variety?.trim() || null,
        farm_producer: coffeeData.farm_producer?.trim() || null,
        processing_method: coffeeData.processing_method?.trim() || null,
        sca: coffeeData.sca ? parseFloat(coffeeData.sca) : null,
        flavor: coffeeData.flavor?.trim() || null,
        recipe_ratio: coffeeData.recipe_ratio?.trim() || null,
        recipe_in_grams: coffeeData.recipe_in_grams || null,
        recipe_out_grams: coffeeData.recipe_out_grams || null,
        recipe_time_seconds: coffeeData.recipe_time_seconds?.trim() || null,
        recipe_temperature_c: coffeeData.recipe_temperature_c || null,
        notes: coffeeData.notes?.trim() || null,
        user_id: userId,
        updated_at: new Date().toISOString()
      }

      let result
      const isUpdate = Boolean(existingCoffeeId)

      if (isUpdate) {
        // Update existing coffee
        const { data, error: updateError } = await supabase
          .from('coffee_beans')
          .update(coffeePayload)
          .eq('id', existingCoffeeId)
          .eq('user_id', userId)
          .select(`
            *,
            shops (
              id,
              name,
              url,
              logo
            )
          `)
        
        if (updateError) throw updateError
        if (!data || data.length === 0) {
          throw new Error('No coffee was updated. Check permissions.')
        }
        
        result = { success: true, data: data[0], isUpdate: true }
        
      } else {
        // Create new coffee
        const { data, error: insertError } = await supabase
          .from('coffee_beans')
          .insert([coffeePayload])
          .select(`
            *,
            shops (
              id,
              name,
              url,
              logo
            )
          `)
        
        if (insertError) throw insertError
        if (!data || data.length === 0) {
          throw new Error('No data returned from coffee creation')
        }
        
        result = { success: true, data: data[0], isUpdate: false }
      }

      return result

    } catch (err) {
      console.error('💥 CoffeeService save error:', err)
      
      let errorMessage = 'Could not save coffee'
      if (err.message.includes('duplicate key') || err.code === '23505') {
        errorMessage = 'A coffee with this name already exists'
      } else if (err.message.includes('permission') || err.code === '42501') {
        errorMessage = 'You do not have permission to save this coffee'
      } else if (err.message.includes('network')) {
        errorMessage = 'Please check your connection and try again'
      } else {
        errorMessage = err.message
      }
      
      this.toast.error('Save Failed', errorMessage)
      return { success: false, error: err.message }
    }
  }

  /**
   * Delete a coffee
   * @param {string} coffeeId - The coffee ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Success/failure result
   */
  async deleteCoffee(coffeeId, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const { error } = await supabase
        .from('coffee_beans')
        .delete()
        .eq('id', coffeeId)
        .eq('user_id', userId)

      if (error) throw error

      this.toast.success('Coffee Deleted', 'Coffee entry has been deleted successfully')
      return { success: true }

    } catch (err) {
      console.error('💥 CoffeeService delete error:', err)
      this.toast.error('Delete Failed', err.message)
      return { success: false, error: err.message }
    }
  }
}

// Create singleton instance
export const coffeeService = new CoffeeService()