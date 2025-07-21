import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '../style.css'

import * as lucide from 'lucide-vue-next'

const app = createApp(App)

for (const [name, component] of Object.entries(lucide)) {
  app.component(name, component)
}

app.use(router)

app.mount('#app')
