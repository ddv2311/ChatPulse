import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, FileText, Film, Music, Plus } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check file size - 10MB limit
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSizeInBytes) {
      toast.error(`File is too large. Maximum size is 10MB.`);
      e.target.value = null; // Clear the input
      return;
    }

    // Determine file type based on MIME type
    let type;
    if (selectedFile.type.startsWith("image/")) {
      type = "image";
    } else if (selectedFile.type.startsWith("video/")) {
      type = "video";
    } else if (selectedFile.type.startsWith("audio/")) {
      type = "audio";
    } else if (
      selectedFile.type.includes("pdf") || 
      selectedFile.type.includes("document") || 
      selectedFile.type.includes("sheet") || 
      selectedFile.type.includes("text")
    ) {
      type = "document";
      
      // Special handling for PDFs
      if (selectedFile.type.includes("pdf") && selectedFile.size > 5 * 1024 * 1024) {
        toast.warning("Large PDF files may take longer to upload. Please be patient.");
      }
    } else {
      toast.error("Unsupported file type");
      e.target.value = null; // Clear the input
      return;
    }

    // Read the file as base64
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = () => {
      setFilePreview({
        url: reader.result,
        type,
        name: selectedFile.name
      });
      setFileType(type);
    };
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !filePreview) return;

    // Check file size
    if (filePreview && filePreview.size > 10 * 1024 * 1024) { // If larger than 10MB
      toast.error("File is too large. Please select a file smaller than 10MB.");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        file: filePreview?.url,
        fileType,
        fileName: filePreview?.name
      });

      // Clear form
      setText("");
      setFilePreview(null);
      setFileType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const renderFilePreview = () => {
    if (!filePreview) return null;

    switch (fileType) {
      case "image":
        return (
          <img
            src={filePreview.url}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
          />
        );
      case "video":
        return (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-base-300 border border-zinc-700">
            <Film className="size-5 text-accent" />
            <span className="text-xs truncate max-w-32">{filePreview.name}</span>
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-base-300 border border-zinc-700">
            <Music className="size-5 text-accent" />
            <span className="text-xs truncate max-w-32">{filePreview.name}</span>
          </div>
        );
      case "document":
        return (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-base-300 border border-zinc-700">
            <FileText className="size-5 text-accent" />
            <span className="text-xs truncate max-w-32">{filePreview.name}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 w-full">
      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {renderFilePreview()}
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          <div className="dropdown dropdown-top dropdown-end">
            <button
              type="button"
              tabIndex={0}
              className="hidden sm:flex btn btn-circle btn-sm text-zinc-400"
            >
              <Plus size={20} />
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
              <li><button type="button" onClick={() => fileInputRef.current?.click()}><Image size={16} />Image</button></li>
              <li><button type="button" onClick={() => { fileInputRef.current.accept = "video/*"; fileInputRef.current?.click(); }}><Film size={16} />Video</button></li>
              <li><button type="button" onClick={() => { fileInputRef.current.accept = "audio/*"; fileInputRef.current?.click(); }}><Music size={16} />Audio</button></li>
              <li><button type="button" onClick={() => { fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt"; fileInputRef.current?.click(); }}><FileText size={16} />Document</button></li>
            </ul>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !filePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;