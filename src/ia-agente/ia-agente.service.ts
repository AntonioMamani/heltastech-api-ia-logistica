import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ContextoService } from './contexto.service';
import { CATALOGO_ENTIDADES } from './dto/catalogo-entidades';
import { CATALOGO_RUTAS, RutaConfig } from './dto/catalogo-rutas';
import { ExtraccionLlm, RutaLlm } from './interfaces/llm.interface';
import { EXTRACTOR_SYSTEM_PROMPT, ROUTER_SYSTEM_PROMPT } from './prompts/prompts.constant';

@Injectable()
export class IaAgenteService {
  private readonly logger = new Logger(IaAgenteService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly contexto: ContextoService,
  ) { }

  async procesarMensaje(mensaje: string, token: string, ctxRol: string, userId: string) {
    // Bloqueo total: por ahora el sistema NO crea ni actualiza nada, bajo ningún caso
    if (/crea|actualiz|modific|edit|registr/i.test(mensaje)) {
      return { mensaje: 'Aún no puedo crear ni actualizar información registrada, gracias.' };
    }

    const pendiente = this.contexto.get(userId);

    // STAGE A: router liviano — solo si no hay una conversación de entidad ya en curso
    if (!pendiente) {
      const ruta = await this.llamarLlmRuta([
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: mensaje },
      ]);
      if (ruta.tipo === 'navegacion') {
        return this.resolverNavegacion(ruta.destino ?? '', ctxRol);
      }
      if (ruta.tipo !== 'accion_entidad') {
        // Si es conversacion y pregunta por fecha/hora
        if (ruta.tipo === 'conversacion' && /fecha|hora|día|hoy/.test(mensaje.toLowerCase())) {
          const ahora = new Date();
          const fecha = ahora.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          return { mensaje: `Hoy es ${fecha}. Son las ${hora}. ¿En qué te ayudo con la logística ? ` };
        }
        return { mensaje: ruta.respuesta_directa ?? '¿En qué te ayudo?' };
      }
    }

