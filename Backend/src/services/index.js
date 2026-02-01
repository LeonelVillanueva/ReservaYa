/**
 * Exportación centralizada de servicios
 */

const reservasService = require('./reservas.service');
const menuService = require('./menu.service');

module.exports = {
  reservasService,
  menuService
};
