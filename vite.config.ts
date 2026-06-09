import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
  },
});
