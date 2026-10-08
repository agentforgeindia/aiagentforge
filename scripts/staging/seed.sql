-- fixed ids
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','alice@example.test'),
 ('22222222-2222-4222-8222-222222222222','bob@example.test'),
 ('33333333-3333-4333-8333-333333333333','founder@example.test'),
 ('44444444-4444-4444-8444-444444444444','member@example.test'),
 ('55555555-5555-4555-8555-555555555555','sales@example.test');
insert into public.profiles(id,email,credits,plan) values
 ('11111111-1111-4111-8111-111111111111','alice@example.test',200,'Free'),
 ('22222222-2222-4222-8222-222222222222','bob@example.test',200,'Free'),
 ('33333333-3333-4333-8333-333333333333','founder@example.test',500,'Founder'),
 ('44444444-4444-4444-8444-444444444444','member@example.test',100,'Free'),
 ('55555555-5555-4555-8555-555555555555','sales@example.test',0,'Free');
insert into public.admin_roles(id,label,permissions) values
 ('founder','Founder',array['*']),
 ('sales_manager','Sales',array['leads.*','customers.view']),
 ('finance','Finance',array['finance.view']);
insert into public.admin_users(email,role,active) values
 ('founder@example.test','founder',true),('sales@example.test','sales_manager',true);
insert into public.teams(id,name,owner_id,credits,plan) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Acme',
 '33333333-3333-4333-8333-333333333333',1000,'Pro Creator');
insert into public.team_members(team_id,user_id,role) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','member'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','owner');
insert into public.candidates(id,name,mobile,email,role_slug,stage) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Creator One','9000000001','creator@example.test','content-creator','offer_accepted');
insert into public.content_creator_social(candidate_id,instagram_url,referral_code,referral_status) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','https://instagram.com/x','CREATOR1','active');
insert into public.referral_earnings(referral_code,candidate_id,order_id,purchase_amount,commission_amount,status) values
 ('CREATOR1','cccccccc-cccc-4ccc-8ccc-cccccccccccc','order_x',1999,199.9,'cleared');
insert into public.influencer_withdrawals(candidate_id,referral_code,amount,status,upi_id) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','CREATOR1',150,'requested','creator@upi');
insert into public.meetings(topic,start_time,razorpay_payment_id,razorpay_order_id,amount) values
 ('Demo', now()+interval '2 days','pay_M1','order_M1',99),
 ('Admin made', now()+interval '3 days',null,null,null),
 ('Admin made 2', now()+interval '4 days',null,null,null);
insert into public.workshop_slots(slot_id,label,max_seats) values ('5-july','5 July',100),('unassigned','Unassigned',100000);
insert into storage.objects(bucket_id,name,owner) values
 ('designs','textile-designs/old-file.png',null),
 ('designs','brand-logos/11111111-1111-4111-8111-111111111111/logo.png','11111111-1111-4111-8111-111111111111'),
 ('generation-uploads','jewellery/11111111-1111-4111-8111-111111111111/a.jpg','11111111-1111-4111-8111-111111111111');
