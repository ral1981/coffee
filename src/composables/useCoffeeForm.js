import { reactive, ref, watch, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'
import { useLogo } from './useLogo'

export function useCoffeeForm({
  initialData = {},
  mode = 'add',        // 'add' or 'edit'
  emit,                // defineEmits() from the component
  onClose,             // callback to hide the form UI
  fetchCoffees,        // optional: refresh parent list
}) {
  // Toast composable
  const { success, error, warning, info } = useToast()
  const { getLogoUrl } = useLogo()

  // Default values
  const defaults = {
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
    notes: '',
    in_green_container: false,
    in_grey_container: false,
  }

  // reactive form state
  const form = reactive({ 
    ...defaults,
    ...initialData,      // for edit, seed existing values
  })

  const shopNameOptions = ref([])
  const originOptions   = ref([])

  // helper: fetch distinct shop names & origins
  const fetchSuggestions = async () => {
    try {
      // get all shop_name values
      const { data: shops, error: shopErr } = await supabase
        .from('coffee_beans')
        .select('shop_name')
        .neq('shop_name', '')
      
      if (shopErr) {
        console.error('Error fetching shop suggestions:', shopErr)
        warning('Suggestions unavailable', 'Could not load shop name suggestions')
      } else {
        // unique & filter out empty/null
        shopNameOptions.value = Array.from(
          new Set(shops.map(r => r.shop_name).filter(Boolean))
        )
      }

      // get all origin values
      const { data: origins, error: originErr } = await supabase
        .from('coffee_beans')
        .select('origin')
        .neq('origin', '')
      
      if (originErr) {
        console.error('Error fetching origin suggestions:', originErr)
        warning('Suggestions unavailable', 'Could not load origin suggestions')
      } else {
        originOptions.value = Array.from(
          new Set(origins.map(r => r.origin).filter(Boolean))
        )
      }
    } catch (err) {
      console.error('Error in fetchSuggestions:', err)
      error('Data loading failed', 'Could not load form suggestions')
    }
  }

  // fetch once when form is mounted
  onMounted(fetchSuggestions)

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
    const isValid = /^\d{3,4}(–\d{3,4})?$/.test(value.trim())
    if (!isValid && value.trim()) {
      warning('Invalid altitude format', 'Use format: 1200 or 1200–1400')
    }
    return isValid
  }

  function isTimeFormat(value) {
    if (value === '') return true
    const isValid = /^\d+$|^\d{1,2}:\d{2}$/.test(value.trim())
    if (!isValid && value.trim()) {
      warning('Invalid time format', 'Use seconds (30) or minutes:seconds (2:30)')
    }
    return isValid
  }

  // Auto-derive shop logo from URL using new logo system
  const deriveShopLogo = () => {
    const url = form.bean_url
    if (!url) {
      // Don't set shop_logo since it doesn't exist in coffee_beans table
      return
    }
    
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`)
      form.bean_url = u.href
      // Note: Logo will be handled in the shops table during save
      // No need to set form.shop_logo as it doesn't exist in coffee_beans
    } catch (err) {
      warning('Invalid URL', 'Please enter a valid website URL')
    }
  }

  // Watch bean_url changes (only for logo derivation)
  watch(
    () => form.bean_url,
    (newUrl, oldUrl) => {
      // Only show feedback if URL actually changed and is not empty
      if (newUrl && newUrl !== oldUrl) {
        deriveShopLogo()
      }
    },
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
    if (i && o) {
      const ratio = (o / i).toFixed(2)
      // Optional: Show ratio feedback when both values are present
      // info('Ratio calculated', `Coffee ratio: 1:${ratio}`)
      return ratio
    }
    return ''
  })

  // Enhanced validation with detailed feedback
  const getValidationErrors = () => {
    const errors = []
    
    if (!form.name.trim()) errors.push('Coffee name is required')
    if (!form.shop_name.trim()) errors.push('Shop name is required')
    if (!validUrl(form.bean_url)) errors.push('Valid shop URL is required')
    if (!form.origin.trim()) errors.push('Origin is required')
    if (!isPositiveNumber(form.recipe_in_grams)) errors.push('Recipe input must be a positive number')
    if (!isPositiveNumber(form.recipe_out_grams)) errors.push('Recipe output must be a positive number')
    if (!isAltitudeFormat(form.altitude_meters)) errors.push('Invalid altitude format')
    if (!isTimeFormat(form.recipe_time_seconds)) errors.push('Invalid time format')
    if (form.sca && !isFloatInRange(form.sca, 0, 100)) errors.push('SCA score must be between 0-100')
    
    return errors
  }

  const isFormValid = computed(() => {
    return getValidationErrors().length === 0
  })

  const resetForm = () => {
    Object.assign(form, { ...defaults, ...initialData })
    // Removed toast notification from resetForm to prevent duplicate notifications
  }

  const save = async () => {
    const validationErrors = getValidationErrors();
    if (validationErrors.length > 0) {
      error('Validation failed', validationErrors[0]);
      console.log('All validation errors:', validationErrors);
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Authentication error: ' + userError.message);
      if (!user) {
        warning('Authentication required', 'Please log in to save coffee');
        return;
      }

      info('Saving...', `${mode === 'add' ? 'Adding' : 'Updating'} coffee entry`);

      // clone form into payload + user_id
      const payload = {
        ...JSON.parse(JSON.stringify(form)),
        user_id: user.id,
      };

      if (mode === 'add') {
        // 1. Normalize shop name and full URL
        const shopName = form.shop_name.trim();
        const rawUrl = form.bean_url.startsWith('http')
          ? form.bean_url
          : `https://${form.bean_url}`;
        const shopUrl = new URL(rawUrl).href;

        // 2. Use new logo system instead of Google favicon
        const logo = getLogoUrl(shopUrl, null, 128);

        // 3. Check for existing shop by name
        const { data: existingShop, error: fetchErr } = await supabase
          .from('shops')
          .select('id')
          .eq('name', shopName)
          .maybeSingle();
        if (fetchErr) throw new Error('Error checking shop: ' + fetchErr.message);

        let shopId;
        if (existingShop) {
          shopId = existingShop.id;
        } else {
          // 4. Insert new shop row with high-quality logo
          const { data: newShop, error: insertErr } = await supabase
            .from('shops')
            .insert({
              name: shopName,
              url: shopUrl,
              logo: logo,
            })
            .select('id')
            .single();
          if (insertErr) throw new Error('Error inserting shop: ' + insertErr.message);
          shopId = newShop.id;
        }

        // 5. Attach FK and remove now-duplicated fields
        payload.shop_id = shopId;
        delete payload.shop_name;
        delete payload.shop_logo;
      } else {
        // EDIT MODE: Handle shop updates
        const shopName = form.shop_name.trim();
        const rawUrl = form.bean_url.startsWith('http')
          ? form.bean_url
          : `https://${form.bean_url}`;
        const shopUrl = new URL(rawUrl).href;

        // Get current coffee's shop_id
        const { data: currentCoffee, error: fetchErr } = await supabase
          .from('coffee_beans')
          .select('shop_id')
          .eq('id', initialData.id)
          .single();
        
        if (fetchErr) throw new Error('Error fetching current coffee: ' + fetchErr.message);

        // Check if shop name or URL changed
        const { data: currentShop, error: shopFetchErr } = await supabase
          .from('shops')
          .select('name, url')
          .eq('id', currentCoffee.shop_id)
          .single();
        
        if (shopFetchErr) throw new Error('Error fetching current shop: ' + shopFetchErr.message);

        // If shop details changed, update the shop or create new one
        if (currentShop.name !== shopName || currentShop.url !== shopUrl) {
          // Check if a shop with this name already exists (different from current)
          const { data: existingShop, error: existingErr } = await supabase
            .from('shops')
            .select('id')
            .eq('name', shopName)
            .neq('id', currentCoffee.shop_id)
            .maybeSingle();
          
          if (existingErr) throw new Error('Error checking existing shop: ' + existingErr.message);

          let shopId;
          if (existingShop) {
            // Use existing shop
            shopId = existingShop.id;
          } else {
            // Update current shop or create new one
            const logo = getLogoUrl(shopUrl, null, 128);
            
            // Update the existing shop
            const { error: updateErr } = await supabase
              .from('shops')
              .update({
                name: shopName,
                url: shopUrl,
                logo: logo,
              })
              .eq('id', currentCoffee.shop_id);
            
            if (updateErr) throw new Error('Error updating shop: ' + updateErr.message);
            shopId = currentCoffee.shop_id;
          }
          
          payload.shop_id = shopId;
        }

        // Remove shop fields that don't belong in coffee_beans table
        delete payload.shop_name;
        delete payload.shop_logo;
      }

      // 6. Insert or update the bean - IMPORTANT: Include shops relationship in select
      let result;
      if (mode === 'add') {
        result = await supabase
          .from('coffee_beans')
          .insert(payload)
          .select(`
            *,
            shops (
              id,
              name,
              url,
              logo
            )
          `);
      } else {
        result = await supabase
          .from('coffee_beans')
          .update(payload)
          .eq('id', initialData.id)
          .select(`
            *,
            shops (
              id,
              name,
              url,
              logo
            )
          `);
      }

      if (result.error) throw new Error(result.error.message);

      const actionText = mode === 'add' ? 'added' : 'updated';
      const savedCoffee = result.data[0];
      const coffeeName = savedCoffee?.name || 'Coffee';

      success(
        `Coffee ${actionText}!`,
        `${coffeeName} has been ${actionText} successfully`
      );

      // Emit the complete coffee object with shop relationship
      emit(mode === 'add' ? 'coffee-saved' : 'coffee-updated', savedCoffee);
      
      onClose?.();
      
      // Don't call fetchCoffees here - let the parent handle the refresh
      // if (fetchCoffees) await fetchCoffees();
      
    } catch (err) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} coffee:`, err);
      error(
        'Save failed',
        `Could not ${mode === 'add' ? 'add' : 'update'} coffee: ${err.message}`
      );
    }
  };

  const cancel = () => {
    const hasChanges = Object.keys(form).some(key => {
      const currentValue = form[key]
      const initialValue = initialData[key] || defaults[key]
      return currentValue !== initialValue
    })

    if (hasChanges) {
      const msg = mode === 'add'
        ? 'Are you sure you want to discard this coffee entry?'
        : 'Discard all changes?'
      
      if (!confirm(msg)) {
        return
      }
      
      warning(
        'Changes discarded', 
        mode === 'add' ? 'New coffee entry cancelled' : 'Changes reverted'
      )
    } else {
      info(
        'Form closed', 
        mode === 'add' ? 'Add coffee cancelled' : 'Edit mode closed'
      )
    }
    
    resetForm()
    onClose?.()
    emit('cancel')
  }

  // Auto-save draft functionality (optional)
  const saveDraft = () => {
    try {
      const draftKey = mode === 'add' ? 'coffee-form-draft' : `coffee-edit-draft-${initialData.id}`
      localStorage.setItem(draftKey, JSON.stringify(form))
      info('Draft saved', 'Your progress has been saved locally')
    } catch (err) {
      console.error('Error saving draft:', err)
      warning('Draft save failed', 'Could not save progress locally')
    }
  }

  const loadDraft = () => {
    try {
      const draftKey = mode === 'add' ? 'coffee-form-draft' : `coffee-edit-draft-${initialData.id}`
      const draft = localStorage.getItem(draftKey)
      
      if (draft) {
        const draftData = JSON.parse(draft)
        Object.assign(form, draftData)
        success('Draft restored', 'Your previous progress has been loaded')
        localStorage.removeItem(draftKey)
        return true
      }
      return false
    } catch (err) {
      console.error('Error loading draft:', err)
      warning('Draft load failed', 'Could not restore previous progress')
      return false
    }
  }

  return {
    form,
    recipeRatio,
    isFormValid,
    getValidationErrors,
    save,
    cancel,
    resetForm,
    validUrl,
    deriveShopLogo,
    shopNameOptions,
    originOptions,
    saveDraft,
    loadDraft
  }
}