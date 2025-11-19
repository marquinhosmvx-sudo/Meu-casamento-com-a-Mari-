const targetDate=new Date("May 16, 2026 14:15:00").getTime();
setInterval(()=>{const now=Date.now();const diff=targetDate-now;
document.getElementById("days").innerText=Math.floor(diff/(1000*60*60*24));
document.getElementById("hours").innerText=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
document.getElementById("minutes").innerText=Math.floor((diff%(1000*60*60))/(1000*60));
document.getElementById("seconds").innerText=Math.floor((diff%(1000*60))/1000);},1000);

new QRious({element:document.getElementById("qrcode"),value:"04314159197",size:150});

document.getElementById("rsvpForm").addEventListener("submit",e=>{
e.preventDefault();
document.getElementById("rsvpMessage").innerText="Enviando...";
document.getElementById("rsvpMessage").innerText="Presença confirmada! 💙";
e.target.reset();
});
