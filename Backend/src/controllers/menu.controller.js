const { supabase } = require('../config/supabase');
const menuService = require('../services/menu.service');
const { success, created, error: sendError, notFound, conflict } = require('../utils/responses');

/**
 * Helper: detecta errores de constraint unique de PostgreSQL (23505)
 * y devuelve un mensaje amigable. Retorna true si manejó el error.
 */
function handleDuplicateError(res, error, entidad) {
  if (error.code === '23505') {
    return conflict(res, `Ya existe un(a) ${entidad} con ese nombre.`);
  }
  return null;
}


const menuController = {
  // === CATEGORÍAS ===

  async getCategorias(req, res) {
    try {
      const { data, error } = await supabase
        .from('categorias_plato')
        .select('*')
        .order('orden');

      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  async createCategoria(req, res) {
    try {
      const { nombre, descripcion, orden } = req.body;

      const { data, error } = await supabase
        .from('categorias_plato')
        .insert({ nombre, descripcion, orden })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'categoría')) return;
      sendError(res, error.message);
    }
  },

  async updateCategoria(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, orden } = req.body;

      const { data, error } = await supabase
        .from('categorias_plato')
        .update({ nombre, descripcion, orden })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'categoría')) return;
      sendError(res, error.message);
    }
  },

  async deleteCategoria(req, res) {
    try {
      const { id } = req.params;

      // Verificar si tiene platos asociados (consulta real, no count)
      const { data: platosAsociados, error: errCheck } = await supabase
        .from('platos')
        .select('id')
        .eq('categoria_id', id);

      if (errCheck) throw errCheck;
      if (platosAsociados && platosAsociados.length > 0) {
        return sendError(res, `No se puede eliminar: la categoría tiene ${platosAsociados.length} plato(s) asociado(s). Reasígnalos primero.`, 400);
      }

      const { error } = await supabase
        .from('categorias_plato')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // === PLATOS ===

  async getPlatos(req, res) {
    try {
      const { categoria_id, disponible, page, limit = 20 } = req.query;

      let query = supabase
        .from('platos')
        .select(`
          *,
          categoria:categorias_plato(id, nombre)
        `, { count: 'exact' });

      if (categoria_id) query = query.eq('categoria_id', categoria_id);
      if (disponible !== undefined) query = query.eq('disponible', disponible === 'true');

      query = query.order('nombre');

      // Paginación: solo si se envía el parámetro page
      if (page) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return res.json({ data, total: count, page: pageNum, limit: limitNum });
      }

      // Sin paginación: devolver array completo
      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  async getPlatoById(req, res) {
    try {
      const { id } = req.params;

      // Obtener plato
      const { data: plato, error: errPlato } = await supabase
        .from('platos')
        .select(`
          *,
          categoria:categorias_plato(id, nombre)
        `)
        .eq('id', id)
        .single();

      if (errPlato) throw errPlato;
      if (!plato) return notFound(res, 'Plato no encontrado');

      // Obtener ingredientes del plato
      const { data: ingredientes, error: errIng } = await supabase
        .from('plato_ingrediente')
        .select(`
          cantidad,
          ingrediente:ingredientes(id, nombre, es_alergeno)
        `)
        .eq('plato_id', id);

      if (errIng) throw errIng;

      res.json({ ...plato, ingredientes });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  async createPlato(req, res) {
    try {
      const { categoria_id, nombre, descripcion, precio, disponible, imagen_url, ingredientes } = req.body;

      // 1. Crear plato
      const { data: plato, error: errPlato } = await supabase
        .from('platos')
        .insert({ categoria_id, nombre, descripcion, precio, disponible, imagen_url })
        .select()
        .single();

      if (errPlato) throw errPlato;

      // 2. Asociar ingredientes si vienen
      if (ingredientes && ingredientes.length > 0) {
        // Validar que todos tengan cantidad > 0
        const sinCantidad = ingredientes.filter(ing => !ing.cantidad || ing.cantidad <= 0);
        if (sinCantidad.length > 0) {
          return sendError(res, 'Todos los ingredientes deben tener una cantidad en gramos mayor a 0.', 400);
        }

        const platoIngredientes = ingredientes.map(ing => ({
          plato_id: plato.id,
          ingrediente_id: ing.ingrediente_id,
          cantidad: ing.cantidad,
        }));

        const { error: errIng } = await supabase
          .from('plato_ingrediente')
          .insert(platoIngredientes);

        if (errIng) throw errIng;
      }

      res.status(201).json(plato);
    } catch (error) {
      if (handleDuplicateError(res, error, 'plato')) return;
      sendError(res, error.message);
    }
  },

  async updatePlato(req, res) {
    try {
      const { id } = req.params;
      const { categoria_id, nombre, descripcion, precio, disponible, imagen_url, ingredientes } = req.body;

      const { data, error } = await supabase
        .from('platos')
        .update({ categoria_id, nombre, descripcion, precio, disponible, imagen_url })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar ingredientes si se proporcionan
      if (ingredientes !== undefined) {
        await menuService.actualizarIngredientesPlato(id, ingredientes);
      }

      res.json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'plato')) return;
      sendError(res, error.message);
    }
  },

  async deletePlato(req, res) {
    try {
      const { id } = req.params;

      // 1. Obtener imagen_url para que el frontend pueda limpiar Storage
      const { data: plato, error: errGet } = await supabase
        .from('platos')
        .select('imagen_url')
        .eq('id', id)
        .single();

      if (errGet) throw errGet;

      // 2. Eliminar ingredientes asociados
      await supabase
        .from('plato_ingrediente')
        .delete()
        .eq('plato_id', id);

      // 3. Eliminar el plato
      const { error } = await supabase
        .from('platos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        message: 'Plato eliminado correctamente',
        imagen_url: plato?.imagen_url || null,
      });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  async toggleDisponibilidad(req, res) {
    try {
      const { id } = req.params;
      const { disponible } = req.body;

      const { data, error } = await supabase
        .from('platos')
        .update({ disponible })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // === INGREDIENTES ===

  async getIngredientes(req, res) {
    try {
      // Intentar cargar con relación de alergias (tabla ingrediente_alergia)
      let { data, error } = await supabase
        .from('ingredientes')
        .select(`
          *,
          alergias:ingrediente_alergia(
            alergia:alergias(id, nombre)
          )
        `)
        .order('nombre');

      // Si falla la relación (tabla no existe), cargar sin ella
      if (error) {
        const fallback = await supabase
          .from('ingredientes')
          .select('*')
          .order('nombre');

        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  async createIngrediente(req, res) {
    try {
      const { nombre, es_alergeno = false, alergia_ids = [] } = req.body;

      // Crear ingrediente (es_alergeno = true si tiene alergias vinculadas)
      const { data, error } = await supabase
        .from('ingredientes')
        .insert({ nombre, es_alergeno: alergia_ids.length > 0 || es_alergeno })
        .select()
        .single();

      if (error) throw error;

      // Asociar alergias si se proporcionan
      if (alergia_ids.length > 0) {
        const registros = alergia_ids.map(alergia_id => ({
          ingrediente_id: data.id,
          alergia_id,
        }));

        const { error: errAl } = await supabase
          .from('ingrediente_alergia')
          .insert(registros);

        if (errAl) console.warn('Aviso: no se pudieron asociar alergias (¿tabla ingrediente_alergia existe?):', errAl.message);
      }

      res.status(201).json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'ingrediente')) return;
      sendError(res, error.message);
    }
  },

  async updateIngrediente(req, res) {
    try {
      const { id } = req.params;
      const { nombre, es_alergeno, alergia_ids } = req.body;

      // Construir objeto de actualización
      const updateData = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (alergia_ids !== undefined) {
        updateData.es_alergeno = alergia_ids.length > 0;
      } else if (es_alergeno !== undefined) {
        updateData.es_alergeno = es_alergeno;
      }

      const { data, error } = await supabase
        .from('ingredientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar alergias si se proporcionan
      if (alergia_ids !== undefined) {
        // Eliminar relaciones existentes
        const { error: errDel } = await supabase
          .from('ingrediente_alergia')
          .delete()
          .eq('ingrediente_id', id);

        if (!errDel && alergia_ids.length > 0) {
          const registros = alergia_ids.map(alergia_id => ({
            ingrediente_id: id,
            alergia_id,
          }));

          const { error: errIns } = await supabase
            .from('ingrediente_alergia')
            .insert(registros);

          if (errIns) console.warn('Aviso: no se pudieron actualizar alergias:', errIns.message);
        }
      }

      res.json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'ingrediente')) return;
      sendError(res, error.message);
    }
  },

  async deleteIngrediente(req, res) {
    try {
      const { id } = req.params;

      // Verificar si está siendo usado en platos (consulta real, no count)
      const { data: platosAsociados, error: errCheck } = await supabase
        .from('plato_ingrediente')
        .select('plato_id')
        .eq('ingrediente_id', id);

      if (errCheck) throw errCheck;
      if (platosAsociados && platosAsociados.length > 0) {
        return sendError(res, `No se puede eliminar: el ingrediente está asociado a ${platosAsociados.length} plato(s). Retíralo de los platos primero.`, 400);
      }

      // Eliminar relaciones con alergias (si la tabla existe)
      const { error: errAl } = await supabase
        .from('ingrediente_alergia')
        .delete()
        .eq('ingrediente_id', id);

      if (errAl) console.warn('Aviso al eliminar alergias de ingrediente:', errAl.message);

      // Eliminar ingrediente
      const { error } = await supabase
        .from('ingredientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Ingrediente eliminado correctamente' });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // === ALERGIAS ===

  async getAlergias(req, res) {
    try {
      const { data, error } = await supabase
        .from('alergias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  async createAlergia(req, res) {
    try {
      const { nombre } = req.body;

      const { data, error } = await supabase
        .from('alergias')
        .insert({ nombre })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'alergia')) return;
      sendError(res, error.message);
    }
  },

  async updateAlergia(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      const { data, error } = await supabase
        .from('alergias')
        .update({ nombre })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      if (handleDuplicateError(res, error, 'alergia')) return;
      sendError(res, error.message);
    }
  },

  async deleteAlergia(req, res) {
    try {
      const { id } = req.params;

      // Verificar si está asociada a ingredientes (con nombres para mensaje claro)
      const { data: ingAsociados, error: errIng } = await supabase
        .from('ingrediente_alergia')
        .select('ingrediente:ingredientes(id, nombre)')
        .eq('alergia_id', id);

      if (!errIng && ingAsociados && ingAsociados.length > 0) {
        const nombres = ingAsociados
          .map(r => r.ingrediente?.nombre)
          .filter(Boolean)
          .slice(0, 5);
        const lista = nombres.join(', ');
        const extra = ingAsociados.length > 5 ? ` y ${ingAsociados.length - 5} más` : '';
        return sendError(res, `No se puede eliminar: la alergia está asociada a los ingredientes: ${lista}${extra}. Ve a Ingredientes y edita cada uno para desvincular esta alergia primero.`, 400);
      }

      // Verificar si está asociada a usuarios
      const { data: usrAsociados, error: errUsr } = await supabase
        .from('usuario_alergia')
        .select('usuario_id')
        .eq('alergia_id', id);

      if (!errUsr && usrAsociados && usrAsociados.length > 0) {
        return sendError(res, `No se puede eliminar: la alergia está registrada en ${usrAsociados.length} perfil(es) de usuario(s).`, 400);
      }

      const { error } = await supabase
        .from('alergias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Alergia eliminada correctamente' });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // Platos seguros para un usuario (sin sus alérgenos)
  async getPlatosSeguros(req, res) {
    try {
      const { usuario_id } = req.params;

      // 1. Obtener alergias del usuario
      const { data: alergiasUsuario, error: errAlergias } = await supabase
        .from('usuario_alergia')
        .select('alergia_id, alergia:alergias(nombre)')
        .eq('usuario_id', usuario_id);

      if (errAlergias) throw errAlergias;

      if (!alergiasUsuario || alergiasUsuario.length === 0) {
        // Sin alergias → todos los platos disponibles
        const { data, error } = await supabase
          .from('platos')
          .select('*, categoria:categorias_plato(id, nombre)')
          .eq('disponible', true)
          .order('nombre');
        if (error) throw error;
        return res.json(data);
      }

      const alergiaIds = alergiasUsuario.map(a => a.alergia_id);

      // 2. Intentar filtrado preciso con ingrediente_alergia
      let useFallback = false;
      let platosExcluirIds = [];

      const { data: ingredientesAlergenos, error: errIngAl } = await supabase
        .from('ingrediente_alergia')
        .select('ingrediente_id')
        .in('alergia_id', alergiaIds);

      if (errIngAl) {
        // Tabla no existe → fallback
        useFallback = true;
      } else {
        const ingredienteIds = [...new Set(ingredientesAlergenos.map(ia => ia.ingrediente_id))];

        if (ingredienteIds.length > 0) {
          const { data: platosConAlergenos, error: errPI } = await supabase
            .from('plato_ingrediente')
            .select('plato_id')
            .in('ingrediente_id', ingredienteIds);

          if (errPI) throw errPI;
          platosExcluirIds = [...new Set(platosConAlergenos.map(pi => pi.plato_id))];
        }
      }

      if (useFallback) {
        // Fallback: lógica antigua basada en coincidencia de nombres
        const nombresAlergias = alergiasUsuario
          .map(a => a.alergia?.nombre?.toLowerCase())
          .filter(Boolean);

        const { data: platos, error: errPlatos } = await supabase
          .from('platos')
          .select(`
            *,
            categoria:categorias_plato(id, nombre),
            ingredientes:plato_ingrediente(
              ingrediente:ingredientes(nombre, es_alergeno)
            )
          `)
          .eq('disponible', true);

        if (errPlatos) throw errPlatos;

        const platosSeguros = platos.filter(plato => {
          const ings = plato.ingredientes || [];
          return !ings.some(pi => {
            const ing = pi.ingrediente;
            return ing && ing.es_alergeno && nombresAlergias.some(al =>
              ing.nombre.toLowerCase().includes(al)
            );
          });
        });

        return res.json(platosSeguros);
      }

      // 3. Filtrado preciso: excluir platos con ingredientes alergénicos
      let query = supabase
        .from('platos')
        .select('*, categoria:categorias_plato(id, nombre)')
        .eq('disponible', true);

      if (platosExcluirIds.length > 0) {
        query = query.not('id', 'in', `(${platosExcluirIds.join(',')})`);
      }

      const { data: platosSeguros, error: errPlatos } = await query.order('nombre');
      if (errPlatos) throw errPlatos;

      res.json(platosSeguros);
    } catch (error) {
      sendError(res, error.message);
    }
  }
};

module.exports = menuController;
