"use strict";(()=>{var e={};e.id=7149,e.ids=[7149],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},91684:(e,i,o)=>{o.r(i),o.d(i,{originalPathname:()=>m,patchFetch:()=>_,requestAsyncStorage:()=>d,routeModule:()=>p,serverHooks:()=>f,staticGenerationAsyncStorage:()=>l});var n={};o.r(n),o.d(n,{GET:()=>u});var t=o(49303),s=o(88716),r=o(60670),a=o(87070);let c=(0,o(37857).eI)("https://brbqdrsuxazbdlcasjhm.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function u(e,{params:i}){let o=i.invoice.toUpperCase(),{data:n,error:t}=await c.from("packings").select(`
      id,
      invoice_no,
      client_code,
      guide,
      created_at
    `).eq("invoice_no",o).single();if(t||!n)return a.NextResponse.json({ok:!1,error:"Factura no encontrada"},{status:404});let{data:s,error:r}=await c.from("packing_lines").select(`
      box_no,
      code,
      description_en,
      scientific_name,
      form,
      size,
      pounds,
      price
    `).eq("packing_id",n.id);if(r)return a.NextResponse.json({ok:!1,error:r.message},{status:500});if(!s||0===s.length)return a.NextResponse.json({ok:!1,error:"Factura sin l\xedneas"},{status:400});let u=[],p=new Map,d=new Set,l=!1;for(let e of s){let i=e.price??0;if("MX"===e.box_no){l=!0,u.push({boxes:"MX",pounds:e.pounds,description:e.description_en,size:e.size,form:e.form,scientific_name:e.scientific_name,price:i,amount:e.pounds*i});continue}d.add(e.box_no);let o=`${e.code}|${e.form}|${e.size}`;if(p.has(o)){let i=p.get(o);i.boxes=i.boxes+1,i.pounds+=e.pounds,i.amount=i.pounds*i.price}else p.set(o,{boxes:1,pounds:e.pounds,description:e.description_en,size:e.size,form:e.form,scientific_name:e.scientific_name,price:i,amount:e.pounds*i})}let f=d.size+(l?1:0);return a.NextResponse.json({ok:!0,invoice:{invoice_no:n.invoice_no,client_code:n.client_code,client_name:n.client_code,guide:n.guide,date:n.created_at,total_boxes:f,lines:[...p.values(),...u]}})}let p=new t.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/facturacion/by-invoice/[id]/route",pathname:"/api/facturacion/by-invoice/[id]",filename:"route",bundlePath:"app/api/facturacion/by-invoice/[id]/route"},resolvedPagePath:"C:\\Users\\logis\\OneDrive\\Desktop\\Proyecto\\Poyecto Web\\Packing List\\quality-packing\\src\\app\\api\\facturacion\\by-invoice\\[id]\\route.ts",nextConfigOutput:"standalone",userland:n}),{requestAsyncStorage:d,staticGenerationAsyncStorage:l,serverHooks:f}=p,m="/api/facturacion/by-invoice/[id]/route";function _(){return(0,r.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:l})}}};var i=require("../../../../../webpack-runtime.js");i.C(e);var o=e=>i(i.s=e),n=i.X(0,[1633,5972,7857],()=>o(91684));module.exports=n})();