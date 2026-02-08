/**
 * Servicio de menú - Lógica de negocio
 */

const { supabase } = require('../config/supabase');

const menuService = {
  /**
   * Verificar si un plato contiene alérgenos del usuario.
   * Usa ingrediente_alergia si existe, sino fallback por nombres.
   */
  async platoTieneAlergenosUsuario(platoId, usuarioId) {
    // Obtener alergias del usuario
    const { data: alergiasUsuario, error: errAlergias } = await supabase
      .from('usuario_alergia')
      .select('alergia_id, alergia:alergias(nombre)')
      .eq('usuario_id', usuarioId);

    if (errAlergias) throw errAlergias;
    if (!alergiasUsuario || alergiasUsuario.length === 0) return false;

    const alergiaIds = alergiasUsuario.map(a => a.alergia_id);

    // Intentar método preciso con ingrediente_alergia
    const { data: ingredientesPlato, error: errIng } = await supabase
      .from('plato_ingrediente')
      .select('ingrediente_id')
      .eq('plato_id', platoId);

    if (errIng) throw errIng;
    if (!ingredientesPlato || ingredientesPlato.length === 0) return false;

    const ingredienteIds = ingredientesPlato.map(pi => pi.ingrediente_id);

    // Buscar si alguno de esos ingredientes tiene alergias del usuario
    const { data: coincidencias, error: errIA } = await supabase
      .from('ingrediente_alergia')
      .select('ingrediente_id')
      .in('ingrediente_id', ingredienteIds)
      .in('alergia_id', alergiaIds);

    if (!errIA && coincidencias) {
      return coincidencias.length > 0;
    }

    // Fallback: lógica antigua por nombres
    const nombresAlergias = alergiasUsuario.map(a => a.alergia?.nombre?.toLowerCase()).filter(Boolean);

    const { data: ingredientes, error: errIngFull } = await supabase
      .from('plato_ingrediente')
      .select('ingrediente:ingredientes(nombre, es_alergeno)')
      .eq('plato_id', platoId);

    if (errIngFull) throw errIngFull;

    return ingredientes.some(pi => {
      const ing = pi.ingrediente;
      return ing && ing.es_alergeno && nombresAlergias.some(al =>
        ing.nombre.toLowerCase().includes(al)
      );
    });
  },

  /**
   * Verificar disponibilidad de plato
   */
  async verificarDisponibilidadPlato(platoId) {
    const { data, error } = await supabase
      .from('platos')
      .select('disponible')
      .eq('id', platoId)
      .single();

    if (error) throw error;
    return data?.disponible || false;
  },

  /**
   * Actualizar ingredientes de un plato (reemplazar todos)
   */
  async actualizarIngredientesPlato(platoId, ingredientes) {
    // Eliminar ingredientes actuales
    await supabase
      .from('plato_ingrediente')
      .delete()
      .eq('plato_id', platoId);

    // Insertar nuevos
    if (ingredientes && ingredientes.length > 0) {
      const registros = ingredientes.map(ing => ({
        plato_id: platoId,
        ingrediente_id: ing.ingrediente_id,
        cantidad: ing.cantidad || null,
      }));

      const { error } = await supabase
        .from('plato_ingrediente')
        .insert(registros);

      if (error) throw error;
    }
  },

  /**
   * Obtener ingredientes alérgenos de un plato
   */
  async obtenerAlergenosPlato(platoId) {
    const { data, error } = await supabase
      .from('plato_ingrediente')
      .select('ingrediente:ingredientes(id, nombre)')
      .eq('plato_id', platoId)
      .eq('ingredientes.es_alergeno', true);

    if (error) throw error;
    return data.map(d => d.ingrediente).filter(Boolean);
  },

  /**
   * Actualizar alergias asociadas a un ingrediente
   */
  async actualizarAlergiasIngrediente(ingredienteId, alergiaIds) {
    // Eliminar relaciones existentes
    const { error: errDel } = await supabase
      .from('ingrediente_alergia')
      .delete()
      .eq('ingrediente_id', ingredienteId);

    if (errDel) {
      console.warn('No se pudieron eliminar alergias del ingrediente:', errDel.message);
      return;
    }

    // Insertar nuevas
    if (alergiaIds && alergiaIds.length > 0) {
      const registros = alergiaIds.map(alergia_id => ({
        ingrediente_id: ingredienteId,
        alergia_id,
      }));

      const { error: errIns } = await supabase
        .from('ingrediente_alergia')
        .insert(registros);

      if (errIns) {
        console.warn('No se pudieron insertar alergias del ingrediente:', errIns.message);
      }
    }
  }
};

module.exports = menuService;
