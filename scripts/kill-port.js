import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = 8888;

async function killPort() {
  try {
    console.log(`🔍 포트 ${PORT} 사용 중인 프로세스 확인 중...`);

    // Windows에서 포트 사용 중인 프로세스 찾기
    const { stdout } = await execAsync(`netstat -ano | findstr :${PORT}`);

    if (!stdout) {
      console.log(`✅ 포트 ${PORT}는 사용 가능합니다.`);
      return;
    }

    // PID 추출 (마지막 컬럼)
    const lines = stdout.trim().split('\n');
    const pids = new Set();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }

    if (pids.size === 0) {
      console.log(`✅ 포트 ${PORT}는 사용 가능합니다.`);
      return;
    }

    console.log(`⚠️  포트 ${PORT}를 사용 중인 프로세스 발견: PID ${Array.from(pids).join(', ')}`);

    // 각 프로세스 종료
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`✅ 프로세스 ${pid} 종료 완료`);
      } catch (error) {
        console.log(`⚠️  프로세스 ${pid} 종료 실패 (이미 종료되었거나 권한 부족)`);
      }
    }

    // 프로세스 종료 후 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ 포트 ${PORT} 정리 완료!\n`);

  } catch (error) {
    // netstat에서 결과가 없으면 에러가 발생하지만 이는 정상 (포트 사용 안 함)
    if (error.code === 1) {
      console.log(`✅ 포트 ${PORT}는 사용 가능합니다.\n`);
    } else {
      console.error('❌ 오류 발생:', error.message);
    }
  }
}

// 스크립트 실행
killPort().catch(console.error);
