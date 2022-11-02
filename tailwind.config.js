/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /./, // the "." means "everything"
    },
  ],
  plugins: [],
};
