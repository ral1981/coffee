import { reactive, watch, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'
import { useLogo } from './useLogo'
import { useAuth } from './useAuth'

/**
 * Composable for adding or editing a coffee shop.
 * Emits 'shop-saved' or 'shop-updated' on success and 'cancel' on cancel.
 */
export function useShopForm({ 
  initialData = {}, 
  mode = 'add',      // 'add' or 'edit'
  emit, 
  onClose, 
  fetchShops 
} = {}) {
  const { success, error, warning, info } = useToast()
  const { getLogoUrl } = useLogo()
  const { user, isLoggedIn } = useAuth()

  // Default form fields
  const defaults = { name: '', url: '', logo: '' }
  const form = reactive({ 
    ...defaults,
    ...(initialData || {})      // for edit mode, seed existing values
  })

  // Store the original values for change detection - create a deep copy
  const originalValues = reactive({ ...form })

  // Function to reset original values (for when form data changes externally)
  const resetOriginalValues = () => {
    Object.keys(form).forEach(key => {
      originalValues[key] = form[key]
    })
    console.log('Original values reset to:', { ...originalValues })
  }

  // URL validation helper
  const validUrl = (value) => {
    if (!value) return false
    try {
      new URL(value.startsWith('http') ? value : `https://${value}`)
      return true
    } catch {
      return false
    }
  }

  // Derive logo
  const deriveLogo = () => {
    if (!form.url) {
      form.logo = ''
      return
    }
    try {
      const u = new URL(form.url.startsWith('http') ? form.url : `https://${form.url}`)
      form.url = u.href
      form.logo = getLogoUrl(form.url, null, 128)
    } catch {
      form.logo = ''
      warning('Invalid URL', 'Please enter a valid shop URL')
    }
  }

  // Watch for URL changes to update logo
  watch(
    () => form.url,
    (newUrl, oldUrl) => {
      if (newUrl && newUrl !== oldUrl) deriveLogo()
    },
    { immediate: true }
  )

  // Collect validation errors
  const getValidationErrors = () => {
    const errs = []
    if (!form.name.trim()) errs.push('Shop name is required')
    if (!validUrl(form.url)) errs.push('Valid shop URL is required')
    return errs
  }
 
  const isFormValid = computed(() => getValidationErrors().length === 0)

  // Save handler: checks uniqueness and inserts/updates
  const save = async () => {
    if (!isFormValid.value) {
      error('Validation failed', getValidationErrors()[0])
      return
    }

    // Check authentication
    if (!isLoggedIn.value) {
      warning('Authentication required', 'Please log in to save shops')
      return
    }

    try {
      const shopName = form.name.trim()

      // 1. Check for existing shop by name (exclude current shop in edit mode)
      let query = supabase
        .from('shops')
        .select('id')
        .eq('name', shopName)
        
      if (mode === 'edit' && initialData.id) {
        query = query.neq('id', initialData.id)
      }
      
      const { data: existing, error: fetchErr } = await query.maybeSingle()
      if (fetchErr) throw fetchErr
      if (existing) {
        warning('Duplicate shop', 'A shop with this name already exists')
        return
      }

      // 2. Insert or update shop
      let result
      const payload = { 
        name: shopName, 
        url: form.url, 
        logo: form.logo,
        updated_at: new Date().toISOString()
      }

      if (mode === 'add') {
        payload.created_at = new Date().toISOString()
        
        result = await supabase
          .from('shops')
          .insert(payload)
          .select()
      } else {
        result = await supabase
          .from('shops')
          .update(payload)
          .eq('id', initialData.id)
          .select()
      }

      if (result.error) throw result.error
      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from database operation')
      }

      const actionText = mode === 'add' ? 'added' : 'updated'
      const shopData = result.data[0]

      success(
        `Shop ${actionText}`, 
        `${shopData.name} has been ${actionText} successfully`
      )
      
      emit(mode === 'add' ? 'shop-saved' : 'shop-updated', shopData)
      
      if (fetchShops) {
        await fetchShops()
      }
      cancel(true) // Skip change check since we just saved successfully

    } catch (err) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} shop:`, err)
      
      let errorMessage = err.message
      if (err.message.includes('duplicate key')) {
        errorMessage = 'A shop with this name already exists'
      } else if (err.message.includes('permission')) {
        errorMessage = 'You do not have permission to save this shop'
      } else if (err.message.includes('network')) {
        errorMessage = 'Please check your connection and try again'
      }
      
      error('Save failed', errorMessage)
    }
  }

  const cancel = async (skipChangeCheck = false) => {
    console.log('=== CANCEL DEBUG START ===')
    console.log('Cancel called with skipChangeCheck:', skipChangeCheck)
    console.log('Current form values:', { ...form })
    console.log('Original values:', { ...originalValues })
    console.log('Mode:', mode)
    
    // Always show a notification for edit mode, regardless of change detection
    if (mode === 'edit' && !skipChangeCheck) {
      console.log('Edit mode: showing changes discarded notification')
      warning('Changes discarded', 'Edit mode cancelled')
    } else if (mode === 'add' && !skipChangeCheck) {
      console.log('Add mode: showing entry cancelled notification') 
      info('Entry cancelled', 'New shop entry cancelled')
    }

    console.log('Calling onClose and emitting cancel after 150ms delay')
    
    // Use setTimeout to ensure the toast notification displays before closing
    setTimeout(() => {
      console.log('Executing onClose and emit cancel')
      onClose?.()
      emit('cancel')
    }, 150)
    
    console.log('=== CANCEL DEBUG END ===')
  }

  return { 
    form, 
    isFormValid, 
    save, 
    cancel, 
    validUrl,
    resetOriginalValues  // Expose this function so external components can reset the baseline
  }
}