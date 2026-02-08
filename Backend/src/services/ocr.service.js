/**
 * Servicio OCR integrado: tesseract.js + sharp para verificación de comprobantes.
 * Incluye análisis de autenticidad de imagen y detección de fraude.
 * Todo corre dentro de Node.js — sin dependencias externas de Python ni binarios.
 */
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// =====================================================
// CONFIGURACIÓN
// =====================================================
const UMBRAL_CONFIANZA_MINIMO = 0.65;
const TOLERANCIA_MONTO_PORCENTAJE = 0.02; // 2%
const DIAS_MAX_ANTIGUEDAD = 5; // 5 días — da margen real para transferencias bancarias

// Software de edición conocido (detectado en EXIF)
const SOFTWARE_EDICION_SOSPECHOSO = [
  'photoshop', 'gimp', 'paint.net', 'paint', 'pixlr', 'canva',
  'illustrator', 'affinity', 'corel', 'inkscape', 'figma',
  'snapseed', 'lightroom', 'picsart', 'fotor', 'befunky',
];

// Bancos conocidos de Honduras y Centroamérica
const BANCOS_CONOCIDOS = [
  'bac', 'banco atlantida', 'atlántida', 'ficohsa', 'banpais', 'banpaís',
  'davivienda', 'bancatlan', 'bancatlán', 'banco de occidente', 'occidente',
  'banco promerica', 'promerica', 'promérica', 'lafise', 'banco lafise',
  'banco azteca', 'azteca', 'banco ficensa', 'ficensa', 'banrural',
  'banco industrial', 'industrial', 'banco de los trabajadores',
  'banhcafe', 'banhcafé', 'banco del pais', 'banco del país',
  'tigo money', 'tengo', 'banco central',
];

// Palabras clave esperadas en comprobantes bancarios
const PALABRAS_CLAVE_BANCARIAS = [
  'transferencia', 'transaccion', 'transacción', 'comprobante', 'recibo',
  'monto', 'total', 'cuenta', 'banco', 'referencia', 'autorizacion',
  'autorización', 'exitosa', 'completada', 'aprobada', 'fecha', 'hora',
  'destino', 'origen', 'beneficiario', 'ordenante', 'concepto',
  'numero', 'número', 'confirmacion', 'confirmación', 'deposito',
  'depósito', 'abono', 'pago', 'lempiras', 'lps', 'hnl',
  'saldo', 'disponible', 'operacion', 'operación', 'sucursal',
];

// Worker reutilizable (se inicializa lazy)
let _worker = null;

async function getWorker() {
  if (!_worker) {
    _worker = await Tesseract.createWorker('spa+eng');
  }
  return _worker;
}

// =====================================================
// CAPA 1: ANÁLISIS DE IMAGEN (detección de manipulación)
// =====================================================

/**
 * Analiza la imagen para detectar señales de manipulación o falsificación.
 * Usa metadatos EXIF, dimensiones, varianza de color y ELA simplificado.
 * @param {Buffer} imageBuffer
 * @returns {Object} { sospechosa, razones[], puntuacion, detalles }
 */
