# Guía de Despliegue Automático: GitHub + Hostinger

## 🌟 Resumen Ejecutivo

Esta guía documenta cómo conectar tu repositorio de GitHub a Hostinger para lograr **despliegue continuo automático**. Cada vez que hagas `push` a la rama `main`, tu aplicación se actualizará automáticamente en producción.

## ✅ Requisitos

- Cuenta de GitHub con un repositorio público o privado
- Cuenta de Hostinger con acceso a cPanel
- Conocimientos básicos de Git y SSH

## 🗓️ Paso 1: Generar Clave SSH en Hostinger

1. Accede al panel de Hostinger
2. Ve a: **Sitios web** → **[Tu sitio]** → **Avanzado** → **GIT**
3. En la sección "Repositorio privado de Git"
4. Haz clic en **"Generar clave SSH"**
5. Se generará una clave pública automáticamente
6. **Copia la clave** haciendo clic en el botón "Copiar"

```
Output esperado:
ssh-rsa AAAA... (clave muy larga)
```

## 🔐 Paso 2: Agregar Clave SSH a GitHub

1. Accede a GitHub y ve a tu cuenta
2. Ve a: **Configuración (Settings)** → **Claves SSH y GPG**
3. Haz clic en **"Nueva clave SSH"**
4. Título: "Hostinger Hosting" (o descriptivo)
5. Tipo de clave: "Clave de autenticación"
6. Pega la clave SSH que copiaste de Hostinger
7. Haz clic en **"Añadir clave SSH"**
8. Completa la verificación de seguridad si es necesario

**Status esperado:** "Nunca usado — Lectura/escritura"

## 📋 Paso 3: Conectar Repositorio en Hostinger

1. Ve a: **Hostinger** → **Sitios web** → **[Tu sitio]** → **Avanzado** → **GIT**
2. En "Crear un nuevo repositorio"
3. Completa los campos:
   - **Repositorio**: `git@github.com:TU_USUARIO/TU_REPOSITORIO.git`
   - **Rama**: `main` (o la rama que uses)
   - **Directorio**: `public_html` (ruta de despliegue)
4. Haz clic en **"Crear"**

**Ejemplo:**
```
Repositorio: git@github.com:lankamar/ECG-Simulator2.git
Rama: main
Directorio: public_html
```

## 📋 Paso 4: Configurar Webhook en GitHub

1. Ve a tu repositorio en GitHub
2. **Configuración** → **Webhooks**
3. Haz clic en **"Añadir webhook"**
4. Completa:
   - **Payload URL**: Usar la URL que Hostinger te proporciona
   - **Content type**: `application/x-www-form-urlencoded`
   - **Events**: "Solo el pushEvent"
   - **Active**: Marcado ✓
5. Haz clic en **"Agregar webhook"**

**Status esperado:** "La última entrega fue exitosa"

## 🪀 Paso 5: Verificar Funcionalidad

1. Haz un cambio pequeño en tu repositorio
2. Haz commit y push:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Espera 1-2 minutos
4. Ve a Hostinger y haz clic en **"Ver la salida de la última compilación"**
5. Deberías ver el log del despliegue completado

## 📚 Logs de Despliegue

Cada despliegue genera un log con:

```
Deployment start
Repository git@github.com:lankamar/ECG-Simulator2.git
Checking project directory is empty
Project directory is git repository
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
Deployment end
```

**Significado:**
- ✅ Repositorio descargado correctamente
- ✅ Rama `main` sincronizada
- ✅ Cambios integrados

## 🚘 Solución de Problemas

### Error: "El directorio del proyecto no está vacío"
**Solución:** Especifica un directorio de despliegue (`public_html`)

### Webhook no se dispara
**Solución:** Verifica en GitHub Settings → Webhooks que dice "Recent Deliveries: Success"

### Los cambios no aparecen
**Solución:** Limpia el caché del navegador (Ctrl+Shift+Del) o espera a que expire

## 🚀 Siguientes Pasos

1. **GitHub Actions** - Agregar CI/CD pipeline para tests automáticos
2. **Slack Notifications** - Recibir alertas cuando se despliega
3. **Auto-scaling** - Configurar más proyectos con el mismo patrón

## 📋 Referencias

- [Documentación de Hostinger Git](https://support.hostinger.es)
- [GitHub Webhooks](https://docs.github.com/webhooks)
- [SSH Keys en GitHub](https://docs.github.com/authentication/connecting-to-github-with-ssh)

---

**Última actualización:** 28 de Noviembre de 2025
**Creado por:** Marcelo Omar Lancry K.
**Proyecto:** ECG-Simulator2 - Simulador Educativo de Arritmias Cardíacas
