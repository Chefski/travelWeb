export default defineNuxtConfig({
  ssr: false,

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