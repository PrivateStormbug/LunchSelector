import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = 8888;
const MAX_RETRIES = 3;

async function findProcessOnPort() {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${PORT}`);
    const lines = stdout.trim().split('\n');
    const pids = new Set();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }

    return Array.from(pids);
  } catch (error) {
    if (error.code === 1) {
      return [];
    }
    throw error;
  }
}

async function killProcessWithAdmin(pid) {
  return new Promise((resolve, reject) => {
    // PowerShell로 관리자 권한으로 프로세스 종료 시도
    const ps = spawn('powershell.exe', [
      '-Command',
      `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`
    ]);

    ps.on('close', (code) => {
      resolve(code === 0);
    });

    ps.on('error', () => {
      reject(new Error('PowerShell 실행 실패'));
    });
  });
}

async function killPort() {
  try {
    console.log(`🔍 포트 ${PORT} 사용 중인 프로세스 확인 중...`);

    let pids = await findProcessOnPort();

    if (pids.length === 0) {
      console.log(`✅ 포트 ${PORT}는 사용 가능합니다.\n`);
      return;
    }

    console.log(`⚠️  포트 ${PORT}를 사용 중인 프로세스 발견: PID ${pids.join(', ')}`);

    // 각 프로세스 종료 시도
    for (const pid of pids) {
      let killed = false;

      // 방법 1: taskkill 시도
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`✅ 프로세스 ${pid} 종료 완료 (taskkill)`);
        killed = true;
      } catch (error) {
        console.log(`⚠️  taskkill 실패, PowerShell 시도 중...`);
      }

      // 방법 2: PowerShell로 재시도
      if (!killed) {
        try {
          const success = await killProcessWithAdmin(pid);
          if (success) {
            console.log(`✅ 프로세스 ${pid} 종료 완료 (PowerShell)`);
            killed = true;
          }
        } catch (error) {
          console.log(`⚠️  PowerShell 종료 실패`);
        }
      }

      if (!killed) {
        console.log(`❌ 프로세스 ${pid} 종료 실패 - 관리자 권한으로 다시 시도해주세요`);
      }
    }

    // 프로세스 종료 확인
    console.log(`⏳ 포트 해제 확인 중...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 재확인
    pids = await findProcessOnPort();
    if (pids.length > 0) {
      console.error(`\n❌ 포트 ${PORT}가 여전히 사용 중입니다 (PID: ${pids.join(', ')})`);
      console.error(`💡 해결 방법:`);
      console.error(`   1. 관리자 권한으로 터미널을 다시 열고 실행하세요`);
      console.error(`   2. 수동으로 프로세스를 종료하세요: taskkill /F /PID ${pids.join(' /PID ')}`);
      console.error(`   3. 또는 다른 포트를 사용하세요 (vite.config.js 수정)\n`);
      process.exit(1);
    }

    console.log(`✅ 포트 ${PORT} 정리 완료!\n`);

  } catch (error) {
    console.error('❌ 예상치 못한 오류 발생:', error.message);
    console.log('⚠️  수동으로 포트를 확인해주세요.\n');
    process.exit(1);
  }
}

// 스크립트 실행
killPort().catch(console.error);
