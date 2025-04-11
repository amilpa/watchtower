import { defineConfig } from "vite";
import { resolve } from "path";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  build: {
    // Output directory for the bundled code
    outDir: "dist",

    // Library mode configuration for Node.js
    lib: {
      entry: resolve(__dirname, "app.js"),
      formats: ["cjs"],
      fileName: (format) => `bundle.${format}`, // Explicitly include extension
    },

    // Enable minification
    minify: true,

    // Ensure we generate a clean bundle
    emptyOutDir: true,

    // Rollup-specific options
    rollupOptions: {
      // External packages (don't bundle these)
      external: [
        // Node.js built-ins
        ...require("module").builtinModules,
        // Dependencies from package.json
        ...Object.keys(require("./package.json").dependencies || {}),
      ],
      output: {
        // Preserve exports from app.js
        exports: "named",
        // Format as CommonJS for Node.js
        format: "cjs",
        // Ensure the file extension is included
        entryFileNames: "bundle.cjs",
      },
    },
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ["node"],
    }),
    commonjs(),
  ],
  // Ensure we're targeting Node.js
  ssr: {
    target: "node",
  },
});
