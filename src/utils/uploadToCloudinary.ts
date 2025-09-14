import { v2 as cloudinary } from "cloudinary";
import "../config/cloudinary.js";
import { PassThrough } from "stream";

/**
 * Upload a Buffer to Cloudinary inside 'Foody' folder, with optional subfolder.
 * @param buffer File buffer (req.file.buffer)
 * @param folder Optional subfolder name inside 'Foody'
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder?: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    
    const folderPath = folder ? `Foody/${folder}` : "Foody";

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderPath },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    const stream = new PassThrough();
    stream.end(buffer);
    stream.pipe(uploadStream);
  });
}
