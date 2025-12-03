const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// ✅ A08 - High security: kiểm tra chữ ký SHA256
function secureSave(file, expectedHash) {
  const filePath = file.path;
  const fileBuffer = fs.readFileSync(filePath);
  const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const hash = expectedHash.toLowerCase();

  if (actualHash !== hash) {
    // Xóa file nếu sai chữ ký
    fs.unlinkSync(filePath);
    throw new Error(`Signature verification failed! Expected: ${hash}, Got: ${actualHash}`);
  }

  console.log(`(SECURE) File uploaded and verified: ${file.originalname}`);
  return {
    filename: file.originalname,
    path: filePath
  };
}

module.exports = { secureSave };
