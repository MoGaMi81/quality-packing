"use strict";(()=>{var e={};e.id=8182,e.ids=[8182],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},30740:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>x,patchFetch:()=>v,requestAsyncStorage:()=>m,routeModule:()=>g,serverHooks:()=>k,staticGenerationAsyncStorage:()=>h});var i={};a.r(i),a.d(i,{GET:()=>l,dynamic:()=>p,fetchCache:()=>d});var n=a(49303),r=a(88716),o=a(60670),s=a(87070),c=a(37857);let p="force-dynamic",d="force-no-store",u=(0,c.eI)("https://brbqdrsuxazbdlcasjhm.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function l(e,{params:t}){let{id:a}=t,{data:i,error:n}=await u.from("packings").select(`
    id,
    invoice_no,
    created_at,
    pricing_status,
    clients (
      name
    ),
    packing_lines (
      box_no,
      is_combined,
      combined_with,
      description_en,
      form,
      size,
      pounds,
      price
    )
  `).eq("id",t.id).single();return n||!i?s.NextResponse.json({ok:!1,error:"Packing no encontrado"},{status:404}):s.NextResponse.json({ok:!0,packing:i},{headers:{"Cache-Control":"no-store, no-cache, max-age=0, must-revalidate",Pragma:"no-cache",Expires:"0"}})}let g=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/packings/[id]/route",pathname:"/api/packings/[id]",filename:"route",bundlePath:"app/api/packings/[id]/route"},resolvedPagePath:"C:\\Users\\logis\\OneDrive\\Desktop\\Proyecto\\Poyecto Web\\Packing List\\quality-packing\\src\\app\\api\\packings\\[id]\\route.ts",nextConfigOutput:"standalone",userland:i}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:k}=g,x="/api/packings/[id]/route";function v(){return(0,o.patchFetch)({serverHooks:k,staticGenerationAsyncStorage:h})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[1633,5972,7857],()=>a(30740));module.exports=i})();