/** @type {import('tailwindcss').Config} */
module.exports = {
  // CRITICAL: The 'content' array tells both the Tailwind CLI and IntelliSense
  // where to look for utility classes in your project files.
  content: [
    "./public/**/*.html",
    "./src/**/*.js",
    // Add other paths if you use JavaScript/TSX/Vue/etc.
  ],
  theme: {
    extend: {}, // Customizations go here
  },
  plugins: [
    // Add any official or third-party plugins here
  ],
}
