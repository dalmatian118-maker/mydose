import fs from "node:fs";

// 인터넷 임시 주소(Cloudflare 무료 quick tunnel, 가입 불필요).
// 학교 PC는 랜선, 학생은 와이파이처럼 네트워크가 나뉘어 있어도 이 주소로는 모두 접속할 수 있어요.
// 실패하면(학교망 차단 등) null 을 돌려주고, 같은 와이파이 주소로만 접속하게 됩니다.

let tunnel = null;

export async function startTunnel(port, { timeoutMs = 40_000 } = {}) {
  let cf;
  try {
    cf = await import("cloudflared");
  } catch {
    console.warn("⚠️  인터넷 주소 도구(cloudflared)가 설치되지 않았어요. 같은 와이파이 주소만 사용해요.");
    return null;
  }
  try {
    if (!fs.existsSync(cf.bin)) {
      console.log("   인터넷 주소 도구를 처음 한 번 내려받는 중이에요...");
      await cf.install(cf.bin);
    }
  } catch (err) {
    console.warn(`⚠️  인터넷 주소 도구를 받지 못했어요: ${err.message}`);
    return null;
  }

  return new Promise((resolve) => {
    const t = cf.Tunnel.quick(`http://localhost:${port}`);
    let settled = false;
    const done = (url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (url) tunnel = t;
      else t.stop();
      resolve(url);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    t.once("url", (url) => done(url));
    t.once("error", () => done(null));
    t.once("exit", () => done(null));
  });
}

export function stopTunnel() {
  try {
    // 임시 주소라 정리할 것이 없어서 바로 종료합니다 (SIGINT는 cloudflared가 수십 초 기다림)
    tunnel?.process.kill("SIGKILL");
  } catch {}
  tunnel = null;
}
