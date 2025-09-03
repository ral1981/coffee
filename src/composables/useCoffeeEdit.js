// Updated useCoffeeEdit.js - Now uses the unified CoffeeService
import { ref, reactive, computed } from 'vue'
import { coffeeService } from '../services/coffeeService'
import { useLogo } from './useLogo'

export function useCoffeeEdit() {
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
    if (!url) return true // Allow empty URLs
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(fullUrl)
      return true
    } catch {
      return false
    }
  }

  // Derive shop logo from URL
  const deriveShopLogo = () => {
    if (form.bean_url && isValidUrl(form.bean_url)) {
      try {
        const logoUrl = getLogoUrl(form.bean_url)
        console.log('Derived logo URL:', logoUrl)
        return logoUrl
      } catch (err) {
        console.warn('Failed to derive logo:', err)
        return null
      }
    }
    return null
  }

  // Populate form with data (for edit mode)
  const populateForm = (data) => {
    console.log('Populating form with data:', data)
    Object.keys(form).forEach(key => {
      if (data[key] !== undefined) {
        form[key] = data[key]
      }
    })
    // Store original values for change detection
    Object.assign(originalForm, { ...form })
  }

  // Reset form
  const resetForm = () => {
    Object.keys(form).forEach(key => {
      form[key] = ''
    })
    // Clear numeric fields
    form.recipe_in_grams = null
    form.recipe_out_grams = null
    form.recipe_temperature_c = null
    form.sca = ''
  }

  // Check if form has changes
  const hasChanges = computed(() => {
    return Object.keys(form).some(key => form[key] !== originalForm[key])
  })

  // Save coffee using the unified service
  const saveCoffee = async (existingId = null, userId) => {
    console.log('💾 Using CoffeeService to save coffee')
    
    // Use the unified CoffeeService - single point of truth
    return await coffeeService.saveCoffee(form, userId, existingId)
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
    
    // Save (now uses unified service)
    saveCoffee
  }
}