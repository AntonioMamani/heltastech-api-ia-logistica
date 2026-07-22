import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ContextoService } from './contexto.service';
import { CATALOGO_ENTIDADES } from './dto/catalogo-entidades';
interface ExtraccionLlm {
  status: 'ok' | 'incompleto' | 'no_reconocido';
  tipo: 'accion_entidad' | 'conversacion' | 'fuera_dominio';
  entidad: string;
  accion: 'get' | 'create' | 'update' | 'count' | 'sum' | 'avg';
  data: Record<string, any>;
  referencias_texto?: Record<string, string>;
  id_directo?: number;
  faltantes?: string[];
  mensaje_usuario?: string | null;
  respuesta_directa?: string | null;
}

interface RutaLlm {
  tipo: 'accion_entidad' | 'conversacion' | 'fuera_dominio';
  respuesta_directa: string | null;
}

const ROUTER_SYSTEM_PROMPT = `Eres el clasificador de intención de HeltasTruck, un sistema de logística.
Devolvé SOLO un JSON, sin texto adicional.

Clasificá el mensaje del usuario en uno de estos tipos:
- "accion_entidad": quiere consultar, crear o actualizar algo del sistema (vehículos, conductores, viajes, pagos, contratos, mantenimiento, clientes, y similares).
- "conversacion": saludos, agradecimientos, "qué podés hacer", charla trivial, hora/fecha.
- "fuera_dominio": pide algo sin relación con logística (personas, música, clima, noticias). NUNCA respondas el contenido real aunque insista. Redirigí amablemente.

FORMATO:
{ "tipo": "accion_entidad" | "conversacion" | "fuera_dominio", "respuesta_directa": "..." }

Si tipo es "accion_entidad", "respuesta_directa" queda null.`;


const CAMPOS_NUMERICOS_TEXTO = Object.entries(CATALOGO_ENTIDADES)
  .filter(([, cfg]) => cfg.camposNumericos?.length)
  .map(([entidad, cfg]) => `${entidad}: ${cfg.camposNumericos!.join(', ')}`)
  .join('\n');

const EXTRACTOR_SYSTEM_PROMPT = `Eres el asistente de HeltasTruck, un sistema de logística.

Devolvé SOLO un JSON válido, sin texto adicional.

ENTIDADES DISPONIBLES: ${Object.keys(CATALOGO_ENTIDADES).join(', ')}

CAMPOS NUMÉRICOS VÁLIDOS POR ENTIDAD (usar EXACTAMENTE estos nombres para "campo" en sum/avg, nunca inventes uno):
${CAMPOS_NUMERICOS_TEXTO}

REGLA: El usuario pregunta sobre datos del sistema. Identificá:
1. ENTIDAD → ¿sobre qué tabla pregunta?
   - Si pregunta "gastos" → entidad: "gastos_operativos"
   - Si pregunta "viajes" → entidad: "viajes"
   - Si pregunta "conductores" → entidad: "conductores"
2. ACCIÓN → ¿qué quiere hacer?
   - "get": listar, mostrar, ver, dame, trae
   - "count": contar, cuántos, cantidad, número de
   - "sum": sumar, total, cuánto dinero
3. FILTROS → si menciona un viaje específico, filtrar por id_viaje

EJEMPLOS:
- "gastos del viaje 5" → { entidad: "gastos_operativos", accion: "get", data: { filtros: { id_viaje: 5 } } }
- "que viaje tiene gastos" → { entidad: "gastos_operativos", accion: "get", data: { filtros: {} } }
- "cuántos gastos tiene el viaje X" → { entidad: "gastos_operativos", accion: "count", data: { filtros: { id_viaje: X } } }

FORMATO DE RESPUESTA:
{
  "status": "ok",
  "tipo": "accion_entidad",
  "entidad": "",
  "accion": "",
  "data": {
    "filtros": {},
    "campo": null
  },
  "respuesta_directa": null
}

Reglas:
- Si tipo es "conversacion" o "fuera_dominio", status siempre "ok" y completá "respuesta_directa".
- Si tipo es "accion_entidad", seguí las reglas normales de faltantes / referencias / status.`;

@Injectable()
export class IaAgenteService {
  private readonly logger = new Logger(IaAgenteService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly contexto: ContextoService,
  ) { }

  async procesarMensaje(mensaje: string, token: string, ctxRol: string, userId: string) {
    const pendiente = this.contexto.get(userId);

    // STAGE A: router liviano — solo si no hay una conversación de entidad ya en curso
    if (!pendiente) {
      const ruta = await this.llamarLlmRuta([
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: mensaje },
      ]);

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
    Si solo ves IDs, decí "el elemento con ID X" pero evitá IDs.`
      },
      { role: 'user', content: `Pregunta: ${mensaje}\nResultado: ${JSON.stringify(resultado)}` },
    ]);

    return { mensaje: respuestaFinal, data: resultado };
  }

  // ---------- Etapa 2 ----------

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

    console.log('========================');
    console.log('[IA] ejecutarAccion');
    console.log('Base:', base);
    console.log('Endpoint:', endpoint);
    console.log('Acción:', accion);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // 👇 TODAS las consultas van a consulta-generica
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