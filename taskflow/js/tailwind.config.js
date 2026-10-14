/*
  Configuração do Tailwind (carregada como script comum, depois do CDN).

  IDEIA CENTRAL: as cores NÃO são fixas. Cada nome (app, surface, line, ink...) aponta
  para uma variável CSS definida em css/styles.css. Quando a classe "dark" entra no <html>,
  as variáveis mudam e TODOS os componentes trocam de tema sem precisar de "dark:" em cada classe.

  Como usar nas classes:
    bg-app        → fundo da página          bg-surface → cards e painéis
    bg-subtle     → fundos sutis / hover     border-line → bordas
    text-ink      → texto principal          text-mute  → texto secundário
    bg-accent     → cor de destaque (configurável pelo usuário)
    text-accent-ink → texto na cor de destaque (mais claro no modo escuro)
*/
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        app: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        mute: 'rgb(var(--c-mute) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 1px 1px rgb(0 0 0 / 0.02)',
        pop: '0 12px 32px -8px rgb(0 0 0 / 0.25), 0 2px 6px rgb(0 0 0 / 0.08)',
      },
    },
  },
};
