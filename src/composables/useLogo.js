import { ref, computed } from 'vue'

export function useLogo() {
  
  // Helper function to extract domain from URL
  const getDomainFromUrl = (url) => {
    if (!url) return 'example.com'
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      return new URL(fullUrl).hostname
    } catch {
      return 'example.com'
    }
  }

  // Generate logo sources with fallback chain
  const getLogoSources = (url, customLogo = null, size = 48) => {
    const domain = getDomainFromUrl(url)
    
    const sources = []
    
    // 1. Custom logo (highest priority)
    if (customLogo?.trim()) {
      sources.push(customLogo)
    }
    
    // 2. Clearbit (high quality)
    sources.push(`https://logo.clearbit.com/${domain}?size=${size}&format=png`)
    
    // 3. DuckDuckGo (better than Google)
    sources.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`)
    
    // 4. Google favicon (last resort)
    sources.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`)
    
    // 5. Default fallback
    sources.push('/default-shop-icon.svg')
    
    return sources
  }

  // Get the primary logo URL (first in chain)
  const getLogoUrl = (url, customLogo = null, size = 48) => {
    const sources = getLogoSources(url, customLogo, size)
    return sources[0]
  }

  // Create error handler for automatic fallbacks
  const createLogoErrorHandler = (url, customLogo = null, size = 48) => {
    const sources = getLogoSources(url, customLogo, size)
    let currentIndex = 0
    
    return (event) => {
      const img = event.target
      currentIndex++
      
      if (currentIndex < sources.length) {
        console.log(`Logo failed, trying fallback ${currentIndex}:`, sources[currentIndex])
        img.src = sources[currentIndex]
      } else {
        console.error('All logo sources failed for:', url)
      }
    }
  }

  // Auto-update logo when URL changes (for forms)
  const deriveLogoFromUrl = (form, urlField = 'bean_url', logoField = 'shop_logo') => {
    const url = form[urlField]
    if (url?.trim()) {
      const domain = getDomainFromUrl(url)
      form[logoField] = `https://logo.clearbit.com/${domain}?size=128&format=png`
    } else {
      form[logoField] = null
    }
  }

  return {
    getDomainFromUrl,
    getLogoSources,
    getLogoUrl,
    createLogoErrorHandler,
    deriveLogoFromUrl
  }
}