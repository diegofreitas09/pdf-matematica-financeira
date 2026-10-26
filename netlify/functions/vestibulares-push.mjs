import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "pdf-financeira-vestibulares-push";
const toJson = (value, status = 200) => Response.json(value, {
  status, headers: {"Cache-Control":"no-store", "Access-Control-Allow-Origin":"https://pdf-matematica-financeir.netlify.app"}
});
function allowedPushEndpoint(endpoint) {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== "https:" || u.username || u.password || u.port || endpoint.length > 2200) return false;
    const host = u.hostname.toLowerCase();
    return host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" ||
      host === "web.push.apple.com" || host.endsWith(".push.apple.com") ||
      host.endsWith(".notify.windows.com") || host.endsWith(".windows.com") ||
      host.endsWith(".googleapis.com") || host.endsWith(".push.services.mozilla.com");
  } catch (_) { return false; }
}
function cleanEvents(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0,30).filter(e =>
    e && /^[a-zA-Z0-9_-]{1,60}$/.test(String(e.id||"")) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(e.date||"")) &&
    !Number.isNaN(new Date(String(e.date)+"T12:00:00Z").getTime())
  ).map(e=>({
    id:e.id,
    date:e.date,
    title:String(e.title||"Vestibular").slice(0,95),
    focus:String(e.focus||"Revisão de conteúdos e exercícios").slice(0,160)
  }));
}
function cleanSessions(list) {
  if(!Array.isArray(list)) return [];
  return list.slice(0,60).filter(s=>s && /^\d{4}-\d{2}-\d{2}$/.test(String(s.date||"")) && /^([01]\d|2[0-3]):(00)$/.test(String(s.time||"")))
    .map(s=>({
      id:String(s.id||"").slice(0,60),
      title:String(s.title||"Sessão de estudo").slice(0,95),
      date:String(s.date),
      time:String(s.time)
    }));
}
function cleanSettings(input) {
  const settings=input&&typeof input==="object"?input:{};
  const days = Array.isArray(settings.daysBefore)
    ? [...new Set(settings.daysBefore.map(Number).filter(v=>[1,3,7,14,21,30].includes(v)))]
    : [14,7,3,1];
  return {
    hour: Math.max(6,Math.min(22,Math.round(Number(settings.hour)||9))),
    daysBefore: days.length?days:[14,7,3,1],
    events:cleanEvents(settings.events),
    sessions:cleanSessions(settings.sessions)
  };
}

export default async (request) => {
  if (request.method==="GET") {
    const publicKey=Netlify.env.get("VAPID_PUBLIC_KEY");
    return publicKey ? toJson({enabled:true,publicKey}) : toJson({enabled:false,error:"Notificações push não configuradas"},503);
  }
  if (!["POST","DELETE"].includes(request.method)) return toJson({error:"Método não permitido"},405);
  const origin=request.headers.get("origin");
  if (origin && origin !== "https://pdf-matematica-financeir.netlify.app") return toJson({error:"Origem não permitida"},403);
  if (Number(request.headers.get("content-length")||0)>35000) return toJson({error:"Envio muito grande"},413);
  try {
    const body=await request.json();
    const subscription=body?.subscription;
    if (!subscription || !allowedPushEndpoint(subscription.endpoint)) return toJson({error:"Assinatura inválida"},400);
    const key="sub-"+createHash("sha256").update(subscription.endpoint).digest("hex");
    const store=getStore(STORE_NAME);
    if(request.method==="DELETE") {
      await store.delete(key);
      return toJson({ok:true,removed:true});
    }
    if(!subscription.keys || !/^[A-Za-z0-9_-]{40,150}$/.test(String(subscription.keys.p256dh||"")) ||
      !/^[A-Za-z0-9_-]{10,100}$/.test(String(subscription.keys.auth||""))) return toJson({error:"Chaves de assinatura inválidas"},400);
    const settings=cleanSettings(body.settings);
    await store.setJSON(key,{subscription,settings,updatedAt:new Date().toISOString()});
    return toJson({ok:true,events:settings.events.length,sessions:settings.sessions.length});
  } catch (error) {
    console.error("Falha no cadastro push:",error);
    return toJson({error:"Não foi possível salvar as notificações"},500);
  }
};
export const config={path:"/api/vestibulares-push",method:["GET","POST","DELETE"]};
