// imports
const debug = require('debug')('server:debug');
const DataDocument = require('./dataDocument.model');

/**
 * DPNSDocument class - represents a anme registraion documents from Dash Platform Name Service
 * @class DPNSDocument
 * @extends DataDocument
 */
module.exports = class DPNSDocument extends DataDocument {
  /**
   * constructor - creates a new LoginDocument
   * @constructs DPNSDocument
   * @param dataContractId {string}
   * @param id {string}
   * @param ownerId {Object}
   * @param data {Object}
   *
   */
  constructor(dataContractId, id, ownerId, data) {
    debug(`Creating new DPNS document`);
    super(dataContractId, id, ownerId, data);
  }
};