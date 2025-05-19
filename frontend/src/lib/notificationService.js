/**
 * Service for handling browser notifications
 */
class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.isPageVisible = true;
    
    // Check if the browser supports notifications
    this.isSupported = 'Notification' in window;
    
    // Initialize page visibility detection
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this), false);
    }
    
    // Initial visibility state
    this.isPageVisible = document.visibilityState === 'visible';
    
    // Request permission on initialization
    if (this.isSupported) {
      this.requestPermission();
    }
  }
  
  /**
   * Handles visibility change events to determine if the page is in the background
   */
  handleVisibilityChange() {
    this.isPageVisible = document.visibilityState === 'visible';
  }
  
  /**
   * Request notification permission from user
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    if (!this.isSupported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Show a notification for a new message
   * @param {Object} message - The message object
   * @param {Object} sender - The sender information
   */
  showMessageNotification(message, sender) {
    // Only show notification if we have permission and browser supports it
    // Removed the check for page visibility to show notifications always
    if (!this.isSupported || !this.hasPermission) {
      return;
    }
    
    try {
      const title = `New message from ${sender.fullName}`;
      const options = {
        body: message.text ? message.text : 'Sent a file',
        icon: sender.profilePicture || '/logo.png',
        badge: '/logo.png',
        tag: `message-${message._id}`, // For replacing notifications from the same sender
        requireInteraction: false, // Auto-close after a while
      };
      
      const notification = new Notification(title, options);
      
      // Add click handler to focus the application
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  /**
   * Show a notification for a new group message
   * @param {Object} message - The message object
   * @param {Object} group - The group information
   */
  showGroupMessageNotification(message, group) {
    // Only show notification if we have permission and browser supports it
    // Removed the check for page visibility to show notifications always
    if (!this.isSupported || !this.hasPermission) {
      return;
    }
    
    try {
      const senderName = message.senderId?.fullName || 'Someone';
      const title = `${senderName} in ${group.name}`;
      const options = {
        body: message.text ? message.text : 'Sent a file',
        icon: group.groupPicture || '/logo.png',
        badge: '/logo.png',
        tag: `group-${group._id}`, // Group messages from the same group
        requireInteraction: false,
      };
      
      const notification = new Notification(title, options);
      
      // Add click handler to focus the application
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
    } catch (error) {
      console.error('Error showing group notification:', error);
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService; 