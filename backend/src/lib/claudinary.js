import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 180000, // 3 minute timeout (default is 60 seconds)
    secure: true, // Use HTTPS
});

// Configure default URL options - keep these minimal
cloudinary.config().url_options = {
    secure: true, // Always use HTTPS
};

// Configure API options for better public access
cloudinary.config().api_options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: "auto",
    invalidate: true,
    access_mode: "public"
};

export { cloudinary }; 