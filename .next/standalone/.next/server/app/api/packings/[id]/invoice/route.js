"use strict";(()=>{var e={};e.id=5257,e.ids=[5257],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},47792:(e,i,t)=>{t.r(i),t.d(i,{originalPathname:()=>g,patchFetch:()=>v,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>l});var n={};t.r(n),t.d(n,{GET:()=>p});var r=t(49303),s=t(88716),a=t(60670),o=t(87070);let c=(0,t(37857).eI)("https://brbqdrsuxazbdlcasjhm.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function p(e,{params:i}){let t=decodeURIComponent(i.id),{data:n,error:r}=await c.from("packings").select(`
    id,
    invoice_no,
    created_at,
    clients (
      name
    ),
    packing_lines (
      pricing_key,
      species_name,
      form,
      lbs,
      price
    )
  `).eq("id",t).single();if(r||!n)return o.NextResponse.json({error:"Packing not found"},{status:404});let s=(n.packing_lines??[]).map(e=>({pricing_key:e.pricing_key,species:e.species_name,form:e.form,lbs:Number(e.lbs??0),price:Number(e.price??0),total:Number(e.lbs??0)*Number(e.price??0)})),a={total_lbs:s.reduce((e,i)=>e+i.lbs,0),total_usd:s.reduce((e,i)=>e+i.total,0)};return o.NextResponse.json({header:{invoice:n.invoice_no,client_name:n.clients?.[0]?.name??"",date:n.created_at},lines:s,totals:a})}let u=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/packings/[id]/invoice/route",pathname:"/api/packings/[id]/invoice",filename:"route",bundlePath:"app/api/packings/[id]/invoice/route"},resolvedPagePath:"C:\\Users\\logis\\OneDrive\\Desktop\\Proyecto\\Poyecto Web\\Packing List\\quality-packing\\src\\app\\api\\packings\\[id]\\invoice\\route.ts",nextConfigOutput:"standalone",userland:n}),{requestAsyncStorage:d,staticGenerationAsyncStorage:l,serverHooks:m}=u,g="/api/packings/[id]/invoice/route";function v(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:l})}}};var i=require("../../../../../webpack-runtime.js");i.C(e);var t=e=>i(i.s=e),n=i.X(0,[1633,5972,7857],()=>t(47792));module.exports=n})();