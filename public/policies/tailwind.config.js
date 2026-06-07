module.exports = {
  content: ["./public/policies/*.html"],
  theme: {
    extend: {
      colors: {
        'groomr-gold': '#eae45c',
        'deep-slate': '#2c3e50',
        'sage-leaf': '#88a096',
        'pebble-grey': '#95a5a6',
        'alabaster-cream': '#f9f8f4',
        'muted-terracotta': '#c87964',
      },
      fontFamily: {
        'fredoka': ['Fredoka', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 4px 6px -1px rgba(149, 165, 166, 0.10), 0 2px 4px -1px rgba(149, 165, 166, 0.06)',
      }
    }
  }
}
