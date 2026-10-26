import webPush from "web-push";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "pdf-financeira-vestibulares-push";
function dateParts(date) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{
    timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"
  }).formatToParts(date).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return {
    date:parts.year+"-"+parts.month+"-"+parts.day,
    hour:Number(parts.hour)
  };
}
const daysUntil=(start,end)=>{
  const parts=(str)=>String(str).split("-").map(Number);
  const [a,b,c]=parts(start),[x,y,z]=parts(end);
  return Math.round((Date.UTC(x,y-1,z)-Date.UTC(a,b-1,c))/86400000);
};
function dueAlerts(settings,today,hour) {
  const notifications=[];
  const notifyHour=Number(settings?.hour)||9;
  if(notifyHour===hour) {
    for(const e of settings?.events||[]) {
      const days=daysUntil(today,e.date);
      if(days>=0 && (settings.daysBefore||[14,7,3,1]).includes(days)) {
        notifications.push({
          title:days===0?"🎯 Hoje: "+e.title:"📚 "+e.title+" em "+days+" dia"+(days>1?"s":""),
          body:(days===0?"Dia da prova! Confira local e documentos. ":"Revise agora: ")+e.focus,
          url:"/vestibulares.html?evento="+encodeURIComponent(e.id),
          tag:"pdf-exam-"+e.id+"-"+days
        });
      }
    }
  }
  for(const s of settings?.sessions||[]) {
    if(s.date===today && Number(s.time?.split(":")[0])===hour) {
      notifications.push({
        title:"⏰ Hora de estudar: "+s.title,
        body:"Sua sessão de estudo programada começou. Abra a PDF Financeira e revise seus conteúdos.",
        url:"/vestibulares.html?estudar=1",
        tag:"pdf-study-"+s.id+"-"+today
      });
    }
  }
  return notifications.slice(0,5);
}
export default async () => {
  const publicKey=Netlify.env.get("VAPID_PUBLIC_KEY");
  const privateKey=Netlify.env.get("VAPID_PRIVATE_KEY");
  if(!publicKey || !privateKey){console.warn("Chaves VAPID ausentes.");return;}
  webPush.setVapidDetails("https://pdf-matematica-financeir.netlify.app",publicKey,privateKey);
  const store=getStore(STORE_NAME);
  const now=dateParts(new Date());
  const {blobs}=await store.list();
  let sent=0,stale=0,failed=0;
  for(const entry of blobs.slice(0,1000)) {
    const record=await store.get(entry.key,{type:"json"}).catch(()=>null);
    if(!record?.subscription) continue;
    for(const alert of dueAlerts(record.settings,now.date,now.hour)) {
      try {
        await webPush.sendNotification(record.subscription,JSON.stringify(alert),{TTL:60*60*6,urgency:"normal"});
        sent++;
      } catch (error) {
        const status=Number(error?.statusCode);
        if(status===404||status===410){await store.delete(entry.key);stale++;break;}
        failed++;
        console.warn("Falha ao enviar push:",status||error?.message);
      }
    }
  }
  console.log("PDF Vestibulares push:",{date:now.date,hour:now.hour,subscriptions:blobs.length,sent,stale,failed});
};
export const config={schedule:"0 * * * *"};
