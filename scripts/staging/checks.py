import sys
phase, mode = sys.argv[1], sys.argv[2]   # mode: before | after
A='11111111-1111-4111-8111-111111111111'; B='22222222-2222-4222-8222-222222222222'
F='33333333-3333-4333-8333-333333333333'; S='55555555-5555-4555-8555-555555555555'
U={'anon':('anon','', ''), 'alice':('authenticated',A,'alice@example.test'), 'bob':('authenticated',B,'bob@example.test'),
   'founder':('authenticated',F,'founder@example.test'), 'sales':('authenticated',S,'sales@example.test'), 'server':('service_role','','')}
def ins(bucket,name,owner): 
    o = 'null' if owner is None else f"'{owner}'"
    return f"insert into storage.objects(bucket_id,name,owner) values ('{bucket}','{name}',{o})"
C=[ # name, who, kind, sql, before, after
 ("creator payouts: visitor reads", 'anon','read',"select 1 from public.influencer_withdrawals",'ok','zero'),
 ("creator payouts: normal customer reads", 'alice','read',"select 1 from public.influencer_withdrawals",'ok','zero'),
 ("creator payouts: sales role (no finance permission) reads", 'sales','read',"select 1 from public.influencer_withdrawals",'ok','zero'),
 ("creator payouts: founder reads", 'founder','read',"select 1 from public.influencer_withdrawals",'ok','ok'),
 ("creator payouts: server reads", 'server','read',"select 1 from public.influencer_withdrawals",'ok','ok'),
 ("creator earnings: visitor reads", 'anon','read',"select 1 from public.referral_earnings",'ok','zero'),
 ("creator earnings: normal customer reads", 'alice','read',"select 1 from public.referral_earnings",'ok','zero'),
 ("creator earnings: founder reads", 'founder','read',"select 1 from public.referral_earnings",'ok','ok'),
 ("designs: visitor uploads into guest folder", 'anon','write',ins('designs','textile-designs/guest/x.png',None),'ok','ok'),
 ("designs: visitor uploads outside any folder", 'anon','write',ins('designs','textile-designs/x.png',None),'ok','denied'),
 ("designs: visitor uploads into a customer's folder", 'anon','write',ins('designs',f'brand-logos/{A}/x.png',None),'ok','denied'),
 ("designs: customer uploads into own folder", 'alice','write',ins('designs',f'brand-logos/{A}/y.png',A),'ok','ok'),
 ("designs: customer uploads into someone else's folder", 'alice','write',ins('designs',f'brand-logos/{B}/y.png',A),'ok','denied'),
 ("designs: customer uploads .html into own folder", 'alice','write',ins('designs',f'brand-logos/{A}/evil.html',A),'ok','denied'),
 ("designs: customer uploads .exe into own folder", 'alice','write',ins('designs',f'brand-logos/{A}/evil.exe',A),'ok','denied'),
 ("designs: customer uploads .HEIC (upper case) into own folder", 'alice','write',ins('designs',f'textile-designs/{A}/IMG_1.HEIC',A),'ok','ok'),
 ("designs: customer replaces own file", 'alice','write',f"update storage.objects set metadata='{{}}' where bucket_id='designs' and name='brand-logos/{A}/logo.png'",'ok','ok'),
 ("designs: customer moves own file into someone else's folder", 'alice','write',f"update storage.objects set name='brand-logos/{B}/logo.png' where bucket_id='designs' and name='brand-logos/{A}/logo.png'",'ok','denied'),
 ("designs: other customer replaces that file", 'bob','write',f"update storage.objects set metadata='{{}}' where bucket_id='designs' and name='brand-logos/{A}/logo.png'",'zero','zero'),
 ("designs: customer deletes own file", 'alice','write',f"delete from storage.objects where bucket_id='designs' and name='brand-logos/{A}/logo.png'",'zero','ok'),
 ("designs: other customer deletes that file", 'bob','write',f"delete from storage.objects where bucket_id='designs' and name='brand-logos/{A}/logo.png'",'zero','zero'),
 ("designs: visitor deletes that file", 'anon','write',f"delete from storage.objects where bucket_id='designs' and name='brand-logos/{A}/logo.png'",'zero','zero'),
 ("designs: team uploads demo video", 'founder','write',ins('designs','demo-videos/demo1.mp4',F),'ok','ok'),
 ("designs: customer uploads into demo-videos", 'alice','write',ins('designs','demo-videos/demo2.mp4',A),'ok','denied'),
 ("designs: server uploads generated image anywhere", 'server','write',ins('designs','mockups/out.png',None),'ok','ok'),
 ("generation-uploads: customer uploads into own folder", 'alice','write',ins('generation-uploads',f'jewellery/{A}/b.jpg',A),'ok','ok'),
 ("generation-uploads: customer uploads into someone else's folder", 'alice','write',ins('generation-uploads',f'jewellery/{B}/b.jpg',A),'ok','denied'),
 ("generation-uploads: visitor uploads into guest folder", 'anon','write',ins('generation-uploads','jewellery/guest/b.webp',None),'ok','ok'),
 ("generation-uploads: customer deletes own file", 'alice','write',f"delete from storage.objects where bucket_id='generation-uploads' and name='jewellery/{A}/a.jpg'",'zero','ok'),
 ("creator videos: visitor uploads .mp4", 'anon','write',ins('cc-demo-videos','v1.mp4',None),'ok','ok'),
 ("creator videos: visitor uploads .exe", 'anon','write',ins('cc-demo-videos','v1.exe',None),'ok','denied'),
 ("uploads bucket: visitor uploads (server-only bucket)", 'anon','write',ins('uploads','x.png',None),'denied','denied'),
 ("meetings: second booking with the same payment id", 'server','write',"insert into public.meetings(topic,start_time,razorpay_payment_id,razorpay_order_id) values ('dup', now(), 'pay_M1', 'order_other')",'ok','denied'),
 ("meetings: second booking with the same order id", 'server','write',"insert into public.meetings(topic,start_time,razorpay_payment_id,razorpay_order_id) values ('dup', now(), 'pay_other', 'order_M1')",'ok','denied'),
 ("meetings: admin-made meeting without payment", 'server','write',"insert into public.meetings(topic,start_time) values ('admin', now())",'ok','ok'),
 ("ledger: one duplicate-charge refund for a generation", 'server','read',f"select public.refund_credits('{A}', 15, 'refund:duplicate_charge', 'gen-dup-1')",'ok','ok'),
 ("ledger: a second duplicate-charge refund for the same generation", 'server','read',f"select public.refund_credits('{A}', 15, 'refund:duplicate_charge', 'gen-dup-1') union all select public.refund_credits('{A}', 15, 'refund:duplicate_charge', 'gen-dup-1')",'ok','denied'),
 ("ledger: ordinary refund twice for the same generation is not blocked by the index", 'server','read',f"select public.refund_credits('{A}', 5, 'refund:x', 'gen-dup-2') union all select public.refund_credits('{A}', 5, 'refund:y', 'gen-dup-2')",'ok','ok'),
 ("reviews: visitor reads a review sent through the review form", 'anon','read',"select 1 from public.testimonials where source='in-app'",'ok','ok'),
 ("reviews: visitor reads a rating-popup comment nobody agreed to publish", 'anon','read',"select 1 from public.testimonials where source='textile'",'ok','zero'),
 ("reviews: customer reads that comment", 'alice','read',"select 1 from public.testimonials where source='textile'",'ok','zero'),
 ("reviews: founder reads that comment (admin screen)", 'founder','read',"select 1 from public.testimonials where source='textile'",'ok','ok'),
 ("reviews: visitor adds a review that is already approved", 'anon','write',"insert into public.testimonials(agent_type,name,message,rating,status,source) values ('textile','x','fake',5,'approved','in-app')",'ok','denied'),
 ("reviews: visitor adds a pending review", 'anon','write',"insert into public.testimonials(agent_type,name,message,rating,status,source) values ('textile','x','real',5,'pending','in-app')",'ok','ok'),
 ("reviews: customer adds a pending review as themselves", 'alice','write',f"insert into public.testimonials(agent_type,name,message,rating,status,source,user_id) values ('textile','x','mine',5,'pending','in-app','{A}')",'ok','ok'),
 ("reviews: customer adds a review in another customer's name", 'alice','write',f"insert into public.testimonials(agent_type,name,message,rating,status,source,user_id) values ('textile','x','not mine',5,'pending','in-app','{B}')",'ok','denied'),
 ("reviews: customer approves a review", 'alice','write',"update public.testimonials set status='approved' where source='in-app'",'zero','zero'),
 # already-live rules (must not change in any phase)
 ("live rule: customer edits own credits", 'alice','write',f"update public.profiles set credits=99999 where id='{A}'",'denied','denied'),
 ("live rule: customer edits own plan", 'alice','write',f"update public.profiles set plan='Empire' where id='{A}'",'denied','denied'),
 ("live rule: customer edits own name", 'alice','write',f"update public.profiles set full_name='Alice' where id='{A}'",'ok','ok'),
 ("live rule: customer edits someone else's name", 'alice','write',f"update public.profiles set full_name='x' where id='{B}'",'zero','zero'),
 ("live rule: browser inserts a generation row", 'alice','write',f"insert into public.generations(user_id,status) values ('{A}','completed')",'denied','denied'),
 ("live rule: customer reads another customer's ledger", 'bob','read',f"select 1 from public.credit_transactions where user_id='{A}'",'zero','zero'),
]
print("begin;")
for name,who,kind,sql,b,a in C:
    role,sub,email=U[who]; exp = b if mode=='before' else a
    q=lambda s: s.replace("'","''")
    print(f"select t.try('{phase}','{q(name)}','{role}','{sub}','{email}','{kind}','{q(sql)}','{exp}');")
print("commit;")
