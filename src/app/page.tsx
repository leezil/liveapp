import Link from "next/link";
import { PushSubscribeCTA } from "@/components/PushSubscribeCTA";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-3 bg-zinc-950 p-4 text-white">
      <h1 className="text-2xl font-bold">Live App Demo</h1>
      <p className="text-sm text-zinc-300">
        영화 촬영용 흐름에 맞춰 송출/시청/연출 제어를 분리했습니다.
      </p>
      <PushSubscribeCTA />
      <Link className="rounded-xl bg-emerald-500 px-4 py-3 text-center font-semibold" href="/broadcast">
        송출 화면 열기
      </Link>
      <Link className="rounded-xl bg-indigo-500 px-4 py-3 text-center font-semibold" href="/watch">
        시청 화면 열기
      </Link>
      <Link className="rounded-xl bg-zinc-700 px-4 py-3 text-center font-semibold" href="/admin">
        관리자 패널 열기
      </Link>
    </main>
  );
}
