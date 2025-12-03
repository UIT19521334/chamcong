const path = require('path');

// ❌ A08 - Low security: không kiểm tra chữ ký số
function insecureSave(file) {
  const filePath = file.path;
  console.log(`(INSECURE) File saved to: ${filePath}`);
  return {
    filename: file.originalname,
    path: filePath
  };
}

module.exports = { insecureSave };
