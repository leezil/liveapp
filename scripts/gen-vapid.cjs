/* eslint-disable @typescript-eslint/no-require-imports */
const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();

console.log("\n아래를 .env.local (및 Vercel 환경 변수)에 추가하세요:\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_CONTACT_EMAIL=mailto:you@example.com");
console.log("\n(선택) 서버 푸시 발송 시 PIN을 요구하려면:");
console.log("CREW_PUSH_PIN=원하는숫자또는문자열");
console.log("");
