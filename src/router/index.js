// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue' // adjust path to your view

const routes = [
  {
    path: '/coffee',
    name: 'Coffee',
    component: Home
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router