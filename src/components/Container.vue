<template>
  <button
    @click="handleClick"
    :disabled="!isLoggedIn"
    :class="[
      'm-1 px-2 py-1 rounded text-sm transition flex items-center gap-2',
      assigned ? 'bg-green-100' : 'bg-white',
      colorClass,
      !isLoggedIn ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
    ]"
  >
    <span class="w-6 h-6" v-html="iconSvg" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import rawSvg from '../assets/icons/bag_03.svg?raw'

const props = defineProps({
  color: {
    type: String,
    required: true // 'green' or 'grey'
  },
  assigned: Boolean,
  activeCoffee: Object,
  coffee: Object,
  isLoggedIn: Boolean
})

const emit = defineEmits(['update-container'])

const colorClass = computed(() =>
  props.color === 'green' ? 'text-green-600' : 'text-gray-500'
)

const iconSvg = computed(() =>
  rawSvg.replace('<svg', '<svg class="w-6 h-6"')
)

function handleClick() {
  if (!props.isLoggedIn) return

  if (props.assigned) {
    emit('update-container', { coffee: props.coffee, container: props.color, assign: false })
    return
  }

  const otherCoffee = props.activeCoffee
  if (otherCoffee && otherCoffee.id !== props.coffee.id) {
    const confirmText = `Container "${props.color}" is already used by "${otherCoffee.name}". Replace it?`
    if (!confirm(confirmText)) return
  }

  emit('update-container', { coffee: props.coffee, container: props.color, assign: true })
}
console.log('props:', props)
</script>
