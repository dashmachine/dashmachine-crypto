// imports
const Dashcore = require('dashcore-lib');
const ECIES = require('bitcore-ecies-dash');
const crypto = require('crypto');


/**
 * DashmachineCrypto performs ECIES encryption & decryption and Double SHA256 Hashing. Note the class contains only static methods so you do not have to call the contructor, i.e. use DashmachineCrypto.encrypt, not new DashmachineCrypto() 
 * @class DashmachineCrypto
 * @hideconstructor
 * @example
 * <!-- Usage in HTML file -->
 * <script src="dashmachine-crypto-lib.js" type="text/javascript"></script>
  <script>
    const vendorPrivateKey = '40148175614f062fb0b4e5c519be7b6f57b872ebb55ea719376322fd12547bff'
    const message = 'hello';
    const userPubicKey = 'A7GGInyvn7ExXkSVg+OFhbhVjEMhIFv0oyeJl03gFDRo'
    const userPrivateKey = '219c8a8f9376750cee9f06e0409718f2a1b88df4acc61bf9ed9cf252c8602768'
    const vendorPublicKey = 'A0/qSE6tis4l6BtQlTXB2PHW+WV+Iy0rpF5hAvX8hDRz'
    console.log(`Encrypting message "${message}"...`);
    const encrypted = DashmachineCrypto.encrypt(vendorPrivateKey, message, userPubicKey);
    console.dir(encrypted.data);
    console.log(`Decrypting result message "${message}"...`);
    const decrypted = DashmachineCrypto.decrypt(userPrivateKey, encrypted.data, vendorPublicKey);
    console.dir(decrypted);
    console.log(`Hashing message "${message}"...`);
    const digest = DashmachineCrypto.hash(message);
    console.dir(digest.data);
    console.log(`Verifying hash...`);
    const verifies = DashmachineCrypto.verify(message, digest.data);
    console.dir(verifies.success)
  </script>
 * @example
    //use in nodejs
    const DashmachineCrypto = require("dashmachine-crypto")

    const vendorPrivateKey = '40148175614f062fb0b4e5c519be7b6f57b872ebb55ea719376322fd12547bff'
    const message = 'hello';
    const userPubicKey = 'A7GGInyvn7ExXkSVg+OFhbhVjEMhIFv0oyeJl03gFDRo'
    const userPrivateKey = '219c8a8f9376750cee9f06e0409718f2a1b88df4acc61bf9ed9cf252c8602768'
    const vendorPublicKey = 'A0/qSE6tis4l6BtQlTXB2PHW+WV+Iy0rpF5hAvX8hDRz'
    console.log(`Encrypting message "${message}"...`);
    const encrypted = DashmachineCrypto.encrypt(vendorPrivateKey, message, userPubicKey);
    console.dir(encrypted.data);
    console.log(`Decrypting result message "${message}"...`);
    const decrypted = DashmachineCrypto.decrypt(userPrivateKey, encrypted.data, vendorPublicKey);
    console.dir(decrypted);
    console.log('decrypted', decrypted.data);
 * 
 */