    // ETAPA 1 (STAGE B): extracción de intención (con o sin contexto previo)
    let extraccion: ExtraccionLlm;
    try {
      if (pendiente) {
        extraccion = await this.llamarLlmJson([
          { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Contexto previo: el usuario ya estaba completando un "${pendiente.accion}" de "${pendiente.entidad}" con estos datos: ${JSON.stringify(pendiente.dataAcumulada)}.Faltaba: ${pendiente.faltantes.join(', ')}.
Su nueva respuesta es: "${mensaje}"
Fusioná el dato nuevo con lo que ya tenía y devolvé el JSON actualizado(si todavía falta algo, seguí con status "incompleto").`,
          },
        ]);
      } else {
        extraccion = await this.llamarLlmJson([
          { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
          { role: 'user', content: mensaje },
        ]);
      }
    } catch (err) {
      this.logger.error('Error en Etapa 1 (extracción)', err);
      return { mensaje: 'No pude procesar tu solicitud, intentá reformularla.' };
    }

    if (extraccion.status === 'no_reconocido') {
      this.contexto.clear(userId);
      return { mensaje: 'No entendí la solicitud, ¿podés reformularla?' };
    }

    if (extraccion.accion === 'create' || extraccion.accion === 'update') {
      this.contexto.clear(userId);
      return { mensaje: 'Aún no puedo crear o actualizar información registrada, gracias.' };
    }

    if (extraccion.status === 'incompleto') {
      this.contexto.set(userId, {
        entidad: extraccion.entidad,
        accion: extraccion.accion as 'create' | 'update',
        dataAcumulada: extraccion.data,
        faltantes: extraccion.faltantes ?? [],
      });
      return { mensaje: extraccion.mensaje_usuario ?? 'Faltan datos, ¿me das más detalle?' };
    }

    // status "ok" → ya no hace falta el contexto pendiente
    this.contexto.clear(userId);
    // Normalizar entidades
    if (extraccion.entidad === 'gastos_operativos' || extraccion.entidad === 'gastos') {
      extraccion.entidad = 'detalle_gasto_viaje';
    }
    // Charla general o fuera de dominio → respondemos directo, sin tocar el backend real
    if (extraccion.tipo === 'conversacion' || extraccion.tipo === 'fuera_dominio') {
      return { mensaje: extraccion.respuesta_directa ?? '¡Hola! ¿En qué te puedo ayudar hoy?' };
    }

    const entidadConfig = CATALOGO_ENTIDADES[extraccion.entidad];
    if (!entidadConfig) {
      return { mensaje: `Todavía no puedo gestionar "${extraccion.entidad}".` };
    }

    if (
      (extraccion.accion === 'sum' || extraccion.accion === 'avg') &&
      (!extraccion.data?.campo || !entidadConfig.camposNumericos?.includes(extraccion.data.campo))
    ) {
      return { mensaje: `No puedo calcular "${extraccion.data?.campo ?? 'ese dato'}" sobre "${extraccion.entidad}". Los campos disponibles son: ${entidadConfig.camposNumericos?.join(', ') ?? 'ninguno'}.` };
    }

    // ETAPA 2: resolución de referencias
    const idsResueltos: Record<string, any> = {};
    for (const campoRef of entidadConfig.referencias) {
      const textoLibre = extraccion.referencias_texto?.[campoRef];
      if (!textoLibre) continue;

      const resolucion = await this.resolverReferencia(campoRef, textoLibre, token);
      if (!resolucion.resuelto) {
        return { mensaje: resolucion.mensajeUsuario };
      }
      Object.assign(idsResueltos, resolucion.valores);
    }

    // ETAPA 3: ejecutar contra el backend real
    let resultado: any;
    try {
      resultado = await this.ejecutarAccion(
        entidadConfig.endpoint,
        extraccion.accion,
        { ...extraccion.data, ...idsResueltos },
        extraccion.id_directo,
        token,
      );
    } catch (err) {
      return this.formatearErrorBackend(err as AxiosError);
    }

    const respuestaFinal = await this.llamarLlmTexto([
      {
        role: 'system',
        content: `Respondé en PRIMERA PERSONA, como si fueras el sistema HeltasTruck, en tono natural. Hablá como si fueras yo, el asistente.
    Identificá los campos con nombres o códigos en lugar de IDs numéricos.
    Si ves "codigo", "nombre", "descripcion", "placa", "numero_contrato", usalos.
    Si solo ves IDs, decí "el elemento con ID X" pero evitá IDs.
    Todos los resultados que recibís ya están filtrados para excluir inactivos. Si es un conteo o listado, aclará que son "activos" (ej: "Tienes 7 conductores activos").`
      },
      { role: 'user', content: `Pregunta: ${mensaje}\nResultado: ${JSON.stringify(resultado)}` },
    ]);

    return { mensaje: respuestaFinal, data: resultado };
  }

  // ---------- Etapa 2 ----------
  private resolverRutaPorTexto(destino: string, rolLower?: string): { clave: string; config: RutaConfig } | null {
    const palabrasTexto = destino.toLowerCase().trim().split(/\s+/);

    let mejorMatch: { clave: string; config: RutaConfig; palabrasAlias: number; delRol: boolean } | null = null;

    for (const [clave, config] of Object.entries(CATALOGO_RUTAS)) {
      const delRol = !!rolLower && config.rolesPermitidos.includes(rolLower);

      for (const alias of config.alias) {
        const palabrasAlias = alias.split(/\s+/);
        // Match por substring en vez de igualdad estricta: "dash" matchea "dashboard"
        const todasPresentes = palabrasAlias.every(palabraAlias =>
          palabrasTexto.some(palabraTexto => palabraTexto.includes(palabraAlias) || palabraAlias.includes(palabraTexto))
        );

        if (!todasPresentes) continue;

        // Prioridad: 1) coincide con el rol del usuario, 2) alias más largo/específico
        const mejorQueElActual =
          !mejorMatch ||
          (delRol && !mejorMatch.delRol) ||
          (delRol === mejorMatch.delRol && palabrasAlias.length > mejorMatch.palabrasAlias);

        if (mejorQueElActual) {
          mejorMatch = { clave, config, palabrasAlias: palabrasAlias.length, delRol };
        }
      }
    }

    return mejorMatch ? { clave: mejorMatch.clave, config: mejorMatch.config } : null;
  }

  private resolverNavegacion(destino: string, ctxRol: string) {
    const rolLower = ctxRol.toLowerCase();
    const encontrado = this.resolverRutaPorTexto(destino, rolLower);

    if (!encontrado) {
      return { mensaje: `No encontré la pantalla "${destino}". ¿Podés ser más específico?` };
    }

    const tienePermiso = encontrado.config.rolesPermitidos.includes(rolLower);

    if (!tienePermiso) {
      return { mensaje: `No tienes permiso para acceder a "${encontrado.config.descripcion}".` };
    }

    return {
      mensaje: `Te lleve a ${encontrado.config.descripcion}.`,
      ruta: encontrado.config.ruta,
    };
  }
  private async resolverReferencia(campo: string, textoLibre: string, token: string) {
    const mapaBusqueda: Record<string, { endpoint: string; campoId: string; formato: (i: any) => string }> = {
      conductor: {
        endpoint: 'conductores',
        campoId: 'id_conductor',
        formato: (c) => `${c.nombres} ${c.apellidoPaterno} (CI: ${c.ci ?? 's/d'})`,
      },
      cliente: {
        endpoint: 'clientes',
        campoId: 'id_cliente',
        formato: (c) => c.nombre_organizacion ?? `${c.nombres} ${c.apellidoPaterno} `,
      },
    };

    const conf = mapaBusqueda[campo];
    if (!conf) {
      return { resuelto: false, mensajeUsuario: `No sé cómo resolver la referencia "${campo}".` };
    }

    // 👇 CAMBIA ESTO: usa search o busca directo
    const url = `${this.config.get('BACKEND_REAL_URL')}/${conf.endpoint}`;
    try {
      const response = await firstValueFrom(
        this.http.get(url, { headers: { Authorization: token } }),
      );
      const matches = response.data ?? [];

      // Buscar por nombre (case insensitive)
      const encontrados = matches.filter((item: any) => {
        const nombreCompleto = `${item.nombres} ${item.apellidoPaterno}`.toLowerCase();
        return nombreCompleto.includes(textoLibre.toLowerCase());
      });

      if (encontrados.length === 0) {
        return { resuelto: false, mensajeUsuario: `No encontré ningún/a "${textoLibre}".` };
      }
      if (encontrados.length > 1) {
        const opciones = encontrados.map(conf.formato).join(', ');
        return { resuelto: false, mensajeUsuario: `Encontré varios: ${opciones}. ¿Cuál es?` };
      }
      return { resuelto: true, valores: { [conf.campoId]: encontrados[0][conf.campoId] } };
    } catch (err) {
      this.logger.error(`Error resolviendo referencia "${campo}"`, err);
      return { resuelto: false, mensajeUsuario: `Tuve un problema buscando "${textoLibre}", intentá de nuevo.` };
    }
  }

  // ---------- Etapa 3 ----------

  private async ejecutarAccion(
    endpoint: string,
    accion: 'get' | 'create' | 'update' | 'count' | 'sum' | 'avg',
    payload: Record<string, any>,
    idDirecto: number | undefined,
    token: string,
  ) {
    const base = `${this.config.get('BACKEND_REAL_URL')}`;
    const headers = { Authorization: token };

    if (accion === 'get' || accion === 'count' || accion === 'sum' || accion === 'avg') {
      const url = `${base}/consulta-generica`;
      const body = {
        tabla: endpoint,
        operacion: accion,
        filtros: payload.filtros || {},
        campo: payload.campo || null,
      };

      console.log('URL FINAL:', url);
      console.log('BODY:', JSON.stringify(body, null, 2));

      try {
        const response = await firstValueFrom(
          this.http.post(url, body, { headers }),
        );
        console.log('RESPUESTA:', response.status);
        console.log(response.data);
        return response.data;
      } catch (e) {
        console.dir(e, { depth: null });
        throw e;
      }
    }

    // CREATE y UPDATE
    if (accion === 'create') {
      const response = await firstValueFrom(
        this.http.post(`${base}/${endpoint}`, payload, { headers })
      );
      return response.data;
    }

    if (accion === 'update') {
      if (!idDirecto) throw new Error('Falta el ID para actualizar');
      const response = await firstValueFrom(
        this.http.patch(`${base}/${endpoint}/${idDirecto}`, payload, { headers })
      );
      return response.data;
    }

    throw new Error(`Acción no soportada: ${accion}`);
  }

  private formatearErrorBackend(err: AxiosError) {
    const status = err.response?.status;
    const data: any = err.response?.data;
    this.logger.error(`Backend real respondió ${status}`, JSON.stringify(data));

    if (status === 400) {
      return { mensaje: `Los datos no son válidos: ${data?.message ?? 'revisá la información enviada'}.` };
    }
    if (status === 404) {
      return { mensaje: 'No encontré el recurso que quieres modificar.' };
    }
    return { mensaje: 'Tuve un problema procesando la solicitud, intentá de nuevo.' };
  }

  // ---------- Llamadas al LLM ----------
  private async llamarLlmRuta(messages: any[]): Promise<RutaLlm> {
    const texto = await this.llamarLlmTexto(messages, 0.1);
    try {
      const limpio = texto.replace(/```json|```/g, '').trim();
      return JSON.parse(limpio);
    } catch {
      this.logger.warn('El router no devolvió JSON válido: ' + texto);
      return { tipo: 'accion_entidad', respuesta_directa: null }; // fail-safe: si el router falla, dejamos pasar a la Etapa 1 normal
    }
  }

  private async llamarLlmJson(messages: any[]): Promise<ExtraccionLlm> {
    const texto = await this.llamarLlmTexto(messages, 0.1);
    try {
      const limpio = texto.replace(/```json|```/g, '').trim();
      return JSON.parse(limpio);
    } catch {
      this.logger.warn('El LLM no devolvió JSON válido: ' + texto);
      return {
        status: 'no_reconocido',
        tipo: 'fuera_dominio',
        entidad: '',
        accion: 'get',
        data: {},
        respuesta_directa: 'No pude procesar tu solicitud, intentá reformularla.',
      };
    }
  }

  private async llamarLlmTexto(messages: any[], temperature = 0.4): Promise<string> {
    const response = await firstValueFrom(
      this.http.post(
        this.config.get('GROQ_URL')!,
        {
          model: this.config.get('GROQ_MODEL'),
          messages,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get('GROQ_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    return response.data.choices[0].message.content;
  }
}