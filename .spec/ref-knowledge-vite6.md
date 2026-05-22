# Reference: Vite 6 Knowledge Base

Configuración validada para Vite 6 en ECG Simulator 2.

---

## 1. Versión

| Item | Valor |
|------|-------|
| Versión en proyecto | 6.4.2 |
| Release date | Nov 26, 2024 |
| Node soportado | 18, 20, 22+ |
| Docs | https://v6.vite.dev |

Fuente: vite.dev/blog/announcing-vite6

---

## 2. Build Options (las que usamos)

| Opción | Default | Nuestra config |
|--------|---------|---------------|
| target | 'baseline-widely-available' | — |
| outDir | 'dist' | — |
| assetsDir | 'assets' | — |
| minify | 'oxc' (nuevo en Vite 6) | — |
| chunkSizeWarningLimit | 500 kB | 1000 kB |
| cssMinify | 'lightningcss' | — |
| sourcemap | false | — |

### rollupOptions (deprecated pero funcional)
En Vite 6, `build.rollupOptions` es deprecated — usar `build.rolldownOptions` en proyectos nuevos.
Para nuestro proyecto actual: `build.rollupOptions` sigue funcionando.

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        recharts: ['recharts'],
      },
    },
  },
}
```

### chunkSizeWarningLimit
```ts
build: {
  chunkSizeWarningLimit: 1000, // en kB, default 500
}
```

Fuente: vite.dev/config/build-options

---

## 3. Cambios Vite 5 → Vite 6 relevantes para este proyecto

| Cambio | Impacto |
|--------|---------|
| minify default → 'oxc' | Build más rápido, mismo output. Sin cambios necesarios |
| build.rollupOptions → deprecated | Seguimos usándolo, migrar a rolldownOptions en futuro |
| Node 21 dropped | Usamos Node 20, sin impacto |
| Environment API (experimental) | No lo usamos (SPA simple) |

---

## 4. Plugins

```ts
import react from '@vitejs/plugin-react';
// @vitejs/plugin-react versión compatible con Vite 6
```

---

## 5. Config completa del proyecto

```ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        chunkSizeWarningLimit: 1000,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

---

## 6. Encoding UTF-8 (PowerShell 5.1)

Vite 6 no tiene control de encoding — eso es problema del shell.
Reglas para PowerShell 5.1:

```powershell
# LEER (seguro)
$bytes = [System.IO.File]::ReadAllBytes("ruta")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# ESCRIBIR (seguro)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes("ruta", $bytes)

# PROHIBIDO
# Set-Content / Out-File / Add-Content / > redirección
# [System.IO.File]::ReadAllText / WriteAllText
```

---

## 7. Comandos

```bash
npx vite build          # Build producción
npx vite build --watch  # Watch mode
npx vite                # Dev server
npx vite preview        # Preview build
```
