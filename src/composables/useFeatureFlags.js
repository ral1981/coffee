import { ref } from 'vue'

export function useFeatureFlags() {
  const flags = ref({
    newUI: true, // Set to true to enable new UI
    expandableCards: true,
    mobileNavigation: true
  })
  
  return { flags }
}