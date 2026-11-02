# CIRELEC · Reportes de trabajo (Generadores)

Aplicación web para llenar, guardar, buscar e imprimir los **Reportes de Trabajo** de CIRELEC. Usa el mismo formato del reporte impreso.

- Se guarda en una base de datos (**Netlify Blobs**). No necesitas otra cuenta ni configurar nada aparte.
- Solo puede entrar quien tenga el **enlace privado**, que lleva la clave al final.
- Si escribes un cliente que ya guardaste, se llenan solos sus datos: dirección, teléfono y los datos del generador.
- Todos los títulos del formato se pueden editar con el botón **Editar títulos**.
- Para imprimir o guardar en PDF, el reporte sale en tamaño A4 con el mismo diseño.

## Publicar

1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify, entra a **Add new site → Import an existing project → GitHub** y elige el repositorio. No cambies la configuración de build: ya viene en `netlify.toml`.
3. En Netlify, entra a **Site configuration → Environment variables → Add a variable** y agrega:
   - Key: `APP_KEY`
   - Value: una clave larga y difícil de adivinar. Puedes generar una en PowerShell con:
     `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})`
4. En **Deploys**, elige **Trigger deploy → Deploy site**.
5. El enlace privado para el dueño es:
   `https://TU-SITIO.netlify.app/?k=TU_CLAVE`

La primera vez que se abre el enlace, la clave queda guardada en ese navegador. Para cortar el acceso, cambia `APP_KEY` en Netlify y vuelve a publicar.

## Probar en tu computadora

```bash
npm install
npm run local
```

Luego abre http://localhost:8888/?k=prueba. Los datos de prueba se guardan en `.datos-local.json`.
