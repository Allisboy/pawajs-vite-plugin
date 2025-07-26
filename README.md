# vite-plugin-pawajs

A Vite plugin for transforming and enhancing PawaJS component files. It ensures minifier-safe return statements and improves component registration with automatic naming.

---

## ✨ Features

- ✅ **Minifier-safe returns** for PawaJS hooks.
- 🔄 **Automatic component name injection** for `RegisterComponent`.
- ⚡ Works with both JavaScript and TypeScript.
- 🧠 Uses `estree-walker` and `magic-string` for efficient AST transforms.

---

## 📦 Installation

```bash
npm install vite-plugin-pawajs --save-dev

# vite-plugin-pawajs

A Vite plugin for transforming and enhancing PawaJS component files. It ensures minifier-safe return statements and improves component registration with automatic naming.

---

## ✨ Features

- ✅ **Minifier-safe returns** for PawaJS hooks.
- 🔄 **Automatic component name injection** for `RegisterComponent`.
- ⚡ Works with both JavaScript and TypeScript.
- 🧠 Uses `estree-walker` and `magic-string` for efficient AST transforms.

---

## 📦 Installation

```bash
npm install vite-plugin-pawajs --save-dev

```js
import { defineConfig } from 'vite';
import { pawajsPlugin } from 'vite-plugin-pawajs';

export default defineConfig({
  plugins: [pawajsPlugin()]
});


## 📄 License

This project is licensed under the [MIT License](./LICENSE).
