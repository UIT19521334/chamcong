const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// ❌ Hàm dính lỗi A08 – không kiểm tra chữ ký số
function insecureSave(file) {
  const filePath = file.path;
  console.log(`(INSECURE) File saved to: ${filePath}`);
  return {
    filename: file.originalname,
    path: filePath
  };
}

// ✅ Hàm sửa lỗi – kiểm tra chữ ký SHA256
function secureSave(file, expectedHash) {
  const filePath = file.path;
  const fileBuffer = fs.readFileSync(filePath);
  const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  if (actualHash !== expectedHash) {
    // Xóa file sai hash (fake update)
    fs.unlinkSync(filePath);
    throw new Error(`Signature verification failed! Expected: ${expectedHash}, Got: ${actualHash}`);
  }

  console.log(`(SECURE) File uploaded and verified: ${file.originalname}`);
  return {
    filename: file.originalname,
    path: filePath
  };
}

module.exports = {
  insecureSave,
  secureSave
};
