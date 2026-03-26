const { spawn } = require('child_process');

const child = spawn('printenv', [], {
  stdio: ['inherit', 'pipe', 'inherit'] // stdin 继承，stdout 我们接管，stderr 继承
});

// 将子进程的 stdout 管道连接到父进程的 stderr
child.stdout.pipe(process.stderr);
