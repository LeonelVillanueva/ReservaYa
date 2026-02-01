/**
 * Servicio de menú - Lógica de negocio
 */

const { supabase } = require('../config/supabase');

const menuService = {
  /**
   * Verificar si un plato contiene alérgenos del usuario
   */
  async platoTieneAlergenosUsuario(platoId, usuarioId) {
    // Obtener alergias del usuario
    const { data: alergiasUsuario, error: errAlergias } = await supabase
      .from('usuario_alergia')
      .select('alergia:alergias(nombre)')
      .eq('usuario_id', usuarioId);
    
    if (errAlergias) throw errAlergias;
    
    if (alergiasUsuario.length === 0) return false;
    
    const nombresAlergias = alergiasUsuario.map(a => a.alergia.nombre.toLowerCase());
    
    // Obtener ingredientes del plato
    const { data: ingredientes, error: errIng } = await supabase
      .from('plato_ingrediente')
      .select('ingrediente:ingredientes(nombre, es_alergeno)')
      .eq('plato_id', platoId);
    
    if (errIng) throw errIng;
    
    // Verificar si algún ingrediente coincide con las alergias
    return ingredientes.some(pi => {
      const ing = pi.ingrediente;
      return ing.es_alergeno && nombresAlergias.some(al => 
        ing.nombre.toLowerCase().includes(al)
      );
    });
  },

  /**
   * Verificar disponibilidad de plato según stock
   */
  async verificarDisponibilidadPlato(platoId) {
    // Por ahora solo verificar el campo disponible
    const { data, error } = await supabase
      .from('platos')
      .select('disponible')
      .eq('id', platoId)
      .single();
    
    if (error) throw error;
    return data?.disponible || false;
  },

  /**
   * Actualizar ingredientes de un plato
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
        cantidad: ing.cantidad
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
  }
};

module.exports = menuService;
