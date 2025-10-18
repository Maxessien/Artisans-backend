// src/utils/OfflineCloudinary.js
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

class OfflineCloudinary {
  constructor() {
    if (!process.env.CLOUDINARY_OFFLINE_PATH) {
      throw new Error(
        "Please set CLOUDINARY_OFFLINE_PATH in your .env file"
      );
    }
    this.rootPath = process.env.CLOUDINARY_OFFLINE_PATH;
  }

  /**
   * Upload a file
   * @param {string} tempFilePath - Path to the temporary file
   * @param {object} options - { folder: 'nested/folder/path' }
   * @returns Cloudinary-like response
   */
  async upload(tempFilePath, options = {}) {
    const folder = options.folder || "";
    const fullFolderPath = path.join(this.rootPath, folder);

    // Ensure folder exists
    await fs.mkdir(fullFolderPath, { recursive: true });

    // Generate unique filename
    const ext = path.extname(tempFilePath) || ".jpg";
    const public_id = crypto.randomUUID();
    const fileName = public_id + ext;

    const finalPath = path.join(fullFolderPath, fileName);

    // Copy file from temp path
    await fs.copyFile(tempFilePath, finalPath);

    // Get file stats
    const stats = await fs.stat(finalPath);

    const now = new Date().toISOString();

    // Return Cloudinary-like response
    return {
      asset_id: crypto.randomUUID(),
      public_id,
      version: Date.now(),
      version_id: crypto.randomUUID(),
      signature: crypto.randomBytes(16).toString("hex"),
      width: null,
      height: null,
      format: ext.replace(".", ""),
      resource_type: "image",
      created_at: now,
      tags: [],
      pages: 1,
      bytes: stats.size,
      type: "upload",
      etag: crypto.randomBytes(8).toString("hex"),
      placeholder: false,
      url: finalPath,
      secure_url: finalPath,
    };
  }

  /**
   * Destroy a file by public_id
   * @param {string} public_id
   * @returns {object} { result: "ok" } if deleted or { result: "not found" }
   */
  async destroy(public_id) {
    const files = await this._findFilesByPublicId(public_id);
    if (files.length === 0) return { result: "not found" };

    for (const filePath of files) {
      await fs.unlink(filePath);
    }
    return { result: "ok" };
  }

  // Private helper: find all files with matching public_id
  async _findFilesByPublicId(public_id) {
    const walk = async (dir) => {
      let fileList = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          fileList = fileList.concat(await walk(fullPath));
        } else if (entry.name.startsWith(public_id)) {
          fileList.push(fullPath);
        }
      }
      return fileList;
    };
    return walk(this.rootPath);
  }
}

export default new OfflineCloudinary();