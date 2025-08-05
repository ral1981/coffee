import { reactive, watch, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'
import { useLogo } from './useLogo'

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
  const { success, error, warning } = useToast()
  const { getLogoUrl } = useLogo()

  // Default form fields
  const defaults = { name: '', url: '', logo: '' }
  const form = reactive({ 
    ...defaults,
    ...(initialData || {})      // for edit mode, seed existing values
  })

  // Store the original values for change detection
  const originalValues = { ...form }

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
        logo: form.logo 
      }

      if (mode === 'add') {
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
      error('Save failed', err.message)
    }
  }

  // Cancel handler with improved change detection
  const cancel = (skipChangeCheck = false) => {
    if (!skipChangeCheck) {
      // Check for changes by comparing current form values with original values
      const hasChanges = Object.keys(form).some(key => {
        const currentValue = form[key] || ''
        const originalValue = originalValues[key] || ''
        return currentValue.toString().trim() !== originalValue.toString().trim()
      })

      console.log('Change detection debug:', {
        hasChanges,
        currentForm: { ...form },
        originalValues: { ...originalValues },
        mode
      })

      if (hasChanges) {
        const msg = mode === 'add'
          ? 'Are you sure you want to discard this shop entry?'
          : 'Discard all changes?'
        
        if (!confirm(msg)) {
          return
        }
      }
    }

    onClose?.()
    emit('cancel')
  }

  return { form, isFormValid, save, cancel, validUrl }
}