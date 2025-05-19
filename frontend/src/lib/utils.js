export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

/**
 * Handles file operations (preview or download) for various file types
 * @param {string} fileUrl - The URL of the file
 * @param {string} fileName - The original filename
 * @param {string} fileType - The type of file (image, video, audio, document)
 * @param {boolean} forceDownload - Whether to force download instead of preview
 */
export const handleFile = (fileUrl, fileName, fileType, forceDownload = false) => {
  if (!fileUrl) return;
  
  console.log("Handling file:", { fileUrl, fileName, fileType, forceDownload });
  
  // Generate a safe filename if not provided
  const safeFileName = fileName || 
    (fileType === 'document' ? 'document' : 
     fileType === 'image' ? 'image' : 
     fileType === 'video' ? 'video' : 
     fileType === 'audio' ? 'audio' : 'file');
  
  try {
    // For documents
    if (fileType === 'document') {
      // All PDFs in our app are now uploaded as raw
      const isPDF = fileUrl.includes('/documents/') && 
                    (fileName?.toLowerCase().endsWith('.pdf') || 
                     fileUrl.toLowerCase().includes('.pdf'));
      
      if (isPDF) {
        if (forceDownload) {
          // PDF Download - direct download using window.location
          window.location.href = fileUrl;
        } else {
          // PDF Preview - open in new tab
          window.open(fileUrl, '_blank');
        }
      } else {
        // For non-PDF documents, always download
        window.location.href = fileUrl;
      }
    } 
    // For media files (images, videos, audio)
    else {
      if (forceDownload) {
        // Force download for media
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      } else {
        // For preview, just open in new tab
        window.open(fileUrl, '_blank');
      }
    }
  } catch (error) {
    console.error('Error handling file:', error);
    // Fallback - just open in new tab
    window.open(fileUrl, '_blank');
  }
};