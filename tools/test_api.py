"""Local test of the Python API with a fake mail server (no real email is sent). Run: python3 tools/test_api.py"""
import sys, os, json, threading, socketserver, importlib.util, urllib.request, urllib.error
from http.server import HTTPServer
API=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','api'); sys.path.insert(0,API)
captured=[]
class SMTP(socketserver.StreamRequestHandler):
    def handle(self):
        w=lambda s:self.wfile.write((s+"\r\n").encode()); w("220 fake"); data=False; buf=[]
        while True:
            l=self.rfile.readline()
            if not l: break
            t=l.decode(errors='replace').rstrip("\r\n")
            if data:
                if t==".": captured.append("\n".join(buf)); buf=[]; data=False; w("250 ok")
                else: buf.append(t)
                continue
            u=t.upper()
            if u.startswith("EHLO"): w("250-fake"); w("250 AUTH PLAIN LOGIN")
            elif u.startswith("AUTH"): w("235 ok")
            elif u.startswith("DATA"): data=True; w("354 go")
            elif u.startswith("QUIT"): w("221 bye"); break
            else: w("250 ok")
socketserver.ThreadingTCPServer.allow_reuse_address = True
smtp=socketserver.ThreadingTCPServer(("127.0.0.1",2611),SMTP); threading.Thread(target=smtp.serve_forever,daemon=True).start()
def load(n):
    sp=importlib.util.spec_from_file_location(n,f"{API}/{n}.py"); m=importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m.handler
ports={}
for i,n in enumerate(["health","inquiry","subscribe"]):
    s=HTTPServer(("127.0.0.1",8170+i),load(n)); threading.Thread(target=s.serve_forever,daemon=True).start(); ports[n]=8170+i
import _common
def call(n,body=None,method="POST",headers=None,raw=None,reset=True):
    if reset: _common._hits.clear()
    h={"Content-Type":"application/json"}; h.update(headers or {})
    req=urllib.request.Request(f"http://127.0.0.1:{ports[n]}/api/{n}",data=raw if raw is not None else (json.dumps(body).encode() if body is not None else None),method=method,headers=h)
    try:
        r=urllib.request.urlopen(req); return r.status,json.loads(r.read())
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read())
good=dict(name="Test User",email="t@example.com",service="AI Digital Art & Illustration",message="I need a set of fantasy illustrations for my book.",budget="Prefer to discuss",links="https://example.com/ref")
for k in ["SMTP_USER","SMTP_PASS"]: os.environ.pop(k,None)
print("health unconfigured",call("health",method="GET"))
print("inquiry unconfigured",call("inquiry",good))
os.environ.update(SMTP_HOST="127.0.0.1",SMTP_PORT="2611",SMTP_SECURITY="none",SMTP_USER="owner@example.com",SMTP_PASS="x",MAIL_TO="owner@example.com")
print("health configured",call("health",method="GET"))
print("inquiry ok",call("inquiry",good)); 
bad=dict(good,name="Evil\r\nBcc: victim@x.com"); print("inj",call("inquiry",bad))
print("missing service",call("inquiry",dict(good,service="Hack")))
print("short msg",call("inquiry",dict(good,message="short")))
print("bad email",call("inquiry",dict(good,email="nope")))
print("bad link",call("inquiry",dict(good,links="javascript:alert(1)")))
print("honeypot",call("inquiry",dict(good,company_website="spam.com")),"mails so far",len(captured))
print("origin bad",call("inquiry",good,headers={"Origin":"https://evil.com"}))
print("origin same",call("inquiry",good,headers={"Origin":"http://127.0.0.1:8171"}))
print("big",call("inquiry",raw=b"{"+b'"a":"'+b"x"*30000+b'"}'))
print("not json ct",call("inquiry",raw=b"a=b",headers={"Content-Type":"text/plain"}))
print("GET",call("inquiry",method="GET"))
print("subscribe ok",call("subscribe",{"email":"fan@example.com"}),"bad",call("subscribe",{"email":"x"}))
_common._hits.clear(); print("rate limit",[call("subscribe",{"email":f"a{i}@example.com"},reset=False)[0] for i in range(8)])
print("mails captured",len(captured)); m=captured[0]; print("--- first mail ---\n"+"\n".join(m.split("\n")[:14]))
inj=[c for c in captured if "Evil" in c][0]; print("--- injection mail headers ---\n"+"\n".join(inj.split("\n")[:8]), "\nBcc header present:", any(l.startswith("Bcc:") for l in inj.split("\n\n")[0].split("\n")))
