import { reactive, watch, computed } from 'vue'
import { supabase } from '../lib/supabase'

export function useCoffeeForm({
  initialData = {},
  mode = 'add',        // 'add' or 'edit'
  emit,                // defineEmits() from the component
  onClose,             // callback to hide the form UI
  fetchCoffees,        // optional: refresh parent list
}) {
  // Default values
  const defaults = {
    name: '',
    shop_url: '',
    shop_name: '',
    shop_logo: '',
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
    notes: '',
    in_green_container: false,
    in_grey_container: false,
  }

  // reactive form state
  const form = reactive({ 
    ...defaults,
    ...initialData,      // for edit, seed existing values
  })

  function isPositiveNumber(value) {
    return value === null || value === '' || (!isNaN(value) && Number(value) > 0)
  }

  function isFloatInRange(value, min, max) {
    if (value === null || value === '') return true
    const num = parseFloat(value)
    return !isNaN(num) && num >= min && num <= max
  }

  function isAltitudeFormat(value) {
    if (value === '') return true
    return /^\d{3,4}(–\d{3,4})?$/.test(value.trim())
  }

  function isTimeFormat(value) {
    if (value === '') return true
    return /^\d+$|^\d{1,2}:\d{2}$/.test(value.trim())
  }

  // Auto-derive shop info from URL
  const deriveShopInfo = () => {
    const url = form.shop_url
    if (!url) {
      form.shop_name = ''
      form.shop_logo = ''
      return
    }
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`)
      form.shop_url  = u.href
      form.shop_name = u.hostname.replace('www.', '').split('.')[0]
      form.shop_logo = `https://www.google.com/s2/favicons?domain=${u.hostname}`
    } catch {
      form.shop_name = ''
      form.shop_logo = ''
    }
  }

  // Watch shop_url changes
  watch(
    () => form.shop_url,
    deriveShopInfo,
    { immediate: true }
  )

  function validUrl(value) {
    if (!value) return false
    try {
      new URL(value.startsWith('http') ? value : `https://${value}`)
      return true
    } catch {
      return false
    }
  }

  const recipeRatio = computed(() => {
    const i = parseFloat(form.recipe_in_grams)
    const o = parseFloat(form.recipe_out_grams)
    return i && o ? (o / i).toFixed(2) : ''
  })

  const isFormValid = computed(() => {
    return (
      form.name.trim().length > 0 &&
      validUrl(form.shop_url) &&
      form.origin.trim().length > 0 &&
      isPositiveNumber(form.recipe_in_grams) &&
      isPositiveNumber(form.recipe_out_grams) &&
      isAltitudeFormat(form.altitude_meters) &&
      isTimeFormat(form.recipe_time_seconds) &&
      (form.sca === '' || form.sca === null || (isFloatInRange(form.sca, 0, 100)))
    )
  })

  const resetForm = () => {
    Object.assign(form, { ...defaults, ...initialData })
  }

  const save = async () => {
    if (!isFormValid.value) {
      alert('❌ Please fill in all required fields correctly.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('❌ You must be logged in to save coffee.')
      return
    }

    // Set the recipe ratio
    form.recipe_ratio = recipeRatio.value

    const payload = { 
      ...JSON.parse(JSON.stringify(form)), 
      user_id: user.id 
    }

    let result
    if (mode === 'add') {
      result = await supabase.from('coffee_beans').insert(payload).select()
    } else {
      result = await supabase
        .from('coffee_beans')
        .update(payload)
        .eq('id', initialData.id)
        .select()
    }

    if (result.error) {
      alert(`❌ Failed to ${mode === 'add' ? 'add' : 'save'} coffee: ${result.error.message}`)
    } else {
      alert(`✅ Coffee ${mode === 'add' ? 'added' : 'saved'}!`)
      emit(mode === 'add' ? 'coffee-saved' : 'coffee-updated', result.data[0])
      onClose?.()
      fetchCoffees?.()
    }
  }

  const cancel = () => {
    const msg = mode === 'add'
      ? 'Are you sure you want to discard this coffee entry?'
      : 'Discard all changes?'
    if (!confirm(msg)) return
    
    resetForm()
    onClose?.()
    emit('cancel')
  }

  return {
    form,
    recipeRatio,
    isFormValid,
    save,
    cancel,
    resetForm,
    validUrl,
    deriveShopInfo
  }
}