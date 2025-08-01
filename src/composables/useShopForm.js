import { reactive, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'

/**
 * Composable for adding a coffee shop.
 * Emits 'shop-saved' on success and 'cancel' on cancel.
 */
export function useShopForm({ emit, onClose, fetchShops }) {
  const { success, error, warning } = useToast()

  // Default form fields
  const defaults = { name: '', url: '', logo: '' }
  const form = reactive({ ...defaults })

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

  // Derive favicon based on URL
  const deriveLogo = () => {
    if (!form.url) {
      form.logo = ''
      return
    }
    try {
      const u = new URL(form.url.startsWith('http') ? form.url : `https://${form.url}`)
      form.url = u.href
      form.logo = `https://www.google.com/s2/favicons?domain=${u.hostname}`
    } catch {
      form.logo = ''
      warning('Invalid URL', 'Please enter a valid shop URL')
    }
  }

  // Watch for URL changes to update favicon
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

  const isFormValid = () => getValidationErrors().length === 0

  // Save handler: checks uniqueness and inserts
  const save = async () => {
    const errs = getValidationErrors()
    if (errs.length) {
      error('Validation failed', errs[0])
      return
    }

    try {
      const shopName = form.name.trim()

      // 1. Check for existing shop by name
      const { data: existing, error: fetchErr } = await supabase
        .from('shops')
        .select('id')
        .eq('name', shopName)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (existing) {
        warning('Duplicate shop', 'A shop with this name already exists')
        return
      }

      // 2. Insert new shop
      const { data: newShop, error: insertErr } = await supabase
        .from('shops')
        .insert({ name: shopName, url: form.url, logo: form.logo })
        .select()
      if (insertErr) throw insertErr

      success('Shop added', `${newShop[0].name} has been added successfully`)
      emit('shop-saved', newShop[0])
      onClose?.()
      if (fetchShops) await fetchShops()
    } catch (err) {
      console.error('Error adding shop:', err)
      error('Save failed', err.message)
    }
  }

  // Cancel handler
  const cancel = () => {
    onClose?.()
    emit('cancel')
  }

  return { form, isFormValid, save, cancel }
}