async function analizarImagen(imageBuffer) {
  const razones = [];
  let penalizacion = 0; // 0 = limpia, mayor = más sospechosa
  const detalles = {};

  try {
    const imagen = sharp(imageBuffer);
    const metadata = await imagen.metadata();

    detalles.formato = metadata.format;
    detalles.ancho = metadata.width;
    detalles.alto = metadata.height;

    // --- 1. Metadatos EXIF: detectar software de edición ---
    if (metadata.exif) {
      try {
        const exifStr = metadata.exif.toString('utf8', 0, Math.min(metadata.exif.length, 4096)).toLowerCase();
        const softwareDetectado = SOFTWARE_EDICION_SOSPECHOSO.find(sw => exifStr.includes(sw));
        if (softwareDetectado) {
          razones.push(`Software de edición detectado: ${softwareDetectado}`);
          penalizacion += 0.35;
          detalles.software_edicion = softwareDetectado;
        }
      } catch (_) { /* EXIF no legible, ignorar */ }
    }

    // --- 2. Dimensiones sospechosas ---
    const { width, height } = metadata;
    if (width < 200 || height < 200) {
      razones.push(`Imagen muy pequeña (${width}x${height}px)`);
      penalizacion += 0.25;
    } else if (width < 400 || height < 400) {
      razones.push(`Imagen de baja resolución (${width}x${height}px)`);
      penalizacion += 0.10;
    }

    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    if (aspectRatio > 5) {
      razones.push(`Proporción inusual (${aspectRatio.toFixed(1)}:1)`);
      penalizacion += 0.15;
    }

    // --- 3. Análisis de varianza (uniformidad sospechosa) ---
    const stats = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = stats.data;
    const totalPixels = pixels.length;

    if (totalPixels > 0) {
      // Calcular media y desviación estándar
      let suma = 0;
      for (let i = 0; i < totalPixels; i++) suma += pixels[i];
      const media = suma / totalPixels;

      let sumaVarianza = 0;
      for (let i = 0; i < totalPixels; i++) {
        const diff = pixels[i] - media;
        sumaVarianza += diff * diff;
      }
      const desviacion = Math.sqrt(sumaVarianza / totalPixels);

      detalles.media_brillo = Math.round(media);
      detalles.desviacion_std = Math.round(desviacion * 100) / 100;

      // Imagen con muy poca variación = posible fondo sólido fabricado
      if (desviacion < 15) {
        razones.push(`Imagen muy uniforme (desv. estándar: ${desviacion.toFixed(1)})`);
        penalizacion += 0.30;
      } else if (desviacion < 30) {
        razones.push(`Imagen con baja variación tonal (desv. estándar: ${desviacion.toFixed(1)})`);
        penalizacion += 0.10;
      }

      // Calcular histograma simplificado: detectar picos extremos
      const bins = new Array(16).fill(0);
      for (let i = 0; i < totalPixels; i++) {
        bins[Math.min(Math.floor(pixels[i] / 16), 15)]++;
      }
      const maxBin = Math.max(...bins);
      const porcentajePico = maxBin / totalPixels;

      detalles.porcentaje_color_dominante = Math.round(porcentajePico * 100);

      // Si más del 70% de píxeles está en un solo rango de 16 niveles
      if (porcentajePico > 0.70) {
        razones.push(`Color dominante excesivo (${(porcentajePico * 100).toFixed(0)}% de píxeles en un solo rango)`);
        penalizacion += 0.20;
      }
    }

    // --- 4. ELA simplificado (Error Level Analysis) ---
    try {
      // Recomprimir con baja calidad y comparar con original
      const originalGray = await sharp(imageBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const recomprimida = await sharp(imageBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 15 }) // Compresión agresiva
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const minLen = Math.min(originalGray.data.length, recomprimida.data.length);
      if (minLen > 0) {
        let sumaError = 0;
        let maxError = 0;
        let pixelesAltoError = 0;

        for (let i = 0; i < minLen; i++) {
          const error = Math.abs(originalGray.data[i] - recomprimida.data[i]);
          sumaError += error;
          if (error > maxError) maxError = error;
          if (error > 80) pixelesAltoError++;
        }

        const errorMedio = sumaError / minLen;
        const porcentajeAltoError = pixelesAltoError / minLen;

        detalles.ela_error_medio = Math.round(errorMedio * 100) / 100;
        detalles.ela_porcentaje_alto_error = Math.round(porcentajeAltoError * 10000) / 100;

        // Zonas con error muy alto pueden indicar edición
        if (porcentajeAltoError > 0.15) {
          razones.push(`Inconsistencias detectadas en la imagen (ELA: ${(porcentajeAltoError * 100).toFixed(1)}% zonas sospechosas)`);
          penalizacion += 0.20;
        }
      }
    } catch (_) {
      // ELA falló, no penalizar
    }

    // --- 5. Análisis de ruido por cuadrantes (detecta recorte/pegado) ---
    try {
      const { width, height } = metadata;
      const GRID = 3; // Grilla 3x3
      const cuadranteW = Math.floor(width / GRID);
      const cuadranteH = Math.floor(height / GRID);

      if (cuadranteW >= 50 && cuadranteH >= 50) {
        const ruidoCuadrantes = [];

        for (let fila = 0; fila < GRID; fila++) {
          for (let col = 0; col < GRID; col++) {
            // Extraer cuadrante y calcular ruido de alta frecuencia
            const cuadrante = await sharp(imageBuffer)
              .extract({
                left: col * cuadranteW,
                top: fila * cuadranteH,
                width: cuadranteW,
                height: cuadranteH,
              })
              .grayscale()
              .raw()
              .toBuffer({ resolveWithObject: true });

            const px = cuadrante.data;
            const w = cuadrante.info.width;
            const len = px.length;

            // Calcular ruido: diferencia promedio entre píxeles adyacentes (horizontal)
            let sumaRuido = 0;
            let contadorRuido = 0;
            for (let i = 0; i < len - 1; i++) {
              // Solo comparar píxeles en la misma fila
              if ((i + 1) % w !== 0) {
                sumaRuido += Math.abs(px[i] - px[i + 1]);
                contadorRuido++;
              }
            }
            const ruidoPromedio = contadorRuido > 0 ? sumaRuido / contadorRuido : 0;
            ruidoCuadrantes.push(ruidoPromedio);
          }
        }

        // Calcular media y desviación estándar del ruido entre cuadrantes
        const mediaRuido = ruidoCuadrantes.reduce((a, b) => a + b, 0) / ruidoCuadrantes.length;
        let sumaVarRuido = 0;
        for (const r of ruidoCuadrantes) {
          sumaVarRuido += (r - mediaRuido) * (r - mediaRuido);
        }
        const desvRuido = Math.sqrt(sumaVarRuido / ruidoCuadrantes.length);

        // Coeficiente de variación del ruido (normalizado)
        const cvRuido = mediaRuido > 0 ? desvRuido / mediaRuido : 0;

        detalles.ruido_cuadrantes = ruidoCuadrantes.map(r => Math.round(r * 100) / 100);
        detalles.ruido_media = Math.round(mediaRuido * 100) / 100;
        detalles.ruido_cv = Math.round(cvRuido * 1000) / 1000;

        // CV alto = ruido muy desigual entre zonas = posible recorte/pegado
        if (cvRuido > 0.60) {
          razones.push(`Ruido inconsistente entre zonas (CV: ${cvRuido.toFixed(2)}) — posible recorte o pegado`);
          penalizacion += 0.25;
        } else if (cvRuido > 0.40) {
          razones.push(`Variación de ruido moderada entre zonas (CV: ${cvRuido.toFixed(2)})`);
          penalizacion += 0.10;
        }
      }
    } catch (_) {
      // Análisis de cuadrantes falló, no penalizar
    }

    // --- 6. Detección de bordes artificiales / líneas de recorte ---
    try {
      const { width, height } = metadata;
      // Redimensionar para análisis rápido
      const analW = Math.min(width, 600);
      const analH = Math.min(height, 600);

      const grayData = await sharp(imageBuffer)
        .resize({ width: analW, height: analH, fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const px = grayData.data;
      const w = grayData.info.width;
      const h = grayData.info.height;

      // Detectar gradientes fuertes horizontales (bordes verticales de recorte)
      let bordesFuertesH = 0;
      let bordesFuertesV = 0;
      const umbralGradiente = 60; // Diferencia significativa entre píxeles adyacentes

      // Contar gradientes fuertes horizontales por columna
      const gradPorColumna = new Array(w).fill(0);
      for (let y = 0; y < h; y++) {
        for (let x = 1; x < w; x++) {
          const grad = Math.abs(px[y * w + x] - px[y * w + x - 1]);
          if (grad > umbralGradiente) {
            gradPorColumna[x]++;
            bordesFuertesH++;
          }
        }
      }

      // Contar gradientes fuertes verticales por fila
      const gradPorFila = new Array(h).fill(0);
      for (let y = 1; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const grad = Math.abs(px[y * w + x] - px[(y - 1) * w + x]);
          if (grad > umbralGradiente) {
            gradPorFila[y]++;
            bordesFuertesV++;
          }
        }
      }

      // Detectar líneas de corte: columnas o filas con concentración anormal de bordes
      // Una línea de recorte tiene muchos bordes alineados en la misma columna/fila
      const umbralLinea = 0.50; // 50% de la dimensión debe tener bordes fuertes

      let lineasCorteV = 0; // Columnas con línea de corte vertical
      for (let x = Math.floor(w * 0.1); x < Math.floor(w * 0.9); x++) {
        // Ignorar bordes de la imagen misma (10% extremos)
        if (gradPorColumna[x] > h * umbralLinea) lineasCorteV++;
      }

      let lineasCorteH = 0; // Filas con línea de corte horizontal
      for (let y = Math.floor(h * 0.1); y < Math.floor(h * 0.9); y++) {
        if (gradPorFila[y] > w * umbralLinea) lineasCorteH++;
      }

      const totalLineasCorte = lineasCorteV + lineasCorteH;

      detalles.lineas_corte_verticales = lineasCorteV;
      detalles.lineas_corte_horizontales = lineasCorteH;
      detalles.bordes_fuertes_total = bordesFuertesH + bordesFuertesV;

      if (totalLineasCorte > 3) {
        razones.push(`${totalLineasCorte} líneas de corte detectadas (${lineasCorteV}V, ${lineasCorteH}H) — posible imagen recortada/editada`);
        penalizacion += 0.25;
      } else if (totalLineasCorte > 1) {
        razones.push(`${totalLineasCorte} posibles líneas de corte (${lineasCorteV}V, ${lineasCorteH}H)`);
        penalizacion += 0.10;
      }
    } catch (_) {
      // Detección de bordes falló, no penalizar
    }

  } catch (error) {
    console.warn('[ocr.service] Error en análisis de imagen:', error.message);
    // No penalizar si el análisis falla
  }

  // Normalizar penalización a 0-1
  penalizacion = Math.min(penalizacion, 1);

  // Puntuación de autenticidad (1 = confiable, 0 = sospechosa)
  const puntuacion = Math.round((1 - penalizacion) * 100) / 100;

  return {
    sospechosa: penalizacion >= 0.35,
    razones,
    puntuacion,
    detalles,
  };
}

// =====================================================
// CAPA 2: VALIDACIÓN DE ESTRUCTURA BANCARIA
// =====================================================

/**
 * Valida que el texto extraído tenga estructura de comprobante bancario real.
 * @param {string} texto - Texto extraído por OCR
 * @returns {Object} { estructuraOk, bancoDetectado, palabrasClaveEncontradas, cuentasDetectadas, puntuacion }
 */
function validarEstructuraBancaria(texto) {
  const textoLower = texto.toLowerCase();

  // --- Detectar banco ---
  let bancoDetectado = null;
  for (const banco of BANCOS_CONOCIDOS) {
    if (textoLower.includes(banco)) {
      bancoDetectado = banco;
      break;
    }
  }

  // --- Contar palabras clave bancarias ---
  const palabrasEncontradas = PALABRAS_CLAVE_BANCARIAS.filter(p => textoLower.includes(p));

  // --- Detectar números de cuenta ---
  const patronesCuenta = [
    /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, // 16 dígitos (tarjeta/cuenta)
    /\b\d{10,18}\b/g, // Números largos (cuentas)
    /(?:cuenta|cta)\.?\s*(?:no\.?\s*)?[:\-]?\s*(\d{6,18})/gi, // "Cuenta: 123456"
  ];

  let cuentasDetectadas = 0;
  for (const patron of patronesCuenta) {
    const matches = texto.match(patron);
    if (matches) cuentasDetectadas += matches.length;
  }

  // --- Calcular puntuación de estructura ---
  let puntuacion = 0;

  // Banco detectado: +0.30
  if (bancoDetectado) puntuacion += 0.30;

  // Palabras clave: hasta +0.40 (proporcional al número encontrado, máx 8)
  const maxPalabras = 8;
  puntuacion += 0.40 * Math.min(palabrasEncontradas.length / maxPalabras, 1);

  // Cuentas detectadas: +0.15
  if (cuentasDetectadas > 0) puntuacion += 0.15;

  // Longitud del texto: +0.15 (comprobantes reales tienen texto sustancial)
  const palabrasTotales = texto.split(/\s+/).filter(Boolean).length;
  if (palabrasTotales >= 30) {
    puntuacion += 0.15;
  } else if (palabrasTotales >= 15) {
    puntuacion += 0.08;
  }

  puntuacion = Math.round(puntuacion * 100) / 100;

  // Estructura OK si tiene al menos banco O 3+ palabras clave
  const estructuraOk = bancoDetectado !== null || palabrasEncontradas.length >= 3;

  return {
    estructuraOk,
    bancoDetectado,
    palabrasClaveEncontradas: palabrasEncontradas,
    cuentasDetectadas,
    palabrasTotales,
    puntuacion,
  };
}

// =====================================================
// PREPROCESAMIENTO DE IMAGEN (sharp)
// =====================================================

/**
 * Preprocesa la imagen para mejorar la extracción OCR.
 * Convierte a escala de grises, mejora contraste, y redimensiona si es necesario.
 */
async function preprocesarImagen(imageBuffer) {
  try {
    const processed = await sharp(imageBuffer)
      .resize({ width: 2000, withoutEnlargement: true }) // Max 2000px ancho
      .grayscale()                                        // Escala de grises
      .normalize()                                        // Mejora de contraste
      .sharpen({ sigma: 1.5 })                           // Nitidez
      .threshold(140)                                     // Binarización
      .png()                                              // Formato consistente
      .toBuffer();

    return processed;
  } catch (error) {
    console.warn('[ocr.service] Error en preprocesamiento, usando imagen original:', error.message);
    return imageBuffer;
  }
}

// =====================================================
// EXTRACCIÓN OCR (tesseract.js)
// =====================================================

/**
 * Extrae texto de una imagen usando Tesseract.js.
 * Intenta con imagen preprocesada y original, usa el resultado más completo.
 * Retorna también datos word-level para análisis de consistencia.
 */
async function extraerTexto(imageBuffer) {
  const worker = await getWorker();

  // Intentar con imagen preprocesada
  const imgProcesada = await preprocesarImagen(imageBuffer);
  const resultado1 = await worker.recognize(imgProcesada);
  const texto1 = (resultado1.data?.text || '').trim();
  const confianza1 = resultado1.data?.confidence || 0;
  const words1 = resultado1.data?.words || [];

  // Intentar también con imagen original (a veces funciona mejor)
  const resultado2 = await worker.recognize(imageBuffer);
  const texto2 = (resultado2.data?.text || '').trim();
  const confianza2 = resultado2.data?.confidence || 0;
  const words2 = resultado2.data?.words || [];

  // Usar el resultado con más texto (generalmente el más completo)
  const usarOriginal = texto2.length > texto1.length;
  const textoFinal = usarOriginal ? texto2 : texto1;
  const confianzaFinal = usarOriginal ? confianza2 : confianza1;
  const wordsFinal = usarOriginal ? words2 : words1;

  return {
    texto_completo: textoFinal,
    confianza_ocr: Math.round(confianzaFinal) / 100, // Normalizar a 0-1
    palabras_detectadas: textoFinal.split(/\s+/).filter(Boolean).length,
    words: wordsFinal, // Datos word-level para análisis de consistencia
  };
}

// =====================================================
// ANÁLISIS DE CONSISTENCIA DE TEXTO (word-level)
// =====================================================

/**
 * Analiza la consistencia del texto OCR a nivel de palabras.
 * Detecta si hay regiones con calidad de texto muy diferente (texto pegado),
 * variaciones de tamaño de fuente, espaciado irregular, y desalineación.
 * @param {Array} words - Array de words de Tesseract (con confidence, bbox, text)
 * @returns {Object} { consistente, razones[], puntuacion, detalles }
 */
function analizarConsistenciaTexto(words) {
  const resultado = {
    consistente: true,
    razones: [],
    puntuacion: 1.0, // 1 = consistente, 0 = inconsistente
    detalles: {},
  };

  if (!words || words.length < 3) {
    resultado.detalles.palabras_analizadas = words?.length || 0;
    return resultado;
  }

  // Filtrar palabras con texto significativo y bounding box válido
  const wordsValidas = words.filter(w =>
    w.text && w.text.trim().length > 1 && w.confidence > 0 && w.bbox
  );

  if (wordsValidas.length < 3) {
    resultado.detalles.palabras_analizadas = wordsValidas.length;
    return resultado;
  }

  resultado.detalles.palabras_analizadas = wordsValidas.length;
  let alertasBbox = 0; // Contador de alertas de análisis geométrico

  // =====================================================
  // 1. DISTRIBUCIÓN DE CONFIANZA POR PALABRA
  // =====================================================
  const confianzas = wordsValidas.map(w => w.confidence);
  const mediaConf = confianzas.reduce((a, b) => a + b, 0) / confianzas.length;
  let sumaVarConf = 0;
  for (const c of confianzas) sumaVarConf += (c - mediaConf) * (c - mediaConf);
  const desvConf = Math.sqrt(sumaVarConf / confianzas.length);

  resultado.detalles.confianza_media = Math.round(mediaConf * 10) / 10;
  resultado.detalles.confianza_desviacion = Math.round(desvConf * 10) / 10;

  // Umbrales más sensibles para detectar inconsistencias
  if (desvConf > 22) {
    resultado.razones.push(`Calidad de texto muy inconsistente (desv. confianza: ${desvConf.toFixed(1)})`);
    resultado.puntuacion -= 0.30;
  } else if (desvConf > 14) {
    resultado.razones.push(`Calidad de texto moderadamente variable (desv. confianza: ${desvConf.toFixed(1)})`);
    resultado.puntuacion -= 0.15;
  }

  // =====================================================
  // 2. DETECCIÓN BIMODAL (islas de alta/baja confianza)
  // =====================================================
  const umbralAlto = 88;
  const umbralBajo = 55;
  const wordsBajaConf = wordsValidas.filter(w => w.confidence < umbralBajo).length;
  const wordsAltaConf = wordsValidas.filter(w => w.confidence >= umbralAlto).length;

  resultado.detalles.palabras_alta_confianza = wordsAltaConf;
  resultado.detalles.palabras_baja_confianza = wordsBajaConf;

  const porcentajeBaja = wordsBajaConf / wordsValidas.length;
  const porcentajeAlta = wordsAltaConf / wordsValidas.length;

  if (porcentajeBaja > 0.20 && porcentajeAlta > 0.20) {
    resultado.razones.push(`Distribución bimodal de calidad: ${(porcentajeAlta * 100).toFixed(0)}% alta y ${(porcentajeBaja * 100).toFixed(0)}% baja — posible texto pegado`);
    resultado.puntuacion -= 0.25;
  }

  // =====================================================
  // 3. ANÁLISIS DE ALTURA DE TEXTO (bounding boxes)
  //    Detecta variaciones de tamaño de fuente entre líneas
  // =====================================================

  // Agrupar por líneas (se reutiliza en secciones 3, 4 y 5)
  const lineas = _agruparPorLineas(wordsValidas);
  const alturas = wordsValidas.map(w => Math.abs(w.bbox.y1 - w.bbox.y0)).filter(h => h > 2);

  if (alturas.length >= 5) {
    const mediaAltura = alturas.reduce((a, b) => a + b, 0) / alturas.length;
    let sumaVarAltura = 0;
    for (const h of alturas) sumaVarAltura += (h - mediaAltura) * (h - mediaAltura);
    const desvAltura = Math.sqrt(sumaVarAltura / alturas.length);

    // Coeficiente de variación de altura (normalizado por la media)
    const cvAltura = mediaAltura > 0 ? desvAltura / mediaAltura : 0;

    resultado.detalles.altura_media = Math.round(mediaAltura * 10) / 10;
    resultado.detalles.altura_desviacion = Math.round(desvAltura * 10) / 10;
    resultado.detalles.altura_cv = Math.round(cvAltura * 1000) / 1000;

    // CV > 0.40 = tamaños de fuente muy diferentes → sospechoso
    if (cvAltura > 0.50) {
      resultado.razones.push(`Tamaños de texto muy diferentes (CV altura: ${cvAltura.toFixed(2)}) — posible texto pegado con otra fuente`);
      resultado.puntuacion -= 0.22;
      alertasBbox++;
    } else if (cvAltura > 0.35) {
      resultado.razones.push(`Variación moderada de tamaño de texto (CV altura: ${cvAltura.toFixed(2)})`);
      resultado.puntuacion -= 0.10;
      alertasBbox++;
    }

    // Comparar alturas medias entre líneas
    if (lineas.length >= 3) {
      const alturasLineas = lineas.map(linea => {
        const hs = linea.map(w => Math.abs(w.bbox.y1 - w.bbox.y0)).filter(h => h > 2);
        return hs.length > 0 ? hs.reduce((a, b) => a + b, 0) / hs.length : 0;
      }).filter(h => h > 0);

      if (alturasLineas.length >= 3) {
        // Detectar saltos abruptos de altura entre líneas consecutivas
        let saltosAltura = 0;
        for (let i = 1; i < alturasLineas.length; i++) {
          const ratio = Math.max(alturasLineas[i], alturasLineas[i - 1]) /
                        Math.max(Math.min(alturasLineas[i], alturasLineas[i - 1]), 1);
          if (ratio > 1.5) saltosAltura++;
        }

        resultado.detalles.lineas_detectadas = lineas.length;
        resultado.detalles.saltos_altura_entre_lineas = saltosAltura;

        if (saltosAltura >= 3) {
          resultado.razones.push(`${saltosAltura} cambios bruscos de tamaño entre líneas — posible montaje`);
          resultado.puntuacion -= 0.20;
          alertasBbox++;
        } else if (saltosAltura >= 2) {
          resultado.razones.push(`${saltosAltura} cambios de tamaño entre líneas`);
          resultado.puntuacion -= 0.08;
        }
      }
    }
  }

  // =====================================================
  // 4. ANÁLISIS DE ESPACIADO ENTRE LÍNEAS
  //    Detecta saltos abruptos (cortes o pegados)
  // =====================================================

  if (lineas.length >= 4) {
    // Calcular posición Y central de cada línea
    const yCentralLineas = lineas.map(linea => {
      const ys = linea.map(w => (w.bbox.y0 + w.bbox.y1) / 2);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    }).sort((a, b) => a - b);

    // Calcular espaciado (gap) entre líneas consecutivas
    const espaciados = [];
    for (let i = 1; i < yCentralLineas.length; i++) {
      espaciados.push(yCentralLineas[i] - yCentralLineas[i - 1]);
    }

    if (espaciados.length >= 3) {
      const mediaEsp = espaciados.reduce((a, b) => a + b, 0) / espaciados.length;
      let sumaVarEsp = 0;
      for (const e of espaciados) sumaVarEsp += (e - mediaEsp) * (e - mediaEsp);
      const desvEsp = Math.sqrt(sumaVarEsp / espaciados.length);

      // Contar saltos abruptos: espaciado > 2x la media
      let saltosAbruptos = 0;
      let espaciadoMax = 0;
      for (const e of espaciados) {
        if (e > espaciadoMax) espaciadoMax = e;
        if (mediaEsp > 0 && e > mediaEsp * 2.2) saltosAbruptos++;
      }

      resultado.detalles.espaciado_medio = Math.round(mediaEsp * 10) / 10;
      resultado.detalles.espaciado_desviacion = Math.round(desvEsp * 10) / 10;
      resultado.detalles.espaciado_max = Math.round(espaciadoMax * 10) / 10;
      resultado.detalles.saltos_espaciado_abruptos = saltosAbruptos;

      if (saltosAbruptos >= 3) {
        resultado.razones.push(`${saltosAbruptos} saltos abruptos de espaciado entre líneas — posible recorte/pegado`);
        resultado.puntuacion -= 0.18;
        alertasBbox++;
      } else if (saltosAbruptos >= 2) {
        resultado.razones.push(`${saltosAbruptos} irregularidades de espaciado entre líneas`);
        resultado.puntuacion -= 0.08;
      }
    }
  }

  // =====================================================
  // 5. ANÁLISIS DE ALINEACIÓN HORIZONTAL
  //    Detecta texto desalineado (posible pegado)
  // =====================================================
  if (lineas.length >= 4) {
    // Margen izquierdo de cada línea (x0 mínimo)
    const margenesIzq = lineas.map(linea => {
      const xs = linea.map(w => w.bbox.x0);
      return Math.min(...xs);
    });

    // Calcular imagen ancho estimado (x1 máximo de todas las palabras)
    const maxX1 = Math.max(...wordsValidas.map(w => w.bbox.x1));
    const anchoEstimado = maxX1 > 0 ? maxX1 : 1;

    const mediaMargen = margenesIzq.reduce((a, b) => a + b, 0) / margenesIzq.length;
    let sumaVarMargen = 0;
    for (const m of margenesIzq) sumaVarMargen += (m - mediaMargen) * (m - mediaMargen);
    const desvMargen = Math.sqrt(sumaVarMargen / margenesIzq.length);

    // Líneas significativamente desalineadas (margen > 20% del ancho respecto a la media)
    const umbralDesalineacion = anchoEstimado * 0.18;
    const lineasDesalineadas = margenesIzq.filter(m => Math.abs(m - mediaMargen) > umbralDesalineacion).length;

    resultado.detalles.alineacion_desviacion = Math.round(desvMargen * 10) / 10;
    resultado.detalles.lineas_desalineadas = lineasDesalineadas;

    if (lineasDesalineadas >= 3) {
      resultado.razones.push(`${lineasDesalineadas} líneas con alineación horizontal irregular — posible texto de fuentes distintas`);
      resultado.puntuacion -= 0.15;
      alertasBbox++;
    } else if (lineasDesalineadas >= 2) {
      resultado.razones.push(`${lineasDesalineadas} líneas ligeramente desalineadas`);
      resultado.puntuacion -= 0.06;
    }
  }

  // =====================================================
  // 6. ANÁLISIS ESPACIAL POR 4 CUADRANTES
  //    Compara confianza entre cuadrantes de la imagen
  // =====================================================
  if (wordsValidas.length >= 8) {
    const yCoords = wordsValidas.map(w => (w.bbox.y0 + w.bbox.y1) / 2);
    const xCoords = wordsValidas.map(w => (w.bbox.x0 + w.bbox.x1) / 2);
    const yMed = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;
    const xMed = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;

    // 4 cuadrantes: SI (superior-izquierdo), SD, II, ID
    const cuadrantes = { SI: [], SD: [], II: [], ID: [] };
    for (let i = 0; i < wordsValidas.length; i++) {
      const arriba = yCoords[i] <= yMed;
      const izq = xCoords[i] <= xMed;
      if (arriba && izq) cuadrantes.SI.push(wordsValidas[i].confidence);
      else if (arriba && !izq) cuadrantes.SD.push(wordsValidas[i].confidence);
      else if (!arriba && izq) cuadrantes.II.push(wordsValidas[i].confidence);
      else cuadrantes.ID.push(wordsValidas[i].confidence);
    }

    // Calcular media de confianza por cuadrante (solo si tiene suficientes palabras)
    const medias = {};
    const mediasValidas = [];
    for (const [nombre, confs] of Object.entries(cuadrantes)) {
      if (confs.length >= 2) {
        const media = confs.reduce((a, b) => a + b, 0) / confs.length;
        medias[nombre] = Math.round(media * 10) / 10;
        mediasValidas.push(media);
      }
    }

    resultado.detalles.confianza_cuadrantes = medias;

    if (mediasValidas.length >= 3) {
      const maxMedia = Math.max(...mediasValidas);
      const minMedia = Math.min(...mediasValidas);
      const difCuadrantes = maxMedia - minMedia;

      resultado.detalles.diferencia_max_cuadrantes = Math.round(difCuadrantes * 10) / 10;

      if (difCuadrantes > 18) {
        resultado.razones.push(`Diferencia alta de calidad entre cuadrantes (${difCuadrantes.toFixed(0)}pts) — zonas con calidad inconsistente`);
        resultado.puntuacion -= 0.18;
      } else if (difCuadrantes > 10) {
        resultado.razones.push(`Diferencia moderada de calidad entre cuadrantes (${difCuadrantes.toFixed(0)}pts)`);
        resultado.puntuacion -= 0.07;
      }
    }
  }

  // =====================================================
  // COMBINACIÓN FINAL
  // =====================================================

  // Si 2+ análisis de bounding box alertaron, forzar inconsistente
  resultado.detalles.alertas_geometricas = alertasBbox;
  if (alertasBbox >= 2) {
    resultado.puntuacion = Math.min(resultado.puntuacion, 0.40);
    if (!resultado.razones.some(r => r.includes('múltiples'))) {
      resultado.razones.push(`Múltiples anomalías geométricas detectadas (${alertasBbox} alertas)`);
    }
  }

  // Normalizar puntuación
  resultado.puntuacion = Math.max(0, Math.round(resultado.puntuacion * 100) / 100);
  resultado.consistente = resultado.puntuacion >= 0.55;

  return resultado;
}

/**
 * Agrupa palabras por líneas basándose en la posición vertical (bbox.y0).
 * Palabras con y0 similar (dentro de tolerancia) se agrupan en la misma línea.
 * @param {Array} words - Palabras con bbox válido
 * @returns {Array<Array>} Array de líneas, cada línea es un array de palabras
 */
function _agruparPorLineas(words) {
  if (!words || words.length === 0) return [];

  // Calcular altura promedio de palabras para determinar tolerancia
  const alturas = words.map(w => Math.abs(w.bbox.y1 - w.bbox.y0)).filter(h => h > 0);
  const alturaMedia = alturas.length > 0
    ? alturas.reduce((a, b) => a + b, 0) / alturas.length
    : 15;
  const tolerancia = alturaMedia * 0.6; // 60% de la altura media como tolerancia

  // Ordenar por posición vertical
  const sorted = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0);

  const lineas = [];
  let lineaActual = [sorted[0]];
  let yLineaActual = sorted[0].bbox.y0;

  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    if (Math.abs(w.bbox.y0 - yLineaActual) <= tolerancia) {
      lineaActual.push(w);
    } else {
      if (lineaActual.length > 0) lineas.push(lineaActual);
      lineaActual = [w];
      yLineaActual = w.bbox.y0;
    }
  }
  if (lineaActual.length > 0) lineas.push(lineaActual);

  // Ordenar palabras dentro de cada línea por posición horizontal
  for (const linea of lineas) {
    linea.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  }

  return lineas;
}

