import CryptoJS from 'crypto-js';

/**
 * Service for handling end-to-end encryption of messages and files
 */
class EncryptionService {
  /**
   * Initialize encryption service with a user's encryption key
   * @param {string} userId - The user's ID for key storage
   */
  constructor(userId) {
    this.userId = userId;
    this.encryptionKey = this.getOrGenerateKey(userId);
  }

  /**
   * Get existing or generate new encryption key for a user
   * @param {string} userId - The user's ID
   * @returns {string} - The encryption key
   */
  getOrGenerateKey(userId) {
    // Try to get existing key from local storage
    const storedKey = localStorage.getItem(`encryption_key_${userId}`);
    
    if (storedKey) {
      return storedKey;
    }
    
    // Generate a new random key if none exists
    const newKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
    localStorage.setItem(`encryption_key_${userId}`, newKey);
    return newKey;
  }

  /**
   * Create a secure key for a specific conversation
   * @param {string} userId - The current user's ID
   * @param {string} receiverId - The recipient's ID
   * @returns {string} - Conversation-specific key
   */
  generateConversationKey(userId, receiverId) {
    // Sort IDs to ensure same key regardless of who initiates
    const sortedIds = [userId, receiverId].sort().join('_');
    return CryptoJS.SHA256(sortedIds + this.encryptionKey).toString();
  }

  /**
   * Encrypt a message
   * @param {string} message - The plain text message to encrypt
   * @param {string} receiverId - The recipient's ID
   * @returns {string} - Encrypted message string
   */
  encryptMessage(message, receiverId) {
    if (!message) return '';
    
    const conversationKey = this.generateConversationKey(this.userId, receiverId);
    return CryptoJS.AES.encrypt(message, conversationKey).toString();
  }

  /**
   * Decrypt a message
   * @param {string} encryptedMessage - The encrypted message
   * @param {string} senderId - The sender's ID
   * @returns {string} - Decrypted message
   */
  decryptMessage(encryptedMessage, senderId) {
    if (!encryptedMessage) return '';
    
    try {
      const conversationKey = this.generateConversationKey(this.userId, senderId);
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, conversationKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted message]';
    }
  }

  /**
   * Encrypt file data before upload
   * @param {string} fileData - Base64 data of the file
   * @param {string} receiverId - The recipient's ID
   * @returns {string} - Encrypted file data
   */
  encryptFile(fileData, receiverId) {
    if (!fileData) return '';
    
    const conversationKey = this.generateConversationKey(this.userId, receiverId);
    return CryptoJS.AES.encrypt(fileData, conversationKey).toString();
  }

  /**
   * Decrypt file data after download
   * @param {string} encryptedData - The encrypted file data
   * @param {string} senderId - The sender's ID
   * @returns {string} - Decrypted file data
   */
  decryptFile(encryptedData, senderId) {
    if (!encryptedData) return '';
    
    try {
      const conversationKey = this.generateConversationKey(this.userId, senderId);
      const bytes = CryptoJS.AES.decrypt(encryptedData, conversationKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('File decryption error:', error);
      return null;
    }
  }

  /**
   * Generate a key for a group conversation
   * @param {string} groupId - The group ID
   * @returns {string} - Group-specific encryption key
   */
  generateGroupKey(groupId) {
    return CryptoJS.SHA256(groupId + this.encryptionKey).toString();
  }

  /**
   * Encrypt a message for a group
   * @param {string} message - The plain text message
   * @param {string} groupId - The group ID
   * @returns {string} - Encrypted message
   */
  encryptGroupMessage(message, groupId) {
    if (!message) return '';
    
    const groupKey = this.generateGroupKey(groupId);
    return CryptoJS.AES.encrypt(message, groupKey).toString();
  }

  /**
   * Decrypt a group message
   * @param {string} encryptedMessage - The encrypted message
   * @param {string} groupId - The group ID
   * @returns {string} - Decrypted message
   */
  decryptGroupMessage(encryptedMessage, groupId) {
    if (!encryptedMessage) return '';
    
    try {
      const groupKey = this.generateGroupKey(groupId);
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, groupKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Group message decryption error:', error);
      return '[Encrypted message]';
    }
  }

  /**
   * Encrypt file data for a group
   * @param {string} fileData - Base64 file data
   * @param {string} groupId - The group ID
   * @returns {string} - Encrypted file data
   */
  encryptGroupFile(fileData, groupId) {
    if (!fileData) return '';
    
    const groupKey = this.generateGroupKey(groupId);
    return CryptoJS.AES.encrypt(fileData, groupKey).toString();
  }

  /**
   * Decrypt file data from a group
   * @param {string} encryptedData - The encrypted file data
   * @param {string} groupId - The group ID
   * @returns {string} - Decrypted file data
   */
  decryptGroupFile(encryptedData, groupId) {
    if (!encryptedData) return '';
    
    try {
      const groupKey = this.generateGroupKey(groupId);
      const bytes = CryptoJS.AES.decrypt(encryptedData, groupKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Group file decryption error:', error);
      return null;
    }
  }
}

export default EncryptionService; 