import { Html, Head, Main, NextScript } from "next/document";

// Painted from the initial HTML, before any JS runs, so a hard refresh shows the
// Qelsa mark instead of an empty canvas. RouteGuard adds `qelsa-ready` once the
// route is past its auth gate, which fades this out. Keep the CSS inline: the
// point is to render before the stylesheet or the app bundle is available.
const BOOT_LOADER_CSS = `
html{background:#06060f}
#qelsa-boot{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:radial-gradient(60% 45% at 50% 44%,rgba(124,58,237,.12),transparent 70%),radial-gradient(55% 40% at 50% 56%,rgba(14,165,233,.10),transparent 70%),#06060f;color:#fff;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;opacity:1;visibility:visible;transition:opacity .45s ease,visibility .45s;animation:qb-failsafe .4s ease 15s forwards}
html.qelsa-ready #qelsa-boot{opacity:0;visibility:hidden;pointer-events:none}
.qb-stage{position:relative;display:grid;place-items:center;width:148px;height:148px}
.qb-track,.qb-arc,.qb-halo,.qb-pulse{position:absolute;inset:0;border-radius:50%}
.qb-track{border:1px solid rgba(255,255,255,.055)}
.qb-halo{inset:14px;background:radial-gradient(circle,rgba(14,165,233,.34),rgba(124,58,237,.16) 46%,transparent 72%);filter:blur(10px);animation:qb-breathe 3.6s ease-in-out infinite}
.qb-arc{background:conic-gradient(from 90deg,transparent 0deg,#0ea5e9 28deg,#7c3aed 108deg,#ec4899 168deg,transparent 222deg,transparent 360deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));animation:qb-spin 1.6s linear infinite}
.qb-pulse{border:1px solid rgba(124,58,237,.32);animation:qb-pulse 3.2s ease-out infinite}
.qb-pulse--late{animation-delay:1.6s}
.qb-tile{position:relative;width:56px;height:56px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.07),0 14px 44px rgba(124,58,237,.38);animation:qb-bob 3.6s ease-in-out infinite}
.qb-tile svg{display:block;width:100%;height:100%}
.qb-sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.5) 50%,transparent 62%);transform:translateX(-130%);animation:qb-sheen 3.4s ease-in-out infinite}
.qb-word{padding-left:.42em;font-size:11px;font-weight:600;letter-spacing:.42em;text-transform:uppercase;color:rgba(255,255,255,.52);animation:qb-rise .6s ease .08s both}
.qb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@keyframes qb-spin{to{transform:rotate(360deg)}}
@keyframes qb-breathe{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.05)}}
@keyframes qb-pulse{0%{transform:scale(.74);opacity:.55}70%{opacity:0}100%{transform:scale(1.34);opacity:0}}
@keyframes qb-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes qb-sheen{0%,58%{transform:translateX(-130%)}88%,100%{transform:translateX(130%)}}
@keyframes qb-rise{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes qb-failsafe{to{opacity:0;visibility:hidden}}
@media (prefers-reduced-motion:reduce){#qelsa-boot *{animation:none!important}.qb-halo{opacity:.85}.qb-sheen{display:none}}
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#06060f" />
        <style dangerouslySetInnerHTML={{ __html: BOOT_LOADER_CSS }} />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NM4FKLZM');`,
          }}
        />
        {/* End Google Tag Manager */}
      </Head>
      <body>
        <div id="qelsa-boot" role="status" aria-label="Loading Qelsa">
          <span className="qb-sr">Loading Qelsa</span>
          <div className="qb-stage" aria-hidden="true">
            <span className="qb-halo" />
            <span className="qb-track" />
            <span className="qb-pulse" />
            <span className="qb-pulse qb-pulse--late" />
            <span className="qb-arc" />
            <span className="qb-tile">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                <rect width="32" height="32" rx="8" fill="url(#qb-logo)" />
                <path
                  d="M15.1683 18.6023H17.3161L18.5881 20.2514L19.4957 21.3253L21.6754 24.125H19.3743L17.8913 22.2457L17.2585 21.3509L15.1683 18.6023ZM21.9886 16.4545C21.9886 17.8651 21.7244 19.0732 21.196 20.0788C20.6719 21.0803 19.956 21.8473 19.0483 22.38C18.1449 22.9126 17.12 23.179 15.9737 23.179C14.8274 23.179 13.8004 22.9126 12.8928 22.38C11.9893 21.843 11.2734 21.0739 10.745 20.0724C10.2209 19.0668 9.95881 17.8608 9.95881 16.4545C9.95881 15.044 10.2209 13.8381 10.745 12.8366C11.2734 11.831 11.9893 11.0618 12.8928 10.5291C13.8004 9.99645 14.8274 9.73011 15.9737 9.73011C17.12 9.73011 18.1449 9.99645 19.0483 10.5291C19.956 11.0618 20.6719 11.831 21.196 12.8366C21.7244 13.8381 21.9886 15.044 21.9886 16.4545ZM19.6044 16.4545C19.6044 15.4616 19.4489 14.6243 19.1378 13.9425C18.831 13.2564 18.4048 12.7386 17.8594 12.3892C17.3139 12.0355 16.6854 11.8587 15.9737 11.8587C15.2621 11.8587 14.6335 12.0355 14.0881 12.3892C13.5426 12.7386 13.1143 13.2564 12.8033 13.9425C12.4964 14.6243 12.343 15.4616 12.343 16.4545C12.343 17.4474 12.4964 18.2869 12.8033 18.973C13.1143 19.6548 13.5426 20.1726 14.0881 20.5263C14.6335 20.8757 15.2621 21.0504 15.9737 21.0504C16.6854 21.0504 17.3139 20.8757 17.8594 20.5263C18.4048 20.1726 18.831 19.6548 19.1378 18.973C19.4489 18.2869 19.6044 17.4474 19.6044 16.4545Z"
                  fill="#fff"
                />
                <defs>
                  <linearGradient id="qb-logo" x1="0" y1="16" x2="16" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4D33CC" />
                    <stop offset="0.5" stopColor="#802EBF" />
                    <stop offset="1" stopColor="#BF1F66" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="qb-sheen" />
            </span>
          </div>
          <span className="qb-word" aria-hidden="true">
            Qelsa
          </span>
        </div>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: "#qelsa-boot{display:none!important}" }} />
        </noscript>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NM4FKLZM"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
