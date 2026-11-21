/**
 * Microsoft Clarity (free heatmaps and session recordings) on the store pages, never the
 * dashboard. Off until a project ID is set: NEXT_PUBLIC_CLARITY_ID in Vercel (Clarity → Settings
 * → Overview → Project ID). Clarity masks what visitors type in form fields by default.
 */
const raw = process.env.NEXT_PUBLIC_CLARITY_ID?.trim() ?? "";
export const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(raw) ? raw : "";

export const CLARITY_SNIPPET = CLARITY_ID
  ? `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`
  : "";
