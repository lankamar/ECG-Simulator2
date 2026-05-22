# ECG Simulator v0 - PRD (Product Requirements Document)

**Versión:** 0.1  
**Estado:** En Desarrollo  
**Última actualización:** 09/11/2025  
**Autor y Diseñador:** Marcelo Omar Lancry Kamycki
---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Objetivos del Proyecto](#objetivos-del-proyecto)
3. [Usuarios Target](#usuarios-target)
4. [Features Actuales](#features-actuales)
5. [Roadmap & Tracking](#roadmap--tracking)
6. [Especificaciones Técnicas](#especificaciones-técnicas)
7. [KPIs & Métricas](#kpis--métricas)

---

## 🎯 Visión General

**ECG Simulator** es una aplicación web educativa interactiva que permite visualizar y estudiar 25+ arritmias cardíacas en tiempo real con una representación de 12 derivaciones ECG.

**Propósito principal:** Herramienta pedagógica para estudiantes de medicina, enfermería y profesionales sanitarios en formación continua.

**Estado actual:** MVP funcional en producción (https://ecg-simulator2.vercel.app/)

---

## 🎓 Objetivos del Proyecto

### Corto Plazo (V0.1 - Actual)
- ✅ Visualizar 25+ arritmias cardíacas en formato interactivo
- ✅ Display de 12 derivaciones ECG en tiempo real
- ✅ Controles de playback (play/pausa, velocidad)
- ✅ Monitor de frecuencia cardíaca en vivo
- ✅ Tira de ritmo (Derivación II)
- ✅ Zoom en derivaciones individuales
- ✅ UI responsive dark-mode

### Mediano Plazo (V0.2-0.3)
- 🔄 Sistema de quizzes/evaluación integrado
- 🔄 Filtro avanzado por categoría de arritmia
- 🔄 Exportar ECG en PDF
- 🔄 Base de datos de pacientes/casos clínicos
- 🔄 Soporte para múltiples idiomas (ES, EN, PT)

### Largo Plazo (V1.0)
- 🔮 Generador de ECG personalizado (parámetros ajustables)
- 🔮 Modo diagnóstico (game-like)
- 🔮 Integración con API de IA para análisis automático
- 🔮 Multiplayer learning (colaborativo)
- 🔮 Mobile app nativa (React Native)

---

## 👥 Usuarios Target

| Rol | Descripción | Uso Principal |
|-----|-------------|---------------|
| **Estudiante de Medicina** | Carrera pre-grado | Aprender patrones ECG, prepararse para exámenes |
| **Estudiante de Enfermería** | Especialidades en cuidado crítico | Reconocer arritmias en monitor |
| **Residente de Cardiología** | Post-grado especializado | Profundizar en patofisiología, casos complejos |
| **Profesional en Práctica** | Médicos/Enfermeras en piso | Consultas rápidas, refresco de conocimientos |
| **Docente/Instructor** | Academia o instituciones | Crear lecciones, evaluaciones |

---

## ✨ Features Actuales (Completados)

### 1. Visualización ECG 12-Derivaciones
- **Derivaciones frontales:** DI, DII, DIII, aVR, aVL, aVF
- **Derivaciones precordiales:** V1, V2, V3, V4, V5, V6
- Generación procedural basada en vectores (P, QRS, T)
- Algoritmo vectorial realista (ángulos, magnitudes)

### 2. Arritmias Soportadas (25 tipos)

#### Supraventriculares (12)
1. Ritmo Sinusal Normal
2. Bradicardia Sinusal
3. Taquicardia Sinusal
4. Extrasístole Auricular (CAP)
5. Fibrilación Auricular
6. Aleteo Auricular
7. Taquicardia Auricular Multifocal (TAM)
8. Taquicardia Paroxística Supraventricular (TPSV)
9. Taquicardia por Reentrada Nodal AV (TRNAV)
10. Ritmo de Escape de la Unión
11. Bloqueos AV (1°, 2°Mobitz I/II, 3°)
12. Síndrome de WPW

#### Ventriculares (10)
1. Contracción Ventricular Prematura (CVP)
2. Bigeminismo Ventricular
3. Trigeminismo Ventricular
4. Taquicardia Ventricular
5. Torsades de Pointes
6. Ritmo Idioventricular
7. Ritmo Idioventricular Acelerado (RIVA)
8. Fibrilación Ventricular
9. Asistolia
10. Ritmo de Marcapasos (VVI)
11. Bloqueo de Rama Derecha (RBBB)
12. Bloqueo de Rama Izquierda (LBBB)

### 3. Controles de Interacción
- ▶️ Play/Pausa
- ⏱️ Velocidad de reproducción (0.5x, 1x, 2x)
- 🔍 Zoom en derivación individual
- 📊 Tira de ritmo deriv. II (scrollable)
- 💓 Monitor HR en vivo

### 4. Panel Información
- Descripción clínica de cada arritmia
- Criterios ECG diagnósticos
- Preguntas de quiz (3 preguntas por arritmia)
- Consideraciones de enfermería
- Protocolo de emergencia

---

## 📊 Roadmap & Tracking

### V0.1 (ACTUAL - En desarrollo)
**Fecha estimada:** Completado 80%

| Tarea | Estado | Prioridad | Asignado | Sprint |
|-------|--------|-----------|----------|--------|
| Refactor ECGMonitor.tsx | 🔄 | P0 | @lankamar | S1 |
| Optimizar renderizado SVG | 🔄 | P0 | @lankamar | S1 |
| Fix: Sincronización playback | 🔄 | P0 | @lankamar | S1 |
| Mejorar responsividad móvil | ⏳ | P1 | @lankamar | S2 |
| Testing: Todos los 25 ECGs | ⏳ | P1 | @lankamar | S2 |

### V0.2 (Próxima - Q4 2025)
**Fecha estimada:** Dic 2025

| Tarea | Estado | Prioridad |
|-------|--------|----------|
| Implementar Sistema de Quizzes | ⏳ | P0 |
| Agregar 5+ casos clínicos | ⏳ | P0 |
| Exportar ECG a PDF | ⏳ | P1 |
| Internationalizacion (i18n) | ⏳ | P2 |
| Dark/Light mode toggle | ⏳ | P2 |

### V0.3 (Q1 2026)
- Integración con base de datos de pacientes
- Sistema de progreso y badges
- Feedback generado por IA

---

## 🏗️ Especificaciones Técnicas

### Stack Actual
```
Frontend:  React 18 + TypeScript
Styling:   Tailwind CSS
Charts:    Recharts (ECG visualization)
Hosting:   Vercel
VCS:       Git/GitHub
Node:      v18+
Package:   npm
```

### Estructura de Carpetas
```
ECG-Simulator2/
├── components/
│   ├── ECGMonitor.tsx       (Principal render 12-lead)
│   ├── RhythmStrip.tsx      (DII strip)
│   ├── Sidebar.tsx          (Selector arritmias)
│   ├── InfoPanel.tsx        (Info + quiz)
│   └── ZoomModal.tsx        (Detalle lead)
├── services/
│   └── arrhythmiaData.ts    (25+ definiciones + generadores)
├── types/
│   └── index.ts             (TypeScript interfaces)
├── App.tsx                  (Root component)
└── constants.tsx            (Config global)
```

### Algoritmo ECG Vectorial
- **P Vector:** Magnitud 0.15, Ángulo 60°, Duración 0.08s
- **QRS Vector:** Magnitud 1.0, Ángulo 45°, Duración 0.09s
- **T Vector:** Magnitud 0.3, Ángulo 45°, Duración 0.14s
- **Proyección:** `coseno(vectorAngle - leadAngle) * magnitude`
- **Generación:** 20 segundos de ECG procesado en tiempo real

---

## 📈 KPIs & Métricas

### Performance
- ⏱️ **Time to First Paint:** < 1.5s
- 📊 **FPS Playback:** 60fps estable
- 💾 **Bundle Size:** < 300KB (gzipped)
- 🔄 **Deploy Time:** < 2min (Vercel)

### Engagement (Objetivo)
- 👥 **MAU:** 5,000+ usuarios/mes (Q1 2026)
- 📚 **Avg Session:** 15-20 min
- 🎓 **Quiz Completion Rate:** > 70%
- ⭐ **Retention (7d):** > 40%

### Educativo
- ✅ **Arritmias Soportadas:** 25+ tipos
- 📝 **Quiz Coverage:** 3 preguntas x arritmia
- 📖 **Casos Clínicos:** 10+ (target V0.2)

---

## 📝 Notas Importantes

### Issues Conocidos
- [ ] Sincronización ocasional entre playback speed y display
- [ ] Rendimiento en dispositivos móviles antiguos
- [ ] Falta documentación técnica interna

### Próximos Pasos Inmediatos
1. Refactorizar ECGMonitor para mejorar mantenibilidad
2. Agregar test unitarios (Jest + React Testing Library)
3. Crear CONTRIBUTING.md para colaboradores
4. Configurar GitHub Issues con templates

---

## 📞 Contacto & Support

- **GitHub Issues:** https://github.com/lankamar/ECG-Simulator2/issues
- **Proyecto:** https://ecg-simulator2.vercel.app/
- **Email:** [tu email]

---


📚 Fuentes Conceptuales y Referencias
-----------------------------

### Fuente Conceptual Validadora

**Libro:** [ECG: Interpretación Clínica - Lic. Jorge Cuence](https://example.com)

Este proyecto utiliza como **fuente conceptual validadora** el libro de Lic. Jorge Cuence sobre interpretación clínica de electrocardiogramas. Los algoritmos, patrones de arritmias y criterios diagnósticos implementados en el simulador se basan en los principios y conceptos presentados en esta referencia bibliográfica.

**Nota Importante:** Lic. Jorge Cuence es el autor del libro de referencia conceptual del proyecto. El diseño, desarrollo e implementación de este simulador es responsabilidad única de Marcelo Omar Lancry Kamycki.

---

**Versión del documento:** 0.1
**Última revisión:** 12/11/2025
**Revisor:** Marcelo Omar Lancry Kamycki


## Información de Autoría y Copyright

**Desarrollador Principal:** Marcelo Omar Lancry Kamycki (@lankamar)
- @lankamar es el pseudónimo/acrónimo utilizado en GitHub por Marcelo Omar Lancry Kamycki
- Todas las asignaciones de tareas a "@lankamar" en este proyecto corresponden al mismo desarrollador

**Copyright © 2025 Marcelo Omar Lancry Kamycki**

Este proyecto de simulador de ECG es de autoría y desarrollo exclusivo de Marcelo Omar Lancry Kamycki. Todos los derechos reservados.

### Protección de Autoría

- **Licencia:** [Especificar licencia - MIT, GPL, CC, etc.]
- **Fuente Conceptual:** El contenido técnico se basa en el libro de Lic. Jorge Cuence sobre interpretación clínica de electrocardiogramas
- **Autoría de Código:** 100% desarrollado por Marcelo Omar Lancry Kamycki
- **GitHub Profile:** https://github.com/lankamar
- **Commit History:** El historial de commits de GitHub registra automáticamente toda la autoría y cambios realizados

---

**Nota para colaboradores:** Este proyecto es de código abierto/cerrado según su licencia. Cualquier contribución requiere reconocimiento explícito.

**Última revisión:** 09/11/2025  
**Próxima revisión programada:** 23/11/2025