module.exports = class DashmachineCrypto {

    /**
     * 
     * @static encrypt Encrypt a message for specific user
     * 
     * @param {string} senderPrivateKey The base64 repesentation of the HD private key of the Dash User sending the message, the result of calling client.account.getIdentityHDKey(0, 'user').privateKey where client is an instance of Dash.Client 
     * @param {string} message message to encrypt
     * @param {object} recipientPublicKey The base64 repesentation of the public key for the Identity of the Dash User receiveing the message
     * @returns {Object} Either {success: true, data: [encrypted message]} or {error: true, message: [error message]}
     */
    static encrypt(senderPrivateKey, message, recipientPublicKey) {
        //console.log(`encrypting following message:\n${message}`);
        try {
            //Convert Keys to DER format using Dashcore Library
            const recipientPublicKeyBuffer = Buffer.from(recipientPublicKey, 'base64')
            //console.log(`recipientPublicKeyBuffer: ${recipientPublicKeyBuffer}`)
            const recipientPublicKeyFromBuffer = new Dashcore.PublicKey(recipientPublicKeyBuffer)
            //console.log(`recipientPublicKeyFromBuffer ${recipientPublicKeyFromBuffer}`)
            const signingKey = new Dashcore.PrivateKey(senderPrivateKey)

            //vendor encrypts
            const sender = ECIES()
                .privateKey(signingKey)
                .publicKey(recipientPublicKeyFromBuffer);

            const encrypted = sender.encrypt(message);
            //return Hex of the stringified JSON of the reult buffer
            const encryptedToHex = Buffer.from(JSON.stringify(encrypted)).toString('hex');
            //console.log(`encrypted: ${encryptedToHex}`);

            return { success: true, data: encryptedToHex };
            //return { success: true, data: encrypted};
        } catch (e) {
            //console.log(`encrypt error: ${e}`)
            return { error: true, message: e };
        }

    }


    /**
     * 
     * @static decrypt Decrypt a message for a user
     * 
     * @param {string} recipientPrivateKey The base64 repesentation of the HD private key of the Dash User receiving the message, the result of calling client.account.getIdentityHDKey(0, 'user').privateKey where client is an instance of Dash.Client 
     * @param {string} encryptedMessage message to decrypt as a hex representation of the stringified JSON of the encryption result buffer
     * @param {object} senderPublicKey The base64 repesentation of the public key for the Identity of the Dash User sending the message
     * @returns {Object} Either {success: true, data: [decrypted message]} or {error: true, message: [error message]}
     */
    static decrypt(recipientPrivateKey, encryptedMessage, senderPublicKey) {
        try {


            const senderPublicKeyBuffer = Buffer.from(senderPublicKey, 'base64')
            //console.log(`senderPublicKeyBuffer: ${senderPublicKeyBuffer}`)
            const senderPublicKeyFromBuffer = new Dashcore.PublicKey(senderPublicKeyBuffer)
            //console.log(`senderPublicKeyFromBuffer ${senderPublicKeyFromBuffer}`)

            const decryptingKey = new Dashcore.PrivateKey(recipientPrivateKey)

            const recipient = ECIES()
                .privateKey(decryptingKey)
                .publicKey(senderPublicKeyFromBuffer);

            const decrypted = recipient.decrypt(Buffer.from(JSON.parse(Buffer.from(encryptedMessage, 'hex').toString()).data));
            //console.log(`decrypted: ${decrypted}`);

            return { success: true, data: Buffer.from(decrypted).toString() };

        } catch (e) {
            //console.log(`decrypt error: ${e}`)
            return { error: true, message: e };
        }

    }
    /**
   * @static hash Double SHA Hash a message and return digest as hex 
   * 
   * @param {string} message full message to be hashed 
   * @returns {Object} Either {success: true, data: [digest]} or {error: true, message: [error message]}
   * 
   */
    static hash(message) {
        //console.log(`hashing message ${message}`);
        try {
            const hash1 = crypto
                .createHash("sha256")
                .update("message")
                .digest("hex");

            const digest = crypto
                .createHash("sha256")
                .update(hash1)
                .digest("hex");

            //console.log(`digest: ${digest}`);

            return { success: true, data: digest };
        } catch (e) {
            //console.log(`hash error: ${e}`)
            return { error: true, message: e };
        }
    }


    /**
     * @static verify Double SHA Hash a message and compare against input 
     * 
     * @param {string} message full message to be hashed 
     * @param {string} digest digest to compare
     * @@returns {Object} Either {success: [result]} or {error: true, message: [error message]} 
     */
    static verify(message, digest) {
        //console.log(`verifying message ${message} against digest ${digest}`);
        try {
            const hashed = this.hash(message);
            if (hashed.data === digest) {
                return { success: true };
            }
            else {
                return { success: false };
            }
        } catch (e) {
            //console.log(`hash error: ${e}`)
            return { error: true, message: e };
        }
    }
}