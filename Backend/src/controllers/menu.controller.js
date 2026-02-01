const { supabase } = require('../config/supabase');

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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  // === PLATOS ===

  async getPlatos(req, res) {
    try {
      const { categoria_id, disponible } = req.query;
      
      let query = supabase
        .from('platos')
        .select(`
          *,
          categoria:categorias_plato(id, nombre)
        `);
      
      if (categoria_id) query = query.eq('categoria_id', categoria_id);
      if (disponible !== undefined) query = query.eq('disponible', disponible === 'true');
      
      const { data, error } = await query.order('nombre');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      if (!plato) return res.status(404).json({ error: 'Plato no encontrado' });
      
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
      res.status(500).json({ error: error.message });
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
        const platoIngredientes = ingredientes.map(ing => ({
          plato_id: plato.id,
          ingrediente_id: ing.ingrediente_id,
          cantidad: ing.cantidad
        }));
        
        const { error: errIng } = await supabase
          .from('plato_ingrediente')
          .insert(platoIngredientes);
        
        if (errIng) throw errIng;
      }
      
      res.status(201).json(plato);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updatePlato(req, res) {
    try {
      const { id } = req.params;
      const { categoria_id, nombre, descripcion, precio, disponible, imagen_url } = req.body;
      
      const { data, error } = await supabase
        .from('platos')
        .update({ categoria_id, nombre, descripcion, precio, disponible, imagen_url })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  // === INGREDIENTES ===

  async getIngredientes(req, res) {
    try {
      const { data, error } = await supabase
        .from('ingredientes')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createIngrediente(req, res) {
    try {
      const { nombre, es_alergeno = false } = req.body;
      
      const { data, error } = await supabase
        .from('ingredientes')
        .insert({ nombre, es_alergeno })
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  // Platos seguros para un usuario (sin sus alérgenos)
  async getPlatosSeguros(req, res) {
    try {
      const { usuario_id } = req.params;
      
      // 1. Obtener alergias del usuario
      const { data: alergiasUsuario, error: errAlergias } = await supabase
        .from('usuario_alergia')
        .select('alergia:alergias(nombre)')
        .eq('usuario_id', usuario_id);
      
      if (errAlergias) throw errAlergias;
      
      const nombresAlergias = alergiasUsuario.map(a => a.alergia.nombre.toLowerCase());
      
      // 2. Obtener todos los platos disponibles con ingredientes
      const { data: platos, error: errPlatos } = await supabase
        .from('platos')
        .select(`
          *,
          ingredientes:plato_ingrediente(
            ingrediente:ingredientes(nombre, es_alergeno)
          )
        `)
        .eq('disponible', true);
      
      if (errPlatos) throw errPlatos;
      
      // 3. Filtrar platos que NO contengan ingredientes con alérgenos del usuario
      const platosSeguros = platos.filter(plato => {
        const ingredientesPlato = plato.ingredientes || [];
        return !ingredientesPlato.some(pi => {
          const ing = pi.ingrediente;
          return ing.es_alergeno && nombresAlergias.some(al => ing.nombre.toLowerCase().includes(al));
        });
      });
      
      res.json(platosSeguros);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = menuController;
