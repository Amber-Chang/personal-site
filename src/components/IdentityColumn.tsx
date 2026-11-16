// 功能：首頁與文章列表左欄的身分區（SPEC-004）：頭像、姓名、職稱、定位句、簡介與兩個按鈕。兩頁內容完全相同。
// 寬螢幕且視窗夠高時固定在畫面上（sticky）；矮視窗或手機照常隨頁面捲動。

import Image from "next/image";
import Link from "next/link";

import { primaryButtonClassName, secondaryButtonClassName } from "./button-styles.ts";

// ledeAs：定位句的標籤。首頁用 h1（它就是首頁的頁面標題）；文章列表另有自己的 H1，這裡用 p。
export function IdentityColumn({ ledeAs = "h1" }: { ledeAs?: "h1" | "p" }) {
  const Lede = ledeAs;

  return (
    <aside aria-label="關於 Amber" className="lg:tall:sticky lg:tall:top-24 lg:self-start">
      <Image
        alt=""
        className="size-16 rounded-full lg:size-22"
        height={88}
        priority
        src="/amber-avatar.png"
        width={88}
      />
      <p className="mt-3.5 text-identity-name font-semibold tracking-heading lg:mt-5">Amber Chang</p>
      <p className="mt-0.5 text-tagline tracking-label text-muted-foreground">Product Manager / Product Builder</p>
      <Lede className="mt-5 text-identity-lede font-semibold tracking-heading">
        我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。
      </Lede>
      <p className="mt-3.5 text-sm leading-7 text-foreground-soft">
        我從教育現場、BD 與產品規劃，一路走到產品經理。現在是 AI 產品經理，協助公司進行組織 AI 化。
      </p>
      <div className="mt-5.5 flex flex-wrap gap-2.5">
        <Link className={primaryButtonClassName} href="/about">
          更多關於我
        </Link>
        <a className={secondaryButtonClassName} href="mailto:taco5239@gmail.com">
          寫信給我
        </a>
      </div>
    </aside>
  );
}
