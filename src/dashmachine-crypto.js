// imports
const Dashcore = require('dashcore-lib');
const ECIES = require('bitcore-ecies-dash');
const crypto = require('crypto');
const DashConnection = require('./dashConnection.service');
const User = require('./user.model');
const debug = require('debug')('server:debug');


/**
 * DashmachineCrypto performs ECIES encryption & decryption and Double SHA256 Hashing. Note the class contains only static methods so you do not have to call the contructor, i.e. use DashmachineCrypto.encrypt, not new DashmachineCrypto() 
 * @class DashmachineCrypto
 * @hideconstructor
 * @example
 * <!-- Usage in HTML file -->
 * <script src="https://unpkg.com/dash"></script>
 * <script src="dashmachine-crypto-lib.js" type="text/javascript"></script>
  <script>
    const vendorPrivateKey = '40148175614f062fb0b4e5c519be7b6f57b872ebb55ea719376322fd12547bff'
    const message = 'hello';
    const userPublicKey = 'A7GGInyvn7ExXkSVg+OFhbhVjEMhIFv0oyeJl03gFDRo'
    const userPrivateKey = '219c8a8f9376750cee9f06e0409718f2a1b88df4acc61bf9ed9cf252c8602768'
    const vendorPublicKey = 'A0/qSE6tis4l6BtQlTXB2PHW+WV+Iy0rpF5hAvX8hDRz'
    console.log(`Encrypting message "${message}"...`);
    const encrypted = DashmachineCrypto.encrypt(vendorPrivateKey, message, userPublicKey);
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
    const entropy = DashmachineCrypto.generateEntropy();
    console.log(`entropy: ${entropy}`);

    const senderName = 'alice';
    const senderMnemonic = 'uniform analyst paper father soldier toe lesson fetch exhaust jazz swim response';
    const recipientName = 'bob';
    const recipientMnemonic = 'liar fee island situate deal exotic flat direct save bag fiscal news';
    const userMessage = `Hello ${recipientName}!`;
    const dpnsContractId = '295xRRRMGYyAruG39XdAibaU9jMAzxhknkkAxFE7uVkW'

    async function testUsernameEncryption() {
      try {
        console.log(`send message \"${userMessage}\" to user: ${recipientName}`)
        const encrypted = await DashmachineCrypto.encryptForUsername(userMessage, senderName, recipientName, senderMnemonic, dpnsContractId);
        console.log('encrypted:', encrypted.data);
        const decrypted = await DashmachineCrypto.decryptForUsername(encrypted.data, recipientName, senderName, recipientMnemonic, dpnsContractId)
        console.log('decrypted:', decrypted.data);
      }
      catch (e) {
        console.log('error :', e);

      }

    }

    (async () => { await testUsernameEncryption() })()
  </script>
 * @example
    //use in nodejs
    const Dashc = require('dash');
    const DashmachineCrypto = require("dashmachine-crypto")

    const vendorPrivateKey = '40148175614f062fb0b4e5c519be7b6f57b872ebb55ea719376322fd12547bff'
    const message = 'hello';
    const userPublicKey = 'A7GGInyvn7ExXkSVg+OFhbhVjEMhIFv0oyeJl03gFDRo'
    const userPrivateKey = '219c8a8f9376750cee9f06e0409718f2a1b88df4acc61bf9ed9cf252c8602768'
    const vendorPublicKey = 'A0/qSE6tis4l6BtQlTXB2PHW+WV+Iy0rpF5hAvX8hDRz'
    console.log(`Encrypting message "${message}"...`);
    const encrypted = DashmachineCrypto.encrypt(vendorPrivateKey, message, userPublicKey);
    console.dir(encrypted.data);
    console.log(`Decrypting result message "${message}"...`);
    const decrypted = DashmachineCrypto.decrypt(userPrivateKey, encrypted.data, vendorPublicKey);
    console.dir(decrypted);
    console.log('decrypted', decrypted.data);
    const entropy = DashmachineCrypto.generateEntropy();
    console.log(`entropy: ${entropy}`);

    const senderName = 'alice';
    const senderMnemonic = 'uniform analyst paper father soldier toe lesson fetch exhaust jazz swim response';
    const recipientName = 'bob';
    const recipientMnemonic = 'liar fee island situate deal exotic flat direct save bag fiscal news';
    const userMessage = `Hello ${recipientName}!`;
    const dpnsContractId = '295xRRRMGYyAruG39XdAibaU9jMAzxhknkkAxFE7uVkW'

    async function testUsernameEncryption() {
      try {
        console.log(`send message \"${userMessage}\" to user: ${recipientName}`)
        const encrypted = await DashmachineCrypto.encryptForUsername(userMessage, senderName, recipientName, senderMnemonic, dpnsContractId);
        console.log('encrypted:', encrypted.data);
        const decrypted = await DashmachineCrypto.decryptForUsername(encrypted.data, recipientName, senderName, recipientMnemonic, dpnsContractId)
        console.log('decrypted:', decrypted.data);
      }
      catch (e) {
        console.log('error :', e);

      }

    }

    (async () => { await testUsernameEncryption() })()
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
            const encryptedToHex = Buffer.from(JSON.stringify(encrypted)).toString('base64');
            //console.log(`encrypted: ${encryptedToHex}`);

            return { success: true, data: encryptedToHex };
            //return { success: true, data: encrypted};
        } catch (e) {
            //console.log(`encrypt error: ${e}`)
            //return { error: true, message: e };
            throw e;
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

            const decrypted = recipient.decrypt(Buffer.from(JSON.parse(Buffer.from(encryptedMessage, 'base64').toString()).data));
            //console.log(`decrypted: ${decrypted}`);

            return { success: true, data: Buffer.from(decrypted).toString() };

        } catch (e) {
            //console.log(`decrypt error: ${e}`)
            //return { error: true, message: e };
            throw e;
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
                .update(message)
                .digest("base64");

            const digest = crypto
                .createHash("sha256")
                .update(hash1)
                .digest("base64");

            //console.log(`digest: ${digest}`);

            return { success: true, data: digest };
        } catch (e) {
            //console.log(`hash error: ${e}`)
            //return { error: true, message: e };
            throw e;
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
            //return { error: true, message: e };
            throw e;
        }
    }

    /**
     * 
     * @static generateEntropy generates random entropy (a dash address)
     * 
     * @returns {Object} Either {success: true, data: [generated entropy]} or {error: true, message: [error message]}
     */
    static generateEntropy() {
        try {
            return new Dashcore.PublicKey(new Dashcore.PrivateKey()).toAddress().toString();
        } catch (e) {
            //console.log(`generateEntropy error: ${e}`)
            //return { error: true, message: e };
            throw e;
        }

    }

    /**
     * 
     * @static encryptForUsername return a message ECIES encrypted for the recipient's public key by the senders private key
     * @param {string} message The message to encrypt
     * @param {string} senderName DPNS username of sender
     * @param {string} recipientName DPNS username of recipient 
     * @param {string} senderMnemonic Account mnemonic of sender
     * @param {string} dpnsContractId contractId for DPNS contract
     * @returns {Object} {success: true, data: encryptedMessage} | {Error}
     */
    static async encryptForUsername(message, senderName, recipientName, senderMnemonic, dpnsContractId) {
        try {

            const users = await getUserKeys(senderName, senderMnemonic, recipientName, dpnsContractId);
            //console.dir(users);
            return {success: true, data: this.encrypt(users.privateKey, message, users.publicKey).data};

        } catch (e) {
            //console.log(`encryptForUsername error: ${e}`)
            throw e;
            //return { error: true, message: e };
        }

    }

    /**
     * 
     * @static decryptForUsername return a message ECIES encrypted for the recipient's public key by the senders private key
     * @param {string} message The message to decrypt
     * @param {string} recipientName DPNS username of recipient
     * @param {string} senderName DPNS username of sender
     * @param {string} recipientMnemonic Account mnemonic of recipient
     * @param {string} dpnsContractId contractId for DPNS contract
     * @returns {Object} {success: true, data: encryptedMessage} or {Error}
     */
    static async decryptForUsername(message, recipientName, senderName, recipientMnemonic, dpnsContractId) {
        try {

            const users = await getUserKeys(recipientName, recipientMnemonic, senderName, dpnsContractId);
            //console.dir(users);
            return {success: true, data: this.decrypt(users.privateKey, message, users.publicKey).data};

        } catch (e) {
            //console.log(`decryptForUsername error: ${e}`)
            throw e;
            //return { error: true, message: e };
        }

    }
}

async function getUserKeys(privateUserName, privateUserMnemonic, publicUserName, dpnsContractId) {
    try {
        const dashConnection = new DashConnection('testnet', privateUserMnemonic, { dpnsContract: { contractId: dpnsContractId } }, { service: '34.215.175.142:3000' });
        await dashConnection.connect();
        //get private Key
        const privateUser =  await User.find(privateUserName, dashConnection);
        //console.dir(privateUser);
        const privateKey = await dashConnection.account.getIdentityHDKey(0, 'user').privateKey;
        //console.log('privateKey:', privateKey.toString());

        //get the recipient
        const publicUser = await User.find(publicUserName, dashConnection);
        //console.dir(publicUser);
        //get public Key
        const publicKey = publicUser.data._publicKey;
        //console.log('publicKey', publicKey);
        dashConnection.disconnect();
        return {
            privateKey: privateKey,
            publicKey: publicKey
        }

    } catch (e) {
        //console.log(`getUsers error: ${e}`)
        throw e;

    }
    


}