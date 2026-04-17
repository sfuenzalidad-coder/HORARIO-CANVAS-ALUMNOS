# Migración del horario a GitHub Pages

## Qué incluye esta carpeta

- `export.gs`: Apps Script para exportar archivos JSON estáticos desde Google Sheets.
- `index.html`: página principal.
- `styles.css`: estilos.
- `app.js`: lógica completa del frontend, incluyendo filtros, topes y carga de JSON.

## Arquitectura final

1. **Google Sheets** sigue siendo la fuente de verdad.
2. **Apps Script** ya no atiende estudiantes en vivo. Solo exporta:
   - `data.json`
   - `config.json`
   - `profesores.json`
3. **GitHub Pages** sirve el sitio estático.
4. Los estudiantes filtran y revisan topes completamente en el navegador.

---

## Advertencia importante sobre RUT

`profesores.json` contiene los RUT validados para acceso de profesores/administrativos.

Si publicas este archivo en un sitio estático público, **cualquier persona podría inspeccionarlo o descargarlo**.

### Opciones:
- **Opción simple:** usarlo igual y aceptar que no es seguridad real.
- **Opción recomendada:** eliminar el acceso por RUT en la versión pública.
- **Opción intermedia:** crear un segundo sitio privado para profesores/administrativos.

---

## Paso 1: preparar Apps Script

1. Abre el Google Sheet fuente.
2. Ve a **Extensions > Apps Script**.
3. Crea un proyecto nuevo o usa uno vinculado al spreadsheet.
4. Reemplaza el contenido con `export.gs`.
5. Completa:
   - `SPREADSHEET_ID` si el script es standalone.
   - `EXPORT_FOLDER_ID` con el ID de una carpeta de Google Drive.

### Cómo obtener `EXPORT_FOLDER_ID`
Si tu carpeta tiene una URL así:

`https://drive.google.com/drive/folders/ABC123XYZ`

Entonces el ID es:

`ABC123XYZ`

---

## Paso 2: exportar archivos JSON

En Apps Script:

1. Guarda el proyecto.
2. Ejecuta `exportAllStaticFiles`.
3. Acepta los permisos.
4. Revisa la carpeta de Drive.

Deberías ver:
- `data.json`
- `config.json`
- `profesores.json`

Descarga esos 3 archivos a tu computador.

---

## Paso 3: preparar el sitio local

Crea una carpeta así:

```text
tu-repo/
  index.html
  styles.css
  app.js
  data/
    data.json
    config.json
    profesores.json
```

Copia `index.html`, `styles.css` y `app.js` desde esta carpeta.
Luego crea la subcarpeta `data/` y pega ahí los 3 JSON exportados.

---

## Paso 4: configurar la descarga del Excel

En `app.js`, reemplaza:

```javascript
const EXCEL_DOWNLOAD_URL = 'PUT_PUBLIC_XLSX_EXPORT_URL_HERE';
```

por algo como:

```javascript
const EXCEL_DOWNLOAD_URL = 'https://docs.google.com/spreadsheets/d/TU_FILE_ID/export?format=xlsx';
```

Si quieres que los alumnos puedan descargar el Excel, el archivo o spreadsheet debe ser accesible para ellos.

---

## Paso 5: subir a GitHub

1. Crea un repositorio en GitHub.
2. Sube:
   - `index.html`
   - `styles.css`
   - `app.js`
   - carpeta `data/`

Puedes hacerlo por web o con Git:

```bash
git init
git add .
git commit -m "Initial migration"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

---

## Paso 6: activar GitHub Pages

En GitHub:

1. Ve a **Settings**
2. Ve a **Pages**
3. En **Build and deployment**, elige:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - Folder: `/ (root)`

Guarda.

GitHub te dará una URL del tipo:

`https://tuusuario.github.io/turepo/`

Ese será el nuevo link para los estudiantes.

---

## Paso 7: actualizar los JSON cuando cambie el horario

Cada vez que cambie el spreadsheet:

1. Ejecuta `exportAllStaticFiles` en Apps Script.
2. Descarga los nuevos:
   - `data.json`
   - `config.json`
   - `profesores.json`
3. Reemplázalos en la carpeta `data/` del repo.
4. Haz commit y push.

---

## Flujo recomendado de actualización

### Manual
- Cambias Google Sheet
- Exportas JSON
- Subes JSON a GitHub

### Semi-manual
Puedes incluso conservar una carpeta local sincronizada y simplemente arrastrar los archivos nuevos al repositorio.

---

## Qué ya queda resuelto

Esta migración conserva:

- acceso por rol
- selección de plan para estudiantes
- filtros multiselección
- filtros L-V no vacíos
- topes/conflictos
- leyenda
- descarga Excel
- orden por fecha de inicio
- toda la lógica principal de visualización

---

## Qué cambia respecto a Apps Script

Antes:
- cada usuario consultaba Apps Script en vivo

Ahora:
- todos descargan archivos estáticos
- todo el filtrado ocurre localmente
- GitHub Pages solo sirve archivos

Eso elimina el cuello de botella de concurrencia de Apps Script.

---

## Limitaciones

1. `profesores.json` no es seguro si el sitio es público.
2. Los datos no se actualizan automáticamente a menos que exportes y subas nuevos JSON.
3. Si `data.json` llega a ser extremadamente pesado, la carga inicial podría hacerse más lenta. Pero incluso así, sigue siendo mucho mejor para concurrencia que Apps Script.

---

## Recomendación práctica final

Para salir rápido a producción:

1. Migra primero con esta versión completa.
2. Prueba con datos reales.
3. Si quieres máxima privacidad, elimina después el login por RUT de la versión pública.

---

## Checklist final

- [ ] Crear carpeta de Drive para exportación
- [ ] Configurar `EXPORT_FOLDER_ID`
- [ ] Ejecutar `exportAllStaticFiles`
- [ ] Descargar los 3 JSON
- [ ] Crear repo GitHub
- [ ] Subir `index.html`, `styles.css`, `app.js`
- [ ] Crear carpeta `data/`
- [ ] Subir `data.json`, `config.json`, `profesores.json`
- [ ] Configurar `EXCEL_DOWNLOAD_URL`
- [ ] Activar GitHub Pages
- [ ] Probar la URL pública
