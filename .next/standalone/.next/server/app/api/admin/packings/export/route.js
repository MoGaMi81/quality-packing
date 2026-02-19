"use strict";(()=>{var e={};e.id=329,e.ids=[329],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},99447:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>m,patchFetch:()=>x,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>l,staticGenerationAsyncStorage:()=>g});var a={};r.r(a),r.d(a,{GET:()=>c});var s=r(49303),n=r(88716),i=r(60670),o=r(87070);let p=(0,r(37857).eI)("https://brbqdrsuxazbdlcasjhm.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function c(){let{data:e,error:t}=await p.from("packings").select(`
      id,
      invoice_no,
      created_at,
      pricing_status,
      clients (
        code,
        name
      )
    `).eq("pricing_status","DONE").order("created_at",{ascending:!1});return t?o.NextResponse.json({error:t.message},{status:500}):o.NextResponse.json({packings:e})}let u=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/packings/export/route",pathname:"/api/admin/packings/export",filename:"route",bundlePath:"app/api/admin/packings/export/route"},resolvedPagePath:"C:\\Users\\logis\\OneDrive\\Desktop\\Proyecto\\Poyecto Web\\Packing List\\quality-packing\\src\\app\\api\\admin\\packings\\export\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:d,staticGenerationAsyncStorage:g,serverHooks:l}=u,m="/api/admin/packings/export/route";function x(){return(0,i.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:g})}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[1633,5972,7857],()=>r(99447));module.exports=a})();