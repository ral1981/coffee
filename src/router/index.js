// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const routes = [
  {
    path: '/coffee',
    name: 'Coffee',
    component: App
  },
  {
    path: '/',
    redirect: '/coffee'  // Redirect root to /coffee
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router