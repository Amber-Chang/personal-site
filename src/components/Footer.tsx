// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站頁尾（SPEC-004 精簡）：只留姓名與 email，不重複頁首已有的導覽。

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 px-4 py-4 text-sm text-muted-foreground md:px-6">
        <p>© Amber Chang</p>
        <a
          className="focus-ring inline-flex min-h-11 items-center underline decoration-muted-foreground/60 underline-offset-4 hover:text-foreground"
          href="mailto:taco5239@gmail.com"
        >
          taco5239@gmail.com
        </a>
      </div>
    </footer>
  );
}
