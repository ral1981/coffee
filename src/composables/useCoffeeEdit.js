import { ref, reactive, computed } from 'vue'
import { useToast } from './useToast'
import { useLogo } from './useLogo'

export function useCoffeeEdit() {
  const { success, error, warning, info } = useToast()
  const { getLogoUrl } = useLogo()

  // Form state
  const form = reactive({
    name: '',
    bean_url: '',
    shop_name: '',
    origin: '',
    region: '',
    altitude_meters: '',
    botanic_variety: '',
    farm_producer: '',
    processing_method: '',
    sca: '',
    flavor: '',
    recipe_ratio: '',
    recipe_in_grams: null,
    recipe_out_grams: null,
    recipe_time_seconds: '',
    recipe_temperature_c: null,
    notes: ''
  })

  const originalForm = reactive({})

  // Validation
  const getValidationErrors = () => {
    const errors = []
    if (!form.name?.trim()) errors.push('Coffee name is required')
    if (!form.origin?.trim()) errors.push('Origin is required')
    if (!form.shop_name?.trim()) errors.push('Shop name is required')
    
    if (form.bean_url && !isValidUrl(form.bean_url)) {
      errors.push('Invalid URL format')
    }
    
    if (form.sca && (form.sca < 0 || form.sca > 100)) {
      errors.push('SCA score must be between 0 and 100')
    }
    
    return errors
  }

  const isFormValid = computed(() => getValidationErrors().length === 0)

  // Recipe calculations
  const recipeRatio = computed(() => {
    if (form.recipe_in_grams && form.recipe_out_grams && form.recipe_in_grams > 0) {
      return (form.recipe_out_grams / form.recipe_in_grams).toFixed(1)
    }
    return null
  })

  // URL validation
  const isValidUrl = (url) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(fullUrl)
      return true
    } catch {
      return false
    }
  }

  // Logo derivation
  const deriveShopLogo = (url) => {
    if (isValidUrl(url)) {
      return getLogoUrl(url)
    }
    return null
  }

  // Form management
  const populateForm = (coffeeData) => {
    Object.assign(form, {
      name: coffeeData.name || '',
      bean_url: coffeeData.shops?.url || coffeeData.bean_url || '',
      shop_name: coffeeData.shops?.name || coffeeData.shop_name || '',
      origin: coffeeData.origin || '',
      region: coffeeData.region || '',
      altitude_meters: coffeeData.altitude_meters || '',
      botanic_variety: coffeeData.botanic_variety || '',
      farm_producer: coffeeData.farm_producer || '',
      processing_method: coffeeData.processing_method || '',
      sca: coffeeData.sca || '',
      flavor: coffeeData.flavor || '',
      recipe_ratio: coffeeData.recipe_ratio || '',
      recipe_in_grams: coffeeData.recipe_in_grams || null,
      recipe_out_grams: coffeeData.recipe_out_grams || null,
      recipe_time_seconds: coffeeData.recipe_time_seconds || '',
      recipe_temperature_c: coffeeData.recipe_temperature_c || null,
      notes: coffeeData.notes || ''
    })
    
    // Store original values
    Object.assign(originalForm, form)
  }

  const resetForm = () => {
    Object.keys(form).forEach(key => {
      if (typeof form[key] === 'number') {
        form[key] = null
      } else {
        form[key] = ''
      }
    })
    Object.keys(originalForm).forEach(key => delete originalForm[key])
  }

  const hasChanges = computed(() => {
    return Object.keys(form).some(key => form[key] !== originalForm[key])
  })

  // Coffee save/update
  const saveCoffee = async (coffeeId = null, userId) => {
    if (!isFormValid.value) {
      const errors = getValidationErrors()
      error('Validation failed', errors[0])
      return { success: false, errors }
    }

    try {
      const { supabase } = await import('../lib/supabase')
      
      // Prepare coffee data
      const coffeeData = {
        name: form.name?.trim(),
        bean_url: form.bean_url?.trim() || null,
        shop_name: form.shop_name?.trim() || null,
        origin: form.origin?.trim() || null,
        region: form.region?.trim() || null,
        altitude_meters: form.altitude_meters?.trim() || null,
        botanic_variety: form.botanic_variety?.trim() || null,
        farm_producer: form.farm_producer?.trim() || null,
        processing_method: form.processing_method?.trim() || null,
        sca: form.sca?.trim() || null,
        flavor: form.flavor?.trim() || null,
        recipe_ratio: form.recipe_ratio?.trim() || null,
        recipe_in_grams: form.recipe_in_grams || null,
        recipe_out_grams: form.recipe_out_grams || null,
        recipe_time_seconds: form.recipe_time_seconds?.trim() || null,
        recipe_temperature_c: form.recipe_temperature_c || null,
        notes: form.notes?.trim() || null,
        user_id: userId,
        updated_at: new Date().toISOString()
      }

      let result
      const isUpdate = Boolean(coffeeId)

      if (isUpdate) {
        // Update existing coffee
        const { data, error: updateError } = await supabase
          .from('coffee_beans')
          .update(coffeeData)
          .eq('id', coffeeId)
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
        result = { success: true, data: data[0], isUpdate: true }
        
      } else {
        // Create new coffee
        const { data, error: insertError } = await supabase
          .from('coffee_beans')
          .insert([coffeeData])
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
        if (!data || data.length === 0) throw new Error('No data returned from insert')
        
        result = { success: true, data: data[0], isUpdate: false }
      }

      return result

    } catch (err) {
      console.error('Save error:', err)
      
      let errorMessage = 'Could not save coffee'
      if (err.message.includes('duplicate key')) {
        errorMessage = 'A coffee with this name already exists'
      } else if (err.message.includes('permission')) {
        errorMessage = 'You do not have permission to save this coffee'
      } else if (err.message.includes('network')) {
        errorMessage = 'Please check your connection and try again'
      }
      
      error('Save Failed', errorMessage)
      return { success: false, error: err.message }
    }
  }

  return {
    // Form state
    form,
    originalForm,
    
    // Validation
    isFormValid,
    getValidationErrors,
    hasChanges,
    
    // Recipe
    recipeRatio,
    
    // Utilities
    isValidUrl,
    deriveShopLogo,
    
    // Form management
    populateForm,
    resetForm,
    
    // Save
    saveCoffee
  }
}