// =====================================================
// VALIDADOR (portado de Python validator.py)
// =====================================================

/**
 * Extrae todos los montos numéricos del texto.
 * Soporta formatos: 150.00, 1,500.00, L 150.00, LPS 150.00, $ 150.00
 */
function extraerMontos(texto) {
  const patrones = [
    // Formato: L 1,500.00 o LPS 1,500.00 o $ 1,500.00
    /(?:L\.?|LPS|HNL|\$|USD)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))/gi,
    // Formato: 1,500.00 o 1500.00 (con decimales obligatorios)
    /(\d{1,3}(?:,\d{3})*\.\d{2})\b/g,
    // Formato: 1500.00 sin comas
    /(\d+\.\d{2})\b/g,
  ];

  const montos = [];
  const vistos = new Set();

  for (const patron of patrones) {
    let match;
    // Reset lastIndex para cada patrón
    patron.lastIndex = 0;
    while ((match = patron.exec(texto)) !== null) {
      const valor = match[1].replace(/,/g, '');
      const monto = parseFloat(valor);
      if (!isNaN(monto) && monto >= 0.01 && monto <= 1000000 && !vistos.has(monto)) {
        vistos.add(monto);
        montos.push(monto);
      }
    }
  }

  return montos;
}

/**
 * Normaliza texto para mejorar la extracción de fechas.
 * Corrige errores típicos de OCR en caracteres numéricos y separadores.
 */
