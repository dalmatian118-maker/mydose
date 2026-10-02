// 반 전체가 같은 API 키를 동시에 쓰면 "요청이 너무 많아요(429)"가 자주 납니다.
// 그럴 때 잠깐 기다렸다가 자동으로 다시 시도합니다.

const RETRY_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class HttpError extends Error {
  constructor(label, status, body) {
    super(`${label} 오류 (HTTP ${status}): ${body.slice(0, 300)}`);
    this.status = status;
  }
}

/**
 * fetch + 자동 재시도 (지수 백오프 + 무작위 지연으로 30명이 한꺼번에 다시 몰리지 않게)
 * @param {object} retry { label, maxWaitMs: 총 대기 한도, maxDelayMs: 한 번 대기 한도 }
 */
export async function fetchWithRetry(url, options = {}, { label = "API", maxWaitMs = 120_000, maxDelayMs = 10_000 } = {}) {
  const started = Date.now();
  for (let attempt = 0; ; attempt++) {
    let res;
    let retryable = false;
    try {
      res = await fetch(url, options);
      if (res.ok) return res;
      retryable = RETRY_STATUS.has(res.status);
    } catch (err) {
      if (Date.now() - started > maxWaitMs) throw err;
      retryable = true; // 네트워크 끊김
    }

    const retryAfter = Number(res?.headers.get("retry-after")) * 1000;
    const backoff = Math.min(maxDelayMs, 1000 * 2 ** attempt) * (0.5 + Math.random());
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter + Math.random() * 1000 : backoff;
    const canWait = retryable && delay <= maxDelayMs * 1.5 && Date.now() - started + delay < maxWaitMs;
    if (!canWait) {
      if (res) throw new HttpError(label, res.status, await res.text());
      throw new Error(`${label}에 연결할 수 없어요. 인터넷 연결을 확인해주세요.`);
    }
    await sleep(delay);
  }
}
