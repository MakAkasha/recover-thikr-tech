export default function MessagePreview({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4" dir="rtl" lang="ar">
      <div className="text-xs text-emerald-700 mb-2">معاينة رسالة واتساب</div>
      <pre className="whitespace-pre-wrap m-0 text-sm leading-7 font-sans">{message}</pre>
    </div>
  );
}
