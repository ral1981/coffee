import { ref, computed } from 'vue'

export function useCoffeeFormOptions(coffees) {
  
  // Generate shop name options from existing data
  const shopNameOptions = computed(() => {
    if (!coffees?.value) return []
    
    const shops = new Set()
    coffees.value.forEach(coffee => {
      if (coffee.shops?.name) shops.add(coffee.shops.name)
      if (coffee.shop_name) shops.add(coffee.shop_name)
    })
    
    return Array.from(shops).sort()
  })

  // Generate origin options from existing data
  const originOptions = computed(() => {
    if (!coffees?.value) return []
    
    const origins = new Set()
    coffees.value.forEach(coffee => {
      if (coffee.origin) origins.add(coffee.origin)
    })
    
    return Array.from(origins).sort()
  })

  // Generate region options from existing data
  const regionOptions = computed(() => {
    if (!coffees?.value) return []
    
    const regions = new Set()
    coffees.value.forEach(coffee => {
      if (coffee.region) regions.add(coffee.region)
    })
    
    return Array.from(regions).sort()
  })

  // Generate variety options from existing data
  const varietyOptions = computed(() => {
    if (!coffees?.value) return []
    
    const varieties = new Set()
    coffees.value.forEach(coffee => {
      if (coffee.botanic_variety) {
        // Split on common delimiters and add each variety
        coffee.botanic_variety.split(/[,;&]/).forEach(variety => {
          const trimmed = variety.trim()
          if (trimmed) varieties.add(trimmed)
        })
      }
    })
    
    return Array.from(varieties).sort()
  })

  // Generate processing method options
  const processingOptions = computed(() => {
    if (!coffees?.value) return []
    
    const methods = new Set()
    coffees.value.forEach(coffee => {
      if (coffee.processing_method) {
        coffee.processing_method.split(/[,;&]/).forEach(method => {
          const trimmed = method.trim()
          if (trimmed) methods.add(trimmed)
        })
      }
    })
    
    return Array.from(methods).sort()
  })

  // Fetch additional options from database
  const fetchOptionsFromDatabase = async () => {
    try {
      const { supabase } = await import('../lib/supabase')
      
      // Get unique shop names
      const { data: shops } = await supabase
        .from('coffee_beans')
        .select('shop_name')
        .not('shop_name', 'is', null)
        .neq('shop_name', '')
      
      // Get unique origins
      const { data: origins } = await supabase
        .from('coffee_beans')
        .select('origin')
        .not('origin', 'is', null)
        .neq('origin', '')
      
      // Get unique regions
      const { data: regions } = await supabase
        .from('coffee_beans')
        .select('region')
        .not('region', 'is', null)
        .neq('region', '')
      
      return {
        shops: shops ? Array.from(new Set(shops.map(s => s.shop_name))).sort() : [],
        origins: origins ? Array.from(new Set(origins.map(o => o.origin))).sort() : [],
        regions: regions ? Array.from(new Set(regions.map(r => r.region))).sort() : []
      }
      
    } catch (error) {
      console.error('Error fetching options from database:', error)
      return { shops: [], origins: [], regions: [] }
    }
  }

  // Common processing methods (static list)
  const commonProcessingMethods = [
    'Washed',
    'Natural',
    'Honey',
    'Semi-washed',
    'Wet hulled',
    'Anaerobic',
    'Carbonic maceration'
  ]

  // Common varieties (static list)
  const commonVarieties = [
    'Arabica',
    'Bourbon',
    'Typica',
    'Caturra',
    'Catuai',
    'Mundo Novo',
    'Pacamara',
    'Geisha',
    'SL28',
    'SL34',
    'Heirloom'
  ]

  return {
    // Computed options from data
    shopNameOptions,
    originOptions,
    regionOptions,
    varietyOptions,
    processingOptions,
    
    // Static options
    commonProcessingMethods,
    commonVarieties,
    
    // Database fetch
    fetchOptionsFromDatabase
  }
}