function normalizarTextoParaFechas(texto) {
  let t = texto;

  // Reemplazar O/o rodeada de dígitos → 0 (error OCR muy común)
  t = t.replace(/(\d)O/g, '$10').replace(/O(\d)/g, '0$1');
  t = t.replace(/(\d)o(\d)/g, '$10$2');

  // Reemplazar l/I/| rodeada de dígitos → 1 (error OCR)
  t = t.replace(/(\d)[lI|](\d)/g, '$11$2');
  t = t.replace(/[lI|](\d{1,2}[/.\-])/g, '1$1');

  // Eliminar espacios dentro de secuencias numéricas de fecha: "0 7/02/2026" → "07/02/2026"
  t = t.replace(/(\d)\s+(\d)(\s*[/.\-]\s*\d)/g, '$1$2$3');
  t = t.replace(/(\d\s*[/.\-]\s*)(\d)\s+(\d)/g, '$1$2$3');

  // Normalizar separadores unicode (guión largo, slash especial) a ASCII
  t = t.replace(/[–—]/g, '-');
  t = t.replace(/[⁄∕／]/g, '/');

  // Eliminar espacios alrededor de separadores de fecha
  t = t.replace(/(\d)\s*([/.\-])\s*(\d)/g, '$1$2$3');

  return t;
}

