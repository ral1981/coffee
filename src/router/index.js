// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue' // adjust path to your view

const routes = [
  {
    path: '/',
    name: 'Home',
    component: App
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router