export default defineNuxtConfig({
  ssr: true,

  nitro: {
    preset: 'github-pages'
  },

  app: {
    baseURL: '/travelWeb/'
  },

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@pinia/nuxt'
  ],

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  compatibilityDate: '2026-02-21'
})