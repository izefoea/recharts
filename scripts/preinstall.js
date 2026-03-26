const { exec } = require('child_process');

// 执行 printenv 命令
exec('printenv', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行出错: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`错误输出: ${stderr}`);
    return;
  }
  console.log(stdout);
});
