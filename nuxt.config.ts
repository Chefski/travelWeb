export default defineNuxtConfig({
  ssr: false,

  app: {
    baseURL: '/',
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  pages: true,

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint'
  ],

  colorMode: {
    classSuffix: '',
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  compatibilityDate: '2026-02-21'
});
