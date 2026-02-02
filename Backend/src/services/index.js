/**
 * Exportación centralizada de servicios
 */

const reservasService = require('./reservas.service');
const menuService = require('./menu.service');
const emailService = require('./email.service');

module.exports = {
  reservasService,
  menuService,
  emailService
};
