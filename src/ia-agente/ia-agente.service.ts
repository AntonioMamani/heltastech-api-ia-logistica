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
  private ultimaVista: Map<string, string> = new Map();
  private readonly NORMALIZACION_ENTIDADES: Record<string, string> = {
    'gastos_operativos': 'detalle_gasto_viaje',
    'gastos': 'detalle_gasto_viaje',
    'componentes': 'componentes_vehiculo_insumos',
    'componente': 'componentes_vehiculo_insumos',
    'insumo': 'componentes_vehiculo_insumos',
    'insumos': 'componentes_vehiculo_insumos',
    'componentes_mantenimiento': 'componentes_vehiculo_insumos',
    'sistemas': 'sistemas_vehiculo',
    'talleres': 'talleres',
    'movimientos': 'movimientos',
    'unidades_arrastre': 'unidades_arrastre',
    'vehiculos_apoyo': 'vehiculos_apoyo',
  };

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly contexto: ContextoService,

  ) { }

  async procesarMensaje(mensaje: string, token: string, ctxRol: string, userId: string) {
    this.contexto.agregarHistorial(userId, 'user', mensaje);
    const resultado = await this.procesarMensajeInterno(mensaje, token, ctxRol, userId);
    this.contexto.agregarHistorial(userId, 'assistant', resultado.mensaje ?? '');
    return resultado;
  }

  private async procesarMensajeInterno(mensaje: string, token: string, ctxRol: string, userId: string) {
    if (/crea|actualiz|modific|edit|registr/i.test(mensaje)) {
      return { mensaje: 'Aun no puedo crear ni actualizar informacion registrada, gracias.' };
    }
    const pendiente = this.contexto.get(userId);
    const historial = this.contexto.getHistorial(userId);

    if (!pendiente) {
      const vistaKey = this.ultimaVista.get(userId);
      const vistaDesc = vistaKey ? CATALOGO_RUTAS[vistaKey]?.descripcion : null;
      const vistaContexto = vistaDesc ? `El usuario esta actualmente en la vista: "${vistaDesc}". Si el usuario pregunta sobre la vista actual o "donde esta", responde con esa informacion.` : '';

      const messages = [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
      ];

      if (vistaContexto) {
        messages.push({ role: 'system', content: vistaContexto });
      }

      messages.push(...historial);

      const ruta = await this.llamarLlmRuta(messages);

      if (ruta.tipo === 'navegacion') {
        return this.resolverNavegacion(ruta.destino ?? '', ctxRol, userId);
      }

      if (ruta.tipo !== 'accion_entidad') {
        if (ruta.tipo === 'conversacion' && /qu[eé]\s+(hora|fecha|d[ií]a)\s+es|hoy\s+es\s+qu[eé]\s+d[ií]a|qu[eé]\s+d[ií]a\s+(es|tenemos)\s+hoy/i.test(mensaje)) {
          const ahora = new Date();
          return {
            mensaje: `Hoy es ${ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Son las ${ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ¿En que te ayudo con la logistica?`
          };
        }
        return { mensaje: ruta.respuesta_directa ?? '¿En que te ayudo?' };
      }
    }

    let extraccion: ExtraccionLlm;
    try {
      if (pendiente) {
        extraccion = await this.llamarLlmJson([
          { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
          ...historial,
          {
            role: 'user',
            content: `Contexto previo: el usuario ya estaba completando un "${pendiente.accion}" de "${pendiente.entidad}" con estos datos: ${JSON.stringify(pendiente.dataAcumulada)}. Faltaba: ${pendiente.faltantes.join(', ')}. Su nueva respuesta es: "${mensaje}". Fusiona el dato nuevo con lo que ya tenia y devuelve el JSON actualizado (si todavia falta algo, segui con status "incompleto").`,
          },
        ]);
      } else {
        const vistaKey = this.ultimaVista.get(userId);
        const vistaDesc = vistaKey ? CATALOGO_RUTAS[vistaKey]?.descripcion : null;
        const vistaContexto = vistaDesc ? `El usuario esta actualmente en la vista: "${vistaDesc}".` : '';

        const messagesExtractor = [
          { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        ];

        if (vistaContexto) {
          messagesExtractor.push({ role: 'system', content: vistaContexto });
        }

        messagesExtractor.push(...historial);

        extraccion = await this.llamarLlmJson(messagesExtractor);
      }
    } catch (err) {
      this.logger.error('Error en extraccion', err);
      return { mensaje: 'No pude procesar tu solicitud, intenta reformularla.' };
    }

    if (extraccion.status === 'no_reconocido') {
      this.contexto.clear(userId);
      return { mensaje: 'No entendi la solicitud, ¿podes reformularla?' };
    }

    if (extraccion.accion === 'create' || extraccion.accion === 'update') {
      this.contexto.clear(userId);
      return { mensaje: 'Aun no puedo crear o actualizar informacion registrada, gracias.' };
    }

    if (extraccion.status === 'incompleto') {
      this.contexto.set(userId, {
        entidad: extraccion.entidad,
        accion: extraccion.accion as 'create' | 'update',
        dataAcumulada: extraccion.data,
        faltantes: extraccion.faltantes ?? [],
      });
      return { mensaje: extraccion.mensaje_usuario ?? 'Faltan datos, ¿me das mas detalle?' };
    }

    this.contexto.clear(userId);

    // Normalizacion centralizada
    if (this.NORMALIZACION_ENTIDADES[extraccion.entidad]) {
      extraccion.entidad = this.NORMALIZACION_ENTIDADES[extraccion.entidad];
    }

    const entidadConfig = CATALOGO_ENTIDADES[extraccion.entidad];
    if (!entidadConfig) {
      return { mensaje: `Todavia no puedo gestionar "${extraccion.entidad}".` };
    }

    if (extraccion.tipo === 'conversacion' || extraccion.tipo === 'fuera_dominio') {
      return { mensaje: extraccion.respuesta_directa ?? 'Hola. ¿En que te puedo ayudar hoy?' };
    }

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
    const esListaLarga = Array.isArray(resultado) && resultado.length > 5;
    const resumenParaLlm = esListaLarga
      ? { total: resultado.length, muestra: resultado.slice(0, 3) }
      : resultado;

    const respuestaFinal = await this.llamarLlmTexto([
      {
        role: 'system',
        content: `Responde en PRIMERA PERSONA, como si fueras el sistema HeltasTruck, en tono natural. Habla como si fueras yo, el asistente. Identifica los campos con nombres o codigos en lugar de IDs numericos. Si ves "codigo", "nombre", "descripcion", "placa", "numero_contrato", usalos. Si solo ves IDs, di "el elemento con ID X" pero evita IDs. Todos los resultados que recibes ya estan filtrados para excluir inactivos. Si es un conteo o listado, aclara que son "activos" (ej: "Tienes 7 conductores activos"). Si recibes "total" y "muestra", NO listes cada elemento uno por uno: solo menciona el total y comenta brevemente 1 o 2 ejemplos de la muestra, ya que el usuario vera el detalle completo en una tabla aparte.`
      },
      { role: 'user', content: `Pregunta: ${mensaje}\nResultado: ${JSON.stringify(resumenParaLlm)}` },
    ]);

    return { mensaje: respuestaFinal, data: resultado };
  }

  private normalizarTexto(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private distanciaLevenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  private palabraSimilar(a: string, b: string): boolean {
    if (a.includes(b) || b.includes(a)) return true;
    const min = Math.min(a.length, b.length);
    if (min <= 3) return a === b;
    const umbral = min <= 5 ? 1 : 2;
    return this.distanciaLevenshtein(a, b) <= umbral;
  }

  private resolverRutaPorTexto(destino: string, rolLower?: string): { clave: string; config: RutaConfig } | null {
    const palabrasTexto = this.normalizarTexto(destino).trim().split(/\s+/);
    let mejorMatch: { clave: string; config: RutaConfig; palabrasAlias: number; delRol: boolean } | null = null;

    for (const [clave, config] of Object.entries(CATALOGO_RUTAS)) {
      const delRol = !!rolLower && config.rolesPermitidos.includes(rolLower);
      for (const alias of config.alias) {
        const palabrasAlias = this.normalizarTexto(alias).split(/\s+/);
        const todasPresentes = palabrasAlias.every(palabraAlias =>
          palabrasTexto.some(palabraTexto => this.palabraSimilar(palabraTexto, palabraAlias))
        );
        if (!todasPresentes) continue;
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

  private resolverNavegacion(destino: string, ctxRol: string, userId: string) {
    const rolLower = ctxRol.toLowerCase();
    const encontrado = this.resolverRutaPorTexto(destino, rolLower);
    if (!encontrado) {
      return { mensaje: `No encontre la pantalla "${destino}". ¿Podes ser mas especifico?` };
    }
    if (!encontrado.config.rolesPermitidos.includes(rolLower)) {
      return { mensaje: `No tienes permiso para acceder a "${encontrado.config.descripcion}".` };
    }

    // Guardar la vista con su descripcion
    this.ultimaVista.set(userId, encontrado.clave);

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
        formato: (c) => c.nombre_organizacion ?? `${c.nombres} ${c.apellidoPaterno}`,
      },
    };

    const conf = mapaBusqueda[campo];
    if (!conf) {
      return { resuelto: false, mensajeUsuario: `No se como resolver la referencia "${campo}".` };
    }

    const url = `${this.config.get('BACKEND_REAL_URL')}/${conf.endpoint}`;
    try {
      const response = await firstValueFrom(this.http.get(url, { headers: { Authorization: token } }));
      const matches = response.data ?? [];
      const encontrados = matches.filter((item: any) => {
        const nombreCompleto = `${item.nombres} ${item.apellidoPaterno}`.toLowerCase();
        return nombreCompleto.includes(textoLibre.toLowerCase());
      });

      if (encontrados.length === 0) {
        return { resuelto: false, mensajeUsuario: `No encontre ningun/a "${textoLibre}".` };
      }
      if (encontrados.length > 1) {
        return { resuelto: false, mensajeUsuario: `Encontre varios: ${encontrados.map(conf.formato).join(', ')}. ¿Cual es?` };
      }
      return { resuelto: true, valores: { [conf.campoId]: encontrados[0][conf.campoId] } };
    } catch (err) {
      this.logger.error(`Error resolviendo referencia "${campo}"`, err);
      return { resuelto: false, mensajeUsuario: `Tuve un problema buscando "${textoLibre}", intenta de nuevo.` };
    }
  }
  private async ejecutarAccion(
    endpoint: string,
    accion: 'get' | 'create' | 'update' | 'count' | 'sum' | 'avg',
    payload: Record<string, any>,
    idDirecto: number | undefined,
    token: string,
  ) {
    const base = this.config.get('BACKEND_REAL_URL');
    const headers = { Authorization: token };

    if (accion === 'get' || accion === 'count' || accion === 'sum' || accion === 'avg') {
      const response = await firstValueFrom(
        this.http.post(`${base}/consulta-generica`, {
          tabla: endpoint,
          operacion: accion,
          filtros: payload.filtros || {},
          campo: payload.campo || null,
        }, { headers })
      );
      return response.data;
    }

    if (accion === 'create') {
      const response = await firstValueFrom(this.http.post(`${base}/${endpoint}`, payload, { headers }));
      return response.data;
    }

    if (accion === 'update') {
      if (!idDirecto) throw new Error('Falta el ID para actualizar');
      const response = await firstValueFrom(this.http.patch(`${base}/${endpoint}/${idDirecto}`, payload, { headers }));
      return response.data;
    }

    throw new Error(`Accion no soportada: ${accion}`);
  }

  private formatearErrorBackend(err: AxiosError) {
    const status = err.response?.status;
    const data: any = err.response?.data;
    this.logger.error(`Backend respondio ${status}`, JSON.stringify(data));

    if (status === 400) {
      return { mensaje: `Los datos no son validos: ${data?.message ?? 'revisa la informacion enviada'}.` };
    }
    if (status === 404) {
      return { mensaje: 'No encontre el recurso que quieres modificar.' };
    }
    return { mensaje: 'Tuve un problema procesando la solicitud, intenta de nuevo.' };
  }

  private async llamarLlmRuta(messages: any[]): Promise<RutaLlm> {
    const texto = await this.llamarLlmTexto(messages, 0.1);
    try {
      return JSON.parse(texto.replace(/```json|```/g, '').trim());
    } catch {
      this.logger.warn('Router no devolvio JSON valido: ' + texto);
      return { tipo: 'accion_entidad', respuesta_directa: null };
    }
  }

  private async llamarLlmJson(messages: any[]): Promise<ExtraccionLlm> {
    const texto = await this.llamarLlmTexto(messages, 0.1);
    try {
      return JSON.parse(texto.replace(/```json|```/g, '').trim());
    } catch {
      this.logger.warn('LLM no devolvio JSON valido: ' + texto);
      return {
        status: 'no_reconocido',
        tipo: 'fuera_dominio',
        entidad: '',
        accion: 'get',
        data: {},
        respuesta_directa: 'No pude procesar tu solicitud, intenta reformularla.',
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