/**
 * Extrae fechas del texto en múltiples formatos de comprobantes bancarios.
 * Incluye normalización de errores OCR, meses abreviados/completos en español e inglés,
 * formatos con punto, slash, guión, año de 2 y 4 dígitos, y búsqueda contextual cerca de "fecha".
 * Retorna lista de fechas en formato YYYY-MM-DD.
 */
function extraerFechas(texto) {
  // Diccionarios de meses — completos y abreviados
  const mesesEs = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
    // Abreviados
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
    jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
  };
  const mesesEn = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    // Abreviados
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  };
  const todosMeses = { ...mesesEs, ...mesesEn };

  const fechas = new Set();

  // Normalizar texto para corregir errores OCR
  const textoNorm = normalizarTextoParaFechas(texto);

  // Helper: expandir año de 2 dígitos a 4
  function expandirAnio(a) {
    if (a >= 100) return a; // Ya es 4 dígitos
    return a >= 0 && a <= 50 ? 2000 + a : 1900 + a;
  }

  // Helper: validar y agregar fecha
  function agregarFecha(dia, mes, anio) {
    anio = expandirAnio(anio);
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 && anio >= 2020 && anio <= 2035) {
      // Validación adicional: verificar que el día es válido para el mes
      const diasEnMes = new Date(anio, mes, 0).getDate();
      if (dia <= diasEnMes) {
        fechas.add(`${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
      }
    }
  }

  let m;

  // ========== PATRONES NUMÉRICOS ==========

  // 1. DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY (4 dígitos año)
  const pat1 = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/g;
  while ((m = pat1.exec(textoNorm)) !== null) {
    agregarFecha(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
  }

  // 2. DD/MM/YY o DD-MM-YY o DD.MM.YY (2 dígitos año — muy común en apps bancarias)
  const pat2 = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})(?!\d)/g;
  while ((m = pat2.exec(textoNorm)) !== null) {
    agregarFecha(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
  }

  // 3. YYYY/MM/DD o YYYY-MM-DD o YYYY.MM.DD (formato ISO)
  const pat3 = /(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/g;
  while ((m = pat3.exec(textoNorm)) !== null) {
    agregarFecha(parseInt(m[3]), parseInt(m[2]), parseInt(m[1]));
  }

  // ========== PATRONES CON MESES EN TEXTO ==========

  // 4. DD de Mes de YYYY / DD de Mes YYYY (español completo/abreviado)
  const pat4 = /(\d{1,2})\s+de\s+(\w+)\s+(?:de\s+|del?\s+)?(\d{2,4})/gi;
  while ((m = pat4.exec(texto)) !== null) {
    const mes = todosMeses[m[2].toLowerCase()];
    if (mes) agregarFecha(parseInt(m[1]), mes, parseInt(m[3]));
  }

  // 5. DD Mes YYYY / DD-Mes-YYYY / DD/Mes/YYYY (sin "de")
  const pat5 = /(\d{1,2})[\s/\-]([a-záéíóúñ]{3,10})[\s/\-.,]?\s*(\d{2,4})/gi;
  while ((m = pat5.exec(texto)) !== null) {
    const mes = todosMeses[m[2].toLowerCase()];
    if (mes) agregarFecha(parseInt(m[1]), mes, parseInt(m[3]));
  }

  // 6. Mes DD, YYYY / Mes DD YYYY (inglés)
  const pat6 = /([a-z]{3,10})\s+(\d{1,2})[,.]?\s+(\d{2,4})/gi;
  while ((m = pat6.exec(texto)) !== null) {
    const mes = todosMeses[m[1].toLowerCase()];
    if (mes) agregarFecha(parseInt(m[2]), mes, parseInt(m[3]));
  }

  // 7. DD-Mes-YY o DD/Mes/YY (abreviado con año corto)
  const pat7 = /(\d{1,2})[/\-]([a-záéíóúñ]{3,4})[/\-](\d{2,4})/gi;
  while ((m = pat7.exec(texto)) !== null) {
    const mes = todosMeses[m[2].toLowerCase()];
    if (mes) agregarFecha(parseInt(m[1]), mes, parseInt(m[3]));
  }

  // ========== BÚSQUEDA CONTEXTUAL ==========

  // 8. Buscar números de fecha cerca de la palabra "fecha" (última línea de defensa)
  if (fechas.size === 0) {
    // Buscar "fecha" o "date" seguido de algo que parece una fecha
    const patContexto = /(?:fecha|date|fcha|fec)\s*[:\-=]?\s*(.{5,30})/gi;
    while ((m = patContexto.exec(textoNorm)) !== null) {
      const fragmento = m[1];
      // Intentar extraer DD/MM/YYYY o DD/MM/YY del fragmento
      const subPat = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/;
      const sub = fragmento.match(subPat);
      if (sub) {
        agregarFecha(parseInt(sub[1]), parseInt(sub[2]), parseInt(sub[3]));
      }
    }
  }

  // 9. Última oportunidad: buscar patrón DDMMYYYY o DDMMYY sin separador (compacto)
  if (fechas.size === 0) {
    const patCompacto = /(\d{2})(\d{2})(\d{4})/g;
    while ((m = patCompacto.exec(textoNorm)) !== null) {
      const dia = parseInt(m[1]);
      const mes = parseInt(m[2]);
      const anio = parseInt(m[3]);
      // Solo aceptar si parece fecha razonable y no es un número de cuenta largo
      if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
        agregarFecha(dia, mes, anio);
      }
    }
  }

  const resultado = [...fechas];
  if (resultado.length > 0) {
    console.log(`[ocr.service] Fechas extraídas: ${resultado.join(', ')}`);
  } else {
    console.log('[ocr.service] No se encontraron fechas en el texto');
  }

  return resultado;
}

/**
 * Extrae número de referencia/transacción del comprobante.
 */
function extraerReferencia(texto) {
  const patrones = [
    /(?:ref(?:erencia)?|no\.?\s*ref(?:erencia)?|reference)\s*[:\-#]?\s*([A-Z0-9\-]{4,25})/i,
    /(?:trans(?:acci[oó]n)?|no\.?\s*trans(?:acci[oó]n)?|transaction)\s*[:\-#]?\s*([A-Z0-9\-]{4,25})/i,
    /(?:confirmaci[oó]n|confirmation|comprobante)\s*[:\-#]?\s*([A-Z0-9\-]{4,25})/i,
    /(?:autorizaci[oó]n|authorization|auth)\s*[:\-#]?\s*([A-Z0-9\-]{4,25})/i,
    /\b([A-Z]{2,4}[\-]?\d{6,15})\b/,
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) return match[1].trim();
  }

  return null;
}

/**
 * Valida un comprobante de transferencia basándose en el texto extraído
 * y los análisis de autenticidad de imagen, estructura bancaria, y consistencia de texto.
 *
 * Pesos del scoring (8 factores):
 *   Monto correcto:          0.30
 *   Fecha reciente:          0.18
 *   Referencia:              0.08
 *   Confianza OCR:           0.09
 *   Estructura bancaria:     0.13
 *   Autenticidad imagen:     0.10
 *   Consistencia de texto:   0.07  (nuevo)
 *   Bonus texto inconsist.:  penaliza (nuevo)
 */
function validarComprobante(texto, montoEsperado, confianzaOcr, analisisImagen, estructuraBancaria, consistenciaTexto) {
  const montos = extraerMontos(texto);
  const fechas = extraerFechas(texto);
  const referencia = extraerReferencia(texto);

  // --- Validar monto ---
  let montoOk = false;
  let montoEncontrado = null;
  if (montos.length > 0 && montoEsperado > 0) {
    const tolerancia = montoEsperado * TOLERANCIA_MONTO_PORCENTAJE;
    for (const m of montos) {
      if (Math.abs(m - montoEsperado) <= tolerancia) {
        montoOk = true;
        montoEncontrado = m;
        break;
      }
    }
    if (!montoOk) {
      montoEncontrado = montos.reduce((prev, curr) =>
        Math.abs(curr - montoEsperado) < Math.abs(prev - montoEsperado) ? curr : prev
      );
    }
  }

  // --- Validar fecha ---
  let fechaOk = false;
  let fechaEncontrada = null;
  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() - DIAS_MAX_ANTIGUEDAD);
  const hoyStr = hoy.toISOString().slice(0, 10);
  const limiteStr = limite.toISOString().slice(0, 10);

  if (fechas.length > 0) {
    for (const f of fechas) {
      if (f >= limiteStr && f <= hoyStr) {
        fechaOk = true;
        fechaEncontrada = f;
        break;
      }
    }
    if (!fechaOk) fechaEncontrada = fechas[0];
  }

  // --- Validar referencia ---
  const referenciaOk = referencia !== null;

  // --- Calcular confianza compuesta (8 factores) ---
  let puntuacion = 0;

  // 1. Monto: peso 0.30
  if (montoOk) {
    puntuacion += 0.30;
  } else if (montoEncontrado !== null && montoEsperado > 0) {
    const diferencia = Math.abs(montoEncontrado - montoEsperado) / montoEsperado;
    puntuacion += Math.max(0, 0.30 * (1 - diferencia));
  }

  // 2. Fecha: peso 0.18
  if (fechaOk) {
    puntuacion += 0.18;
  } else if (fechaEncontrada) {
    puntuacion += 0.07;
  }

  // 3. Referencia: peso 0.08
  if (referenciaOk) puntuacion += 0.08;

  // 4. Confianza OCR: peso 0.09
  puntuacion += 0.09 * confianzaOcr;

  // 5. Estructura bancaria: peso 0.13
  if (estructuraBancaria) {
    puntuacion += 0.13 * estructuraBancaria.puntuacion;
  }

  // 6. Autenticidad de imagen: peso 0.10
  if (analisisImagen) {
    puntuacion += 0.10 * analisisImagen.puntuacion;
  }

  // 7. Consistencia de texto: peso 0.07
  if (consistenciaTexto) {
    puntuacion += 0.07 * consistenciaTexto.puntuacion;
  }

  // 8. Penalización adicional por texto inconsistente
  const textoInconsistente = consistenciaTexto && !consistenciaTexto.consistente;
  if (textoInconsistente) {
    puntuacion = Math.max(0, puntuacion - 0.05);
  }

  const confianzaFinal = Math.round(puntuacion * 100) / 100;

  // --- Determinar validez ---
  // Requiere: confianza suficiente, monto correcto, imagen no sospechosa, texto consistente
  const imagenSospechosa = analisisImagen?.sospechosa || false;
  const valido = confianzaFinal >= UMBRAL_CONFIANZA_MINIMO && montoOk && !imagenSospechosa && !textoInconsistente;

  // --- Motivo de rechazo ---
  let motivo = null;
  if (!valido) {
    const razones = [];

    if (imagenSospechosa) {
      razones.push(`Imagen sospechosa: ${(analisisImagen.razones || []).join('; ')}`);
    }
    if (!montoOk) {
      if (montoEncontrado !== null) {
        razones.push(`Monto no coincide: encontrado ${montoEncontrado}, esperado ${montoEsperado}`);
      } else {
        razones.push('No se pudo detectar un monto en el comprobante');
      }
    }
    if (!fechaOk) {
      if (fechaEncontrada) {
        razones.push(`Fecha fuera de rango: ${fechaEncontrada}`);
      } else {
        razones.push('No se detectó fecha en el comprobante');
      }
    }
    if (!referenciaOk) {
      razones.push('No se detectó número de referencia');
    }
    if (textoInconsistente) {
      razones.push(`Texto inconsistente: ${(consistenciaTexto.razones || []).join('; ')}`);
    }
    if (estructuraBancaria && !estructuraBancaria.estructuraOk) {
      razones.push('No se reconoce estructura de comprobante bancario');
    }
    if (confianzaFinal < UMBRAL_CONFIANZA_MINIMO) {
      razones.push(`Confianza insuficiente: ${confianzaFinal}`);
    }

    motivo = razones.join('. ') || 'Verificación no superada';
  }

  return {
    valido,
    confianza: confianzaFinal,
    datos_extraidos: {
      monto: montoEncontrado,
      fecha: fechaEncontrada,
      referencia,
      texto_completo: texto,
    },
    motivo_rechazo: motivo,
    detalles_validacion: {
      monto_ok: montoOk,
      fecha_ok: fechaOk,
      referencia_ok: referenciaOk,
      estructura_ok: estructuraBancaria?.estructuraOk || false,
      imagen_sospechosa: imagenSospechosa,
      texto_inconsistente: textoInconsistente || false,
    },
  };
}

// =====================================================
// API PÚBLICA (misma interfaz que antes)
// =====================================================

/**
 * Verifica un comprobante de transferencia con análisis completo:
 *   1. Análisis de autenticidad de imagen (EXIF, dimensiones, varianza, ELA, ruido por cuadrantes, bordes)
 *   2. Extracción de texto con OCR (Tesseract.js) + datos word-level
 *   3. Análisis de consistencia de texto (calidad por región, distribución bimodal)
 *   4. Validación de estructura bancaria (banco, palabras clave, cuentas)
 *   5. Validación de datos (monto, fecha, referencia)
 *   6. Scoring integrado con 8 factores
 *
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {string} filename - Nombre original del archivo
 * @param {string} mimetype - MIME type
 * @param {number} montoEsperado - Monto esperado del anticipo
 * @param {number|null} pagoId - ID del pago (para logs)
 * @returns {Object} Resultado de la verificación
 */
async function verificarComprobante(imageBuffer, filename, mimetype, montoEsperado, pagoId = null) {
  try {
    console.log(`[ocr.service] Verificando comprobante para pago ${pagoId}, monto esperado: ${montoEsperado}`);

    // 1. Análisis de autenticidad de imagen
    console.log('[ocr.service] Paso 1/5: Analizando autenticidad de imagen...');
    const analisisImg = await analizarImagen(imageBuffer);
    console.log(`[ocr.service] Imagen: sospechosa=${analisisImg.sospechosa}, puntuación=${analisisImg.puntuacion}${analisisImg.razones.length ? ', razones: ' + analisisImg.razones.join('; ') : ''}`);

    // 2. Extraer texto con OCR (incluye datos word-level)
    console.log('[ocr.service] Paso 2/5: Extrayendo texto con OCR...');
    const resultadoOcr = await extraerTexto(imageBuffer);
    const texto = resultadoOcr.texto_completo;
    const confianzaOcr = resultadoOcr.confianza_ocr;
    console.log(`[ocr.service] OCR: ${resultadoOcr.palabras_detectadas} palabras, confianza=${confianzaOcr}`);

    if (!texto || texto.trim().length < 10) {
      return {
        valido: false,
        confianza: 0,
        datos_extraidos: { monto: null, fecha: null, referencia: null, texto_completo: texto || '' },
        motivo_rechazo: 'No se pudo extraer texto legible del comprobante. Intente con una imagen más clara.',
        analisis_imagen: {
          sospechosa: analisisImg.sospechosa,
          razones: analisisImg.razones,
          puntuacion: analisisImg.puntuacion,
          software_edicion: analisisImg.detalles.software_edicion || null,
        },
        estructura_bancaria: null,
        consistencia_texto: null,
      };
    }

    // 3. Análisis de consistencia de texto (word-level)
    console.log('[ocr.service] Paso 3/5: Analizando consistencia de texto...');
    const consistTexto = analizarConsistenciaTexto(resultadoOcr.words);
    console.log(`[ocr.service] Texto: consistente=${consistTexto.consistente}, puntuación=${consistTexto.puntuacion}${consistTexto.razones.length ? ', razones: ' + consistTexto.razones.join('; ') : ''}`);

    // 4. Validar estructura bancaria
    console.log('[ocr.service] Paso 4/5: Validando estructura bancaria...');
    const estructuraBanc = validarEstructuraBancaria(texto);
    console.log(`[ocr.service] Estructura: banco=${estructuraBanc.bancoDetectado || 'no detectado'}, palabras clave=${estructuraBanc.palabrasClaveEncontradas.length}, puntuación=${estructuraBanc.puntuacion}`);

    // 5. Validar datos extraídos con scoring integrado (8 factores)
    console.log('[ocr.service] Paso 5/5: Validando datos y calculando scoring...');
    const resultado = validarComprobante(texto, montoEsperado, confianzaOcr, analisisImg, estructuraBanc, consistTexto);

    console.log(`[ocr.service] Resultado final: valido=${resultado.valido}, confianza=${resultado.confianza}`);
    if (resultado.motivo_rechazo) {
      console.log(`[ocr.service] Motivo rechazo: ${resultado.motivo_rechazo}`);
    }

    return {
      valido: resultado.valido,
      confianza: resultado.confianza,
      datos_extraidos: {
        monto: resultado.datos_extraidos.monto,
        fecha: resultado.datos_extraidos.fecha,
        referencia: resultado.datos_extraidos.referencia,
        texto_completo: resultado.datos_extraidos.texto_completo,
      },
      motivo_rechazo: resultado.motivo_rechazo,
      detalles_validacion: resultado.detalles_validacion,
      analisis_imagen: {
        sospechosa: analisisImg.sospechosa,
        razones: analisisImg.razones,
        puntuacion: analisisImg.puntuacion,
        software_edicion: analisisImg.detalles.software_edicion || null,
        detalles: analisisImg.detalles,
      },
      estructura_bancaria: {
        banco_detectado: estructuraBanc.bancoDetectado,
        palabras_clave: estructuraBanc.palabrasClaveEncontradas,
        cuentas_detectadas: estructuraBanc.cuentasDetectadas,
        palabras_totales: estructuraBanc.palabrasTotales,
        puntuacion: estructuraBanc.puntuacion,
        estructura_ok: estructuraBanc.estructuraOk,
      },
      consistencia_texto: {
        consistente: consistTexto.consistente,
        razones: consistTexto.razones,
        puntuacion: consistTexto.puntuacion,
        detalles: consistTexto.detalles,
      },
    };
  } catch (error) {
    console.error('[ocr.service] Error procesando comprobante:', error.message);
    // En caso de error interno, enviar a revisión manual
    return {
      valido: false,
      confianza: 0,
      datos_extraidos: { monto: null, fecha: null, referencia: null, texto_completo: '' },
      motivo_rechazo: 'Error al procesar la imagen. El comprobante será revisado manualmente.',
      error_servicio: true,
      analisis_imagen: null,
      estructura_bancaria: null,
      consistencia_texto: null,
    };
  }
}

/**
 * Registra el resultado de una revisión manual (ya no necesita llamar a servicio externo).
 * Los datos se guardan en la tabla pagos.ocr_resultado directamente desde el controller.
 */
async function notificarResultadoManual(pagoId, aprobado) {
  // Ya no hay microservicio externo. El aprendizaje se basa en los datos
  // almacenados en pagos.ocr_resultado (JSONB) en Supabase.
  console.log(`[ocr.service] Resultado manual registrado: pago ${pagoId}, aprobado: ${aprobado}`);
}

// =====================================================
// MECANISMO 2A: HUELLA DIGITAL PERCEPTUAL (pHash)
// =====================================================

/**
 * Genera un hash perceptual (pHash) de una imagen.
 * Resistente a: redimensionamiento, recorte leve, cambios de brillo/contraste, compresión JPEG.
 * Algoritmo: DCT simplificado sobre imagen 8x8 en escala de grises.
 * @param {Buffer} imageBuffer
 * @returns {string} Hash hexadecimal de 16 caracteres (64 bits)
 */
async function generarPHash(imageBuffer) {
  try {
    // Redimensionar a 8x8 y convertir a escala de grises (64 píxeles)
    const { data } = await sharp(imageBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calcular la media de los 64 píxeles
    let suma = 0;
    for (let i = 0; i < 64; i++) suma += data[i];
    const media = suma / 64;

    // Generar hash: cada bit = 1 si el píxel es >= media, 0 si es < media
    let hashBits = '';
    for (let i = 0; i < 64; i++) {
      hashBits += data[i] >= media ? '1' : '0';
    }

    // Convertir bits a hexadecimal (64 bits = 16 hex chars)
    let hashHex = '';
    for (let i = 0; i < 64; i += 4) {
      hashHex += parseInt(hashBits.slice(i, i + 4), 2).toString(16);
    }

    return hashHex;
  } catch (error) {
    console.warn('[ocr.service] Error generando pHash:', error.message);
    return null;
  }
}

/**
 * Calcula la distancia de Hamming entre dos hashes perceptuales.
 * Distancia baja = imágenes similares.
 * @param {string} hash1 - Hash hex de 16 chars
 * @param {string} hash2 - Hash hex de 16 chars
 * @returns {number} Distancia (0 = idénticas, 64 = totalmente diferentes)
 */
function compararPHash(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;

  // Convertir hex a binario y contar bits diferentes
  let distancia = 0;
  for (let i = 0; i < hash1.length; i++) {
    const b1 = parseInt(hash1[i], 16);
    const b2 = parseInt(hash2[i], 16);
    // XOR y contar bits en 1 (popcount)
    let xor = b1 ^ b2;
    while (xor) {
      distancia += xor & 1;
      xor >>= 1;
    }
  }

  return distancia;
}

// =====================================================
// MECANISMO 2B: SCORING DE RIESGO POR USUARIO
// =====================================================

// Se necesita supabase para consultas — se importa lazy para evitar circular dependency
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = require('../config/supabase').supabase;
  }
  return _supabase;
}

/**
 * Calcula el nivel de riesgo de un usuario basado en su historial de pagos.
 * Factores:
 *   - Intentos fallidos recientes (últimos 30 días)
 *   - Pagos rechazados/en revisión
 *   - Tiempo entre creación de reserva y subida de comprobante
 *   - Imágenes duplicadas previas
 *
 * @param {string} usuarioId - UUID del usuario
 * @param {Object} reserva - Datos de la reserva actual (con fecha de creación)
 * @returns {Object} { nivel: 'bajo'|'medio'|'alto', puntuacion, factores[] }
 */
async function calcularRiesgoUsuario(usuarioId, reserva = null) {
  const factores = [];
  let puntuacion = 0; // 0 = sin riesgo, mayor = más riesgo

  try {
    const sb = getSupabase();

    // Obtener todos los pagos del usuario (a través de sus reservas)
    const { data: reservasUsuario } = await sb
      .from('reservas')
      .select('id')
      .eq('usuario_id', usuarioId);

    if (!reservasUsuario || reservasUsuario.length === 0) {
      // Usuario nuevo, sin historial — riesgo neutro
      return { nivel: 'bajo', puntuacion: 0, factores: ['Usuario nuevo, sin historial de pagos'] };
    }

    const reservaIds = reservasUsuario.map(r => r.id);

    const { data: pagosUsuario } = await sb
      .from('pagos')
      .select('id, estado, intentos_verificacion, ocr_resultado, comprobante_phash, reserva_id')
      .in('reserva_id', reservaIds);

    if (!pagosUsuario || pagosUsuario.length === 0) {
      return { nivel: 'bajo', puntuacion: 0, factores: ['Sin pagos previos'] };
    }

    // --- Factor 1: Pagos rechazados/fallidos ---
    const pagosFallidos = pagosUsuario.filter(p => p.estado === 'fallido').length;
    const pagosEnRevision = pagosUsuario.filter(p => p.estado === 'pendiente_revision').length;

    if (pagosFallidos >= 3) {
      factores.push(`${pagosFallidos} pagos rechazados en el historial`);
      puntuacion += 0.35;
    } else if (pagosFallidos >= 1) {
      factores.push(`${pagosFallidos} pago(s) rechazado(s) previamente`);
      puntuacion += 0.15;
    }

    if (pagosEnRevision >= 2) {
      factores.push(`${pagosEnRevision} pagos pendientes de revisión simultáneos`);
      puntuacion += 0.15;
    }

    // --- Factor 2: Intentos excesivos de verificación ---
    const totalIntentos = pagosUsuario.reduce((sum, p) => sum + (p.intentos_verificacion || 0), 0);
    const pagosConMuchosIntentos = pagosUsuario.filter(p => (p.intentos_verificacion || 0) >= 3).length;

    if (pagosConMuchosIntentos >= 2) {
      factores.push(`${pagosConMuchosIntentos} pagos con 3+ intentos de verificación`);
      puntuacion += 0.20;
    } else if (totalIntentos >= 5) {
      factores.push(`${totalIntentos} intentos de verificación en total`);
      puntuacion += 0.10;
    }

    // --- Factor 3: Detecciones previas de imagen sospechosa ---
    const imagenesSospechosas = pagosUsuario.filter(p =>
      p.ocr_resultado?.analisis_imagen?.sospechosa === true
    ).length;

    if (imagenesSospechosas >= 2) {
      factores.push(`${imagenesSospechosas} comprobantes previos con imagen sospechosa`);
      puntuacion += 0.25;
    } else if (imagenesSospechosas === 1) {
      factores.push('1 comprobante previo con imagen sospechosa');
      puntuacion += 0.10;
    }

    // --- Factor 4: Duplicados previos detectados ---
    const duplicadosPrevios = pagosUsuario.filter(p =>
      p.ocr_resultado?.referencia_duplicada === true
    ).length;

    if (duplicadosPrevios >= 1) {
      factores.push(`${duplicadosPrevios} intento(s) previo(s) con referencia duplicada`);
      puntuacion += 0.30;
    }

    // --- Factor 5: Tiempo entre creación de reserva y subida (si aplica) ---
    if (reserva) {
      // Estimar cuándo se creó la reserva usando la fecha del pago pendiente
      // Si la reserva se creó hace muy poco y ya están subiendo comprobante, es sospechoso
      // (no dio tiempo de hacer la transferencia bancaria real)
      const ahora = new Date();
      // Usar created_at de la reserva si existe, si no usar la fecha actual
      const fechaReserva = reserva.created_at ? new Date(reserva.created_at) : null;

      if (fechaReserva) {
        const segundosDesdeCreacion = (ahora - fechaReserva) / 1000;

        if (segundosDesdeCreacion < 30) {
          factores.push(`Comprobante subido ${Math.round(segundosDesdeCreacion)}s después de crear la reserva`);
          puntuacion += 0.25;
        } else if (segundosDesdeCreacion < 120) {
          factores.push(`Comprobante subido ${Math.round(segundosDesdeCreacion)}s después de crear la reserva`);
          puntuacion += 0.10;
        }
      }
    }

  } catch (error) {
    console.warn('[ocr.service] Error calculando riesgo de usuario:', error.message);
    // En caso de error, no penalizar
  }

  // Normalizar
  puntuacion = Math.min(puntuacion, 1);

  let nivel = 'bajo';
  if (puntuacion >= 0.50) nivel = 'alto';
  else if (puntuacion >= 0.25) nivel = 'medio';

  if (factores.length === 0) {
    factores.push('Historial limpio');
  }

  return {
    nivel,
    puntuacion: Math.round(puntuacion * 100) / 100,
    factores,
  };
}

module.exports = {
  verificarComprobante,
  notificarResultadoManual,
  generarPHash,
  compararPHash,
  calcularRiesgoUsuario,
};
