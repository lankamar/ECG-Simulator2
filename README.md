# 🫀 ECG-Simulator2
### Simulador Educativo de Arritmias Cardíacas con IA

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://ecg-simulator2.vercel.app)
[![Gemini](https://img.shields.io/badge/AI-Gemini_API-blue.svg)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Demo en vivo**: [ecg-simulator2.vercel.app](https://ecg-simulator2.vercel.app)

---

## 📖 Historia y Contexto

Este simulador nació de una **colaboración académica con el Licenciado Cuence**, autor de un libro especializado en electrocardiografía. La idea fue digitalizar los conceptos del libro y darle vida a través de un simulador interactivo con inteligencia artificial.

Es la **Generación 2** del proyecto ECG con IA:

| Generación | Repo | Descripción |
|-----------|------|-------------|
| V1 | [ECG-Simulator](https://github.com/lankamar/ECG-Simulator) | Primer prototipo educativo |
| V0-Beta | [ECG-Simulator-V0-Beta](https://github.com/lankamar/ECG-Simulator-V0-Beta) | Beta con IA y UX mobile |
| **V2** ⭐ | **ECG-Simulator2** | **Colaboración Cuence + Gemini AI** |
| V3 | [cardiac-ecg-simulator](https://github.com/lankamar/cardiac-ecg-simulator) | Motor científico Python (Hodgkin-Huxley) |

---

## 🎯 Características

- **Visualización de 12 derivaciones ECG** en tiempo real
- **Arritmias cardíacas** basadas en el libro de texto del Lic. Cuence
- **IA explicativa integrada** vía Gemini API (explicaciones clínicas de cada arritmia)
- **Interfaz educativa** pensada para estudiantes y profesionales de la salud
- **Deploy en Vercel** con acceso público

---

## 🚀 Ejecutar Localmente

**Prerequisitos**: Node.js

```bash
# Instalar dependencias
npm install

# Configurar API Key en .env.local
GEMINI_API_KEY=tu_clave_aqui

# Ejecutar en desarrollo
npm run dev
```

Ver la app en **AI Studio**: https://ai.studio/apps/drive/19uJTQKSXJ3wRo_4j9cg_pe9j8oBIL01E

---

## 🔬 Arritmias Soportadas

El simulador cubre las principales arritmias organizadas según la clasificación del libro del Lic. Cuence:
- Taquicardias supraventriculares
- Fibrilación y flutter auricular (variantes: baja, moderada, alta frecuencia)
- Arritmias ventriculares
- Trastornos de conducción
- Ritmos de la unión AV

---

## 🤝 Colaboración

Este proyecto fue desarrollado en conjunto con el **Licenciado Cuence**, cuyo libro de electrocardiografía sirvió como base clínica y científica para los modelos de arritmias implementados.

Si sos estudiante o docente y querés usar este simulador en contextos educativos, el código es libre bajo licencia MIT.

---

## 🔗 Proyecto Relacionado

Para la versión científica con modelos Hodgkin-Huxley y 54 arritmias documentadas, ver:
👉 [cardiac-ecg-simulator](https://github.com/lankamar/cardiac-ecg-simulator)

---

## 👨‍💻 Autor

**Lankamar** — [GitHub](https://github.com/lankamar)

⭐ Si este proyecto te resulta útil, ¡dale una estrella!
