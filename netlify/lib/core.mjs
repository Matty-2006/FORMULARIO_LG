// Lógica de la API, independiente de dónde se guardan los datos.
// `store` debe tener: get(key) -> objeto|null, set(key, objeto), delete(key).

// Campos que se guardan como "datos del cliente" y se autocompletan.
export const CAMPOS_CLIENTE = [
  'cliente', 'direccion', 'telefono',
  'equipo', 'marca', 'modelo', 'serie',
  'motor', 'motor_modelo', 'motor_serie', 'horas',
  'alternador', 'alt_modelo', 'alt_serie', 'kw_kva',
];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const clave = (nombre) => String(nombre || '').trim().toUpperCase().replace(/\s+/g, ' ');
const numValido = (n) => /^[0-9A-Za-z-]{1,20}$/.test(n);

export async function handle(req, store, appKey) {
  if (!appKey) return json({ error: 'Falta configurar APP_KEY en Netlify' }, 500);
  if (req.headers.get('x-key') !== appKey) return json({ error: 'No autorizado' }, 401);

  const url = new URL(req.url);
  const partes = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [recurso, id] = partes;
  const m = req.method;

  if (recurso === 'ping') return json({ ok: true });

  if (recurso === 'reportes' && !id && m === 'GET') {
    const indice = (await store.get('indice')) || {};
    const lista = Object.entries(indice).map(([numero, r]) => ({ numero, ...r }))
      .sort((a, b) => b.numero.localeCompare(a.numero, 'es', { numeric: true }));
    return json(lista);
  }

  if (recurso === 'reportes' && id) {
    if (!numValido(id)) return json({ error: 'Número de reporte inválido' }, 400);

    if (m === 'GET') {
      const r = await store.get(`reporte/${id}`);
      return r ? json(r) : json({ error: 'No existe' }, 404);
    }

    if (m === 'PUT') {
      const body = await req.json();
      const campos = body.campos || {};
      const ahora = new Date().toISOString();
      const previo = await store.get(`reporte/${id}`);
      const reporte = { numero: id, campos, creado: previo?.creado || ahora, actualizado: ahora };
      await store.set(`reporte/${id}`, reporte);

      const indice = (await store.get('indice')) || {};
      const fecha = [campos.fin_dia, campos.fin_mes, campos.fin_anio].filter(Boolean).join(' ');
      indice[id] = { cliente: campos.cliente || '', fecha, descripcion: campos.desc1 || '', actualizado: ahora };
      await store.set('indice', indice);

      // los títulos editados valen para todos los reportes
      if (Array.isArray(body.etiquetas)) await store.set('formato', { etiquetas: body.etiquetas });

      let clienteNuevo = false;
      const k = clave(campos.cliente);
      if (k) {
        const clientes = (await store.get('clientes')) || {};
        clienteNuevo = !clientes[k];
        const datos = {};
        for (const c of CAMPOS_CLIENTE) datos[c] = campos[c] || '';
        clientes[k] = { ...datos, actualizado: ahora };
        await store.set('clientes', clientes);
      }
      return json({ ...reporte, clienteNuevo });
    }

    if (m === 'DELETE') {
      await store.delete(`reporte/${id}`);
      const indice = (await store.get('indice')) || {};
      delete indice[id];
      await store.set('indice', indice);
      return json({ ok: true });
    }
  }

  if (recurso === 'siguiente' && m === 'GET') {
    const indice = (await store.get('indice')) || {};
    const max = Object.keys(indice).reduce((a, n) => Math.max(a, parseInt(n, 10) || 0), 0);
    return json({ numero: String(max + 1).padStart(7, '0') });
  }

  if (recurso === 'clientes' && m === 'GET') {
    const clientes = (await store.get('clientes')) || {};
    return json(Object.values(clientes).sort((a, b) => a.cliente.localeCompare(b.cliente, 'es')));
  }

  if (recurso === 'clientes' && id && m === 'DELETE') {
    const clientes = (await store.get('clientes')) || {};
    delete clientes[clave(id)];
    await store.set('clientes', clientes);
    return json({ ok: true });
  }

  if (recurso === 'firma') {
    if (m === 'GET') return json((await store.get('firma')) || null);
    if (m === 'PUT') {
      const body = await req.json();
      if (body?.imagen && body.imagen.length > 1_500_000) return json({ error: 'La imagen de la firma es muy pesada' }, 413);
      await store.set('firma', body);
      return json({ ok: true });
    }
  }

  if (recurso === 'formato') {
    if (m === 'GET') return json((await store.get('formato')) || { etiquetas: null });
    if (m === 'PUT') {
      const body = await req.json();
      await store.set('formato', { etiquetas: body.etiquetas || null });
      return json({ ok: true });
    }
  }

  return json({ error: 'Ruta no encontrada' }, 404);
}
