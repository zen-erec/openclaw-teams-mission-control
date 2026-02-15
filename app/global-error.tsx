"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="bg-zinc-100 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">エラーが発生しました</h2>
          <p className="text-sm text-zinc-500">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800"
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
