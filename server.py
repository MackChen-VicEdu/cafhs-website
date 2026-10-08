import http.server
import socketserver
import os
import sys
import json
import sqlite3
import datetime
import smtplib
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PORT', 8085))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get('DB_PATH', os.path.join(DIRECTORY, 'cafhs_database.db'))

MANAGEMENT_EMAILS = ['info@cafhs.org', 'mack.chen@viccollege.com']

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Users Table for User Management
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'user',
            provider TEXT DEFAULT 'local',
            province TEXT DEFAULT 'ON',
            title TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Chat Logs / Transcripts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_id TEXT,
            user_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            model_used TEXT DEFAULT 'gpt-4o-mini',
            is_crisis INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. Site Management Email Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS site_management_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT NOT NULL,
            sender TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            user_email TEXT NOT NULL,
            user_name TEXT NOT NULL,
            chat_log_id INTEGER,
            status TEXT DEFAULT 'dispatched',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_log_id) REFERENCES chat_logs (id)
        )
    ''')

    # 4. Community Contributions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT UNIQUE NOT NULL,
            donor_name TEXT NOT NULL,
            donor_email TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'CAD',
            frequency TEXT DEFAULT 'one-time',
            payment_method TEXT DEFAULT 'credit_card',
            province TEXT DEFAULT 'ON',
            notes TEXT,
            allocated_partner_id INTEGER,
            allocated_partner_name TEXT,
            status TEXT DEFAULT 'succeeded',
            receipt_sent INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        cursor.execute('ALTER TABLE contributions ADD COLUMN allocated_partner_id INTEGER')
    except Exception:
        pass
    try:
        cursor.execute('ALTER TABLE contributions ADD COLUMN allocated_partner_name TEXT')
    except Exception:
        pass

    # 5. Ontario Educational & Training Partners Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS training_partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partner_code TEXT UNIQUE NOT NULL,
            institution_name TEXT NOT NULL,
            institution_type TEXT NOT NULL,
            campus_city TEXT NOT NULL,
            province TEXT DEFAULT 'ON',
            website TEXT,
            contact_name TEXT NOT NULL,
            contact_title TEXT,
            contact_email TEXT NOT NULL,
            contact_phone TEXT,
            accreditation_id TEXT,
            programs TEXT,
            payout_method TEXT DEFAULT 'direct_deposit',
            banking_info TEXT,
            allocation_focus TEXT,
            notes TEXT,
            status TEXT DEFAULT 'verified',
            total_donations_allocated REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Seed default users if table is empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        default_users = [
            ('usr-admin-mack', 'Mack Chen', 'mack.chen@viccollege.com', 'admin', 'google', 'ON', 'Executive Administrator'),
            ('usr-admin-marc', 'Dr. Marc Tremblay', 'info@cafhs.org', 'admin', 'local', 'QC', 'Clinical Director & Social Worker'),
            ('usr-user-sarah', 'Sarah Chen', 'sarah.chen@example.ca', 'user', 'local', 'ON', 'Community Member')
        ]
        cursor.executemany('''
            INSERT INTO users (user_id, name, email, role, provider, province, title)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', default_users)
        print("Default users seeded into SQLite database.")

    # Seed default Ontario training partners if table is empty
    cursor.execute('SELECT COUNT(*) FROM training_partners')
    if cursor.fetchone()[0] == 0:
        default_partners = [
            (
                'TP-ON-2026-101',
                'Ontario Community Health & Respite Training Institute',
                'community_training_org',
                'Toronto',
                'ON',
                'https://ontariohealthtraining.org',
                'Dr. Elena Rossi',
                'Dean of Allied Health & Community Education',
                'admissions@ontariohealthtraining.org',
                '(416) 555-0182',
                'MCU-ON-8842',
                'Personal Support Worker (PSW), Family Respite Caregiver Coaching, Palliative Support',
                'direct_deposit',
                'TD Canada Trust • Transit 04921 • Acct 582-9912',
                'Caregiver Respite & Frontline PSW Student Bursaries',
                'Ontario accredited non-profit healthcare education partner.',
                'verified',
                250.0
            ),
            (
                'TP-ON-2026-102',
                'Great Lakes College of Health Sciences',
                'private_career_college',
                'Mississauga',
                'ON',
                'https://greatlakeshealthcollege.ca',
                'Marcus Vance',
                'Registrar & Financial Aid Director',
                'bursaries@greatlakeshealthcollege.ca',
                '(905) 555-0144',
                'PCC-MCU-9104',
                'Personal Support Worker (PSW), Community Mental Health Aide, Elder Care Assistance',
                'direct_deposit',
                'RBC Royal Bank • Transit 00382 • Acct 104-8841',
                'PSW Student Tuition Relief & Healthcare Aid Bursaries',
                'Registered Ontario Private Career College (MCU approved).',
                'verified',
                150.0
            ),
            (
                'TP-ON-2026-103',
                'Ottawa Valley Public Community Health Collaborative',
                'public_college',
                'Ottawa',
                'ON',
                'https://ottawahealthtraining.on.ca',
                'Chantal Dubois',
                'Coordinator of Healthcare & Community Aid',
                'programs@ottawahealthtraining.on.ca',
                '(613) 555-0199',
                'ON-PUB-5521',
                'Youth Mental Health Respite, Perinatal Support Coaching, Indigenous Family Care',
                'interac_etransfer',
                'Direct Interac Auto-Deposit to finance@ottawahealthtraining.on.ca',
                'Youth Mental Health & Perinatal Peer Care Bursaries',
                'Public college continuing education collaborative.',
                'verified',
                100.0
            )
        ]
        cursor.executemany('''
            INSERT INTO training_partners (
                partner_code, institution_name, institution_type, campus_city, province,
                website, contact_name, contact_title, contact_email, contact_phone,
                accreditation_id, programs, payout_method, banking_info, allocation_focus,
                notes, status, total_donations_allocated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', default_partners)
        print("Default Ontario training partners seeded into SQLite database.")

    # 6. CAFHS Grant & Bursary Allocations to Training Partners Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS partner_allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partner_id INTEGER NOT NULL,
            partner_code TEXT NOT NULL,
            institution_name TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'CAD',
            purpose TEXT NOT NULL,
            reference_note TEXT,
            disbursed_by TEXT DEFAULT 'CAFHS Executive Administration',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (partner_id) REFERENCES training_partners (id)
        )
    ''')

    cursor.execute('SELECT COUNT(*) FROM partner_allocations')
    if cursor.fetchone()[0] == 0:
        default_allocations = [
            (1, 'TP-ON-2026-101', 'Ontario Community Health & Respite Training Institute', 250.0, 'CAD', 'Caregiver Respite & PSW Bridge Student Bursaries', 'Approved by Executive Management for 2026 Cohort', 'Mack Chen (Executive Administrator)'),
            (2, 'TP-ON-2026-102', 'Great Lakes College of Health Sciences', 150.0, 'CAD', 'PSW Student Tuition Relief & Healthcare Aid Grant', 'Disbursed under Ontario Frontline Training Program', 'Dr. Marc Tremblay (Clinical Director)'),
            (3, 'TP-ON-2026-103', 'Ottawa Valley Public Community Health Collaborative', 100.0, 'CAD', 'Youth Mental Health Respite & Perinatal Peer Aid', 'CAFHS Community Grant Round 1', 'Mack Chen (Executive Administrator)')
        ]
        cursor.executemany('''
            INSERT INTO partner_allocations (
                partner_id, partner_code, institution_name, amount, currency, purpose, reference_note, disbursed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', default_allocations)
        print("Default CAFHS partner grant allocations seeded.")

    # 7. Outbound SMTP & Resend Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS smtp_settings (
            id INTEGER PRIMARY KEY,
            enabled INTEGER DEFAULT 0,
            smtp_host TEXT DEFAULT '',
            smtp_port INTEGER DEFAULT 587,
            smtp_security TEXT DEFAULT 'starttls',
            smtp_user TEXT DEFAULT '',
            smtp_pass TEXT DEFAULT '',
            from_email TEXT DEFAULT 'info@cafhs.org',
            from_name TEXT DEFAULT 'Canadian Association of Family Health Support (CAFHS)',
            reply_to TEXT DEFAULT 'info@cafhs.org',
            resend_api_key TEXT DEFAULT '',
            resend_inbound_domain TEXT DEFAULT '',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        cursor.execute('ALTER TABLE smtp_settings ADD COLUMN resend_api_key TEXT DEFAULT ""')
    except Exception:
        pass
    try:
        cursor.execute('ALTER TABLE smtp_settings ADD COLUMN resend_inbound_domain TEXT DEFAULT ""')
    except Exception:
        pass

    cursor.execute('SELECT COUNT(*) FROM smtp_settings WHERE id = 1')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO smtp_settings (id, enabled, smtp_host, smtp_port, smtp_security, smtp_user, smtp_pass, from_email, from_name, reply_to, resend_api_key, resend_inbound_domain)
            VALUES (1, 0, 'smtp.resend.com', 465, 'ssl', 'resend', '', 'support@cafhs.ca', 'Canadian Association of Family Health Support (CAFHS)', 'support@cafhs.ca', '', '')
        ''')
        print("Default SMTP & Resend settings record initialized.")

    # 8. Inbound Emails Table (Resend Webhook & Direct Inbound Ingest)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inbound_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_id TEXT,
            sender TEXT NOT NULL,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            body_text TEXT,
            body_html TEXT,
            headers TEXT,
            attachments_count INTEGER DEFAULT 0,
            raw_payload TEXT,
            status TEXT DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('SELECT COUNT(*) FROM inbound_emails')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO inbound_emails (
                email_id, sender, recipient, subject, body_text, body_html, headers, attachments_count, status
            ) VALUES (
                'resend_inb_seed_01',
                'Sarah Jenkins <s.jenkins@ontario-caregivers.org>',
                'support@cafhs.ca',
                'Inquiry: Youth & Senior Caregiver Navigation Partnership in Ontario',
                'Hello CAFHS Coordination Team,\n\nWe came across your Ontario Family Health and Caregiver Support initiative and would love to coordinate on family respite workshops for rural families in Southern Ontario.\n\nPlease let us know when Dr. Tremblay or your community directors are available for a brief call.\n\nBest regards,\nSarah Jenkins\nDirector of Outreach\nOntario Caregivers Alliance',
                '<p>Hello CAFHS Coordination Team,</p><p>We came across your Ontario Family Health and Caregiver Support initiative and would love to coordinate on family respite workshops for rural families in Southern Ontario.</p><p>Please let us know when Dr. Tremblay or your community directors are available for a brief call.</p><p>Best regards,<br><strong>Sarah Jenkins</strong><br>Director of Outreach<br>Ontario Caregivers Alliance</p>',
                '{"from":"s.jenkins@ontario-caregivers.org","to":"support@cafhs.ca","subject":"Inquiry: Youth & Senior Caregiver Navigation Partnership in Ontario"}',
                0,
                'unread'
            )
        ''')
        print("Default sample inbound email seeded.")
    
    conn.commit()
    conn.close()

def parse_inbound_payload(body):
    """Normalize inbound email payloads from Resend webhook or REST API callers."""
    import re
    data = body.get('data') if isinstance(body.get('data'), dict) else body

    email_id = data.get('email_id') or data.get('id') or body.get('id') or f"inb_{int(datetime.datetime.now().timestamp())}"

    sender_raw = data.get('from') or data.get('sender') or body.get('from') or 'Unknown Sender'
    if isinstance(sender_raw, list):
        sender = sender_raw[0] if sender_raw else 'Unknown Sender'
    elif isinstance(sender_raw, dict):
        s_name = sender_raw.get('name') or ''
        s_email = sender_raw.get('email') or ''
        sender = f"{s_name} <{s_email}>".strip() if s_name else s_email or 'Unknown Sender'
    else:
        sender = str(sender_raw)

    to_val = data.get('to') or data.get('recipient') or body.get('to') or 'support@cafhs.ca'
    if isinstance(to_val, list):
        to_items = []
        for t in to_val:
            if isinstance(t, dict):
                t_name = t.get('name') or ''
                t_email = t.get('email') or ''
                to_items.append(f"{t_name} <{t_email}>".strip() if t_name else t_email)
            else:
                to_items.append(str(t))
        recipient = ', '.join(to_items)
    elif isinstance(to_val, dict):
        t_name = to_val.get('name') or ''
        t_email = to_val.get('email') or ''
        recipient = f"{t_name} <{t_email}>".strip() if t_name else t_email or 'support@cafhs.ca'
    else:
        recipient = str(to_val)

    subject = data.get('subject') or body.get('subject') or '(No Subject)'

    body_text = data.get('text') or data.get('body') or data.get('body_text') or body.get('text') or ''
    body_html = data.get('html') or data.get('body_html') or body.get('html') or ''

    if not body_text and body_html:
        body_text = re.sub('<[^<]+?>', '', body_html).strip()

    attachments = data.get('attachments') or body.get('attachments') or []
    att_count = len(attachments) if isinstance(attachments, list) else 0
    headers = data.get('headers') or body.get('headers') or {}

    return {
        'email_id': str(email_id),
        'sender': str(sender),
        'recipient': str(recipient),
        'subject': str(subject),
        'body_text': str(body_text),
        'body_html': str(body_html),
        'headers': json.dumps(headers, default=str),
        'attachments_count': att_count,
        'raw_payload': json.dumps(body, default=str)
    }

def fetch_resend_email_detail(email_id, api_key):
    """Fetch full email content from Resend REST API if available."""
    if not api_key or not email_id:
        return None
    import urllib.request
    endpoints = [
        f"https://api.resend.com/emails/receiving/{email_id}",
        f"https://api.resend.com/emails/{email_id}"
    ]
    for url in endpoints:
        try:
            req = urllib.request.Request(url, headers={
                'Authorization': f'Bearer {api_key}',
                'User-Agent': 'CAFHS-Platform/1.0'
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            print(f"[CAFHS Resend API] Attempt to fetch {url} returned: {e}")
            sys.stdout.flush()
    return None

def sync_resend_inbox(api_key):
    """Sync recent received/inbound emails from Resend API into the inbound_emails table."""
    if not api_key:
        return {'success': False, 'error': 'Resend API key is required.'}
    import urllib.request
    
    # Try fetching received emails list from Resend API
    candidate_urls = [
        "https://api.resend.com/emails/receiving",
        "https://api.resend.com/emails"
    ]
    data = None
    last_err = None
    for url in candidate_urls:
        try:
            req = urllib.request.Request(url, headers={
                'Authorization': f'Bearer {api_key}',
                'User-Agent': 'CAFHS-Platform/1.0'
            })
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    break
        except Exception as e:
            last_err = str(e)
            print(f"[CAFHS Resend Sync] Request to {url} failed: {e}")
            sys.stdout.flush()

    if data is None:
        return {'success': False, 'error': f'Failed to query Resend API: {last_err}'}

    items = data.get('data') if isinstance(data, dict) and 'data' in data else (data if isinstance(data, list) else [])
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    new_count = 0
    synced_items = []
    
    for item in items:
        email_id = item.get('id') or item.get('email_id')
        if not email_id:
            continue
        cursor.execute('SELECT id FROM inbound_emails WHERE email_id = ?', (str(email_id),))
        if cursor.fetchone():
            continue
        
        # If detail is missing text/html, fetch full email detail
        full_detail = fetch_resend_email_detail(email_id, api_key) or item
        parsed = parse_inbound_payload(full_detail)
        
        cursor.execute('''
            INSERT INTO inbound_emails (
                email_id, sender, recipient, subject, body_text, body_html, headers, attachments_count, raw_payload, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread')
        ''', (
            str(email_id),
            parsed['sender'],
            parsed['recipient'],
            parsed['subject'],
            parsed['body_text'],
            parsed['body_html'],
            parsed['headers'],
            parsed['attachments_count'],
            parsed['raw_payload']
        ))
        new_count += 1
        synced_items.append({
            'email_id': str(email_id),
            'sender': parsed['sender'],
            'subject': parsed['subject']
        })

    conn.commit()
    conn.close()
    return {
        'success': True,
        'synced_count': new_count,
        'total_remote': len(items),
        'synced_items': synced_items
    }

def get_smtp_config():
    """Retrieve active outbound SMTP and Resend configuration from SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM smtp_settings WHERE id = 1')
    row = cursor.fetchone()
    conn.close()
    if row:
        cfg = dict(row)
        cfg['has_password'] = bool(cfg.get('smtp_pass'))
        cfg['has_resend_key'] = bool(cfg.get('resend_api_key'))
        return cfg
    return {
        'id': 1, 'enabled': 0, 'smtp_host': 'smtp.resend.com', 'smtp_port': 465,
        'smtp_security': 'ssl', 'smtp_user': 'resend', 'smtp_pass': '',
        'from_email': 'support@cafhs.ca', 'from_name': 'Canadian Association of Family Health Support (CAFHS)',
        'reply_to': 'support@cafhs.ca', 'resend_api_key': '', 'resend_inbound_domain': '',
        'has_password': False, 'has_resend_key': False
    }

def send_outbound_email(to_email, subject, body_text, sender_email=None, sender_name=None):
    """
    Attempt real outbound SMTP transmission if configured and enabled.
    Returns dictionary with transmission status and diagnostics.
    """
    cfg = get_smtp_config()
    if not cfg.get('enabled') or not cfg.get('smtp_host'):
        return {
            'sent': False,
            'mode': 'simulated',
            'message': 'SMTP transmission disabled or unconfigured; email queued in SQLite.'
        }

    host = cfg.get('smtp_host', '').strip()
    try:
        port = int(cfg.get('smtp_port', 587))
    except (ValueError, TypeError):
        port = 587
    security = (cfg.get('smtp_security') or 'starttls').strip().lower()
    user = (cfg.get('smtp_user') or '').strip()
    password = (cfg.get('smtp_pass') or '').strip()
    from_addr = sender_email or (cfg.get('from_email') or 'info@cafhs.org').strip()
    display_name = sender_name or (cfg.get('from_name') or 'CAFHS Canada Health Network').strip()
    reply_to = (cfg.get('reply_to') or from_addr).strip()

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"{display_name} <{from_addr}>"
    msg['To'] = to_email
    msg['Reply-To'] = reply_to
    msg['Date'] = email.utils.formatdate(localtime=True)
    msg.attach(MIMEText(body_text, 'plain', 'utf-8'))

    try:
        if security == 'ssl' or port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=12)
        else:
            server = smtplib.SMTP(host, port, timeout=12)
            if security == 'starttls' or port == 587:
                server.starttls()

        if user and password:
            server.login(user, password)

        server.sendmail(from_addr, [to_email], msg.as_string())
        server.quit()

        print(f"[CAFHS SMTP] Live outbound email successfully delivered to {to_email} via {host}:{port}")
        sys.stdout.flush()
        return {
            'sent': True,
            'mode': 'smtp',
            'message': f"Delivered to {to_email} via SMTP ({host}:{port})"
        }
    except Exception as err:
        err_msg = f"{err.__class__.__name__}: {str(err)}"
        print(f"[CAFHS SMTP ERROR] Failed sending to {to_email}: {err_msg}")
        sys.stdout.flush()
        return {
            'sent': False,
            'mode': 'smtp_error',
            'error': err_msg
        }

def dispatch_and_log_email(cursor, recipient, sender, subject, body, user_email, user_name, chat_log_id=None):
    """
    Unified dispatcher: attempts real SMTP transmission (if enabled),
    and records the record into the site_management_emails audit ledger.
    """
    dispatch_res = send_outbound_email(recipient, subject, body, sender_email=sender)
    
    if dispatch_res.get('sent'):
        status = 'sent_smtp'
    elif dispatch_res.get('mode') == 'smtp_error':
        status = 'error_smtp'
    else:
        status = 'dispatched'

    cursor.execute('''
        INSERT INTO site_management_emails 
        (recipient, sender, subject, body, user_email, user_name, chat_log_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (recipient, sender, subject, body, user_email, user_name, chat_log_id, status))
    
    return dispatch_res

class CAFHSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        resp_bytes = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(resp_bytes)))
        self.end_headers()
        self.wfile.write(resp_bytes)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == '/api/users':
            self.handle_get_users(query)
        elif path == '/api/chat/logs':
            self.handle_get_chat_logs(query)
        elif path == '/api/admin/emails':
            self.handle_get_management_emails(query)
        elif path == '/api/inbound-emails':
            self.handle_get_inbound_emails(query)
        elif path == '/api/contributions':
            self.handle_get_contributions(query)
        elif path == '/api/training-partners':
            self.handle_get_training_partners(query)
        elif path == '/api/allocations':
            self.handle_get_allocations(query)
        elif path == '/api/stats':
            self.handle_get_stats()
        elif path == '/api/email/config':
            self.handle_get_smtp_config()
        elif path in ('/api/resend/sync', '/api/inbound-emails/sync-resend'):
            self.handle_get_resend_sync()
        elif path.startswith('/api/'):
            self.send_json({'error': 'Endpoint not found'}, status=404)
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            body = json.loads(post_data)
        except json.JSONDecodeError:
            self.send_json({'error': 'Invalid JSON body'}, status=400)
            return

        if path == '/api/users':
            self.handle_post_user(body)
        elif path == '/api/chat/log':
            self.handle_post_chat_log(body)
        elif path == '/api/contributions':
            self.handle_post_contribution(body)
        elif path == '/api/training-partners':
            self.handle_post_training_partner(body)
        elif path.startswith('/api/training-partners/') and path.endswith('/allocate'):
            partner_id = path.split('/')[-2]
            self.handle_post_partner_allocation(partner_id, body)
        elif path == '/api/email/config':
            self.handle_post_smtp_config(body)
        elif path == '/api/email/test':
            self.handle_post_smtp_test(body)
        elif path == '/api/email/send':
            self.handle_post_send_email(body)
        elif path in ('/api/webhooks/resend-inbound', '/api/webhooks/inbound-email', '/api/inbound-emails/simulate'):
            self.handle_post_inbound_webhook(body)
        elif path in ('/api/resend/sync', '/api/inbound-emails/sync-resend'):
            self.handle_post_resend_sync(body)
        else:
            self.send_json({'error': 'Endpoint not found'}, status=404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        put_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            body = json.loads(put_data)
        except json.JSONDecodeError:
            self.send_json({'error': 'Invalid JSON body'}, status=400)
            return

        if path.startswith('/api/users/'):
            user_id = path.split('/')[-1]
            self.handle_put_user(user_id, body)
        elif path.startswith('/api/training-partners/'):
            partner_id = path.split('/')[-1]
            self.handle_put_training_partner(partner_id, body)
        elif path.startswith('/api/inbound-emails/') and path.endswith('/status'):
            email_id = path.split('/')[-2]
            self.handle_put_inbound_email_status(email_id, body)
        else:
            self.send_json({'error': 'Endpoint not found'}, status=404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/users/'):
            user_id = path.split('/')[-1]
            self.handle_delete_user(user_id)
        elif path.startswith('/api/training-partners/'):
            partner_id = path.split('/')[-1]
            self.handle_delete_training_partner(partner_id)
        else:
            self.send_json({'error': 'Endpoint not found'}, status=404)

    # --- API Handlers ---

    def handle_get_users(self, query):
        search = query.get('search', [''])[0].strip().lower()
        role = query.get('role', [''])[0].strip()

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        sql = 'SELECT * FROM users WHERE 1=1'
        params = []

        if search:
            sql += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%'])
        if role:
            sql += ' AND role = ?'
            params.append(role)

        sql += ' ORDER BY created_at DESC'
        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        self.send_json({'users': rows, 'total': len(rows)})

    def handle_post_user(self, body):
        name = body.get('name', '').strip()
        email = body.get('email', '').strip().lower()
        role = body.get('role', 'user')
        provider = body.get('provider', 'local')
        province = body.get('province', 'ON')
        user_id = body.get('user_id', f"usr-{int(datetime.datetime.now().timestamp()*1000)}")

        if not email or not name:
            self.send_json({'error': 'Name and email are required'}, status=400)
            return

        # Auto-admin for designated emails
        if email in ['mack.chen@viccollege.com', 'info@cafhs.org']:
            role = 'admin'

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        existing = cursor.fetchone()

        now = datetime.datetime.now().isoformat()
        if existing:
            cursor.execute('''
                UPDATE users
                SET name = ?, role = ?, provider = ?, last_login = ?
                WHERE email = ?
            ''', (name, role if role == 'admin' else existing['role'], provider, now, email))
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = dict(cursor.fetchone())
        else:
            title = 'Executive Administrator' if role == 'admin' else 'Registered Member'
            cursor.execute('''
                INSERT INTO users (user_id, name, email, role, provider, province, title, created_at, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, name, email, role, provider, province, title, now, now))
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = dict(cursor.fetchone())

        conn.commit()
        conn.close()

        self.send_json({'success': True, 'user': user})

    def handle_put_user(self, user_id, body):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        fields = []
        params = []
        for key in ['role', 'status', 'title', 'name', 'province']:
            if key in body:
                fields.append(f"{key} = ?")
                params.append(body[key])

        if not fields:
            conn.close()
            self.send_json({'error': 'No fields to update'}, status=400)
            return

        params.append(user_id)
        cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE user_id = ? OR id = ?", params + [user_id])
        conn.commit()

        cursor.execute("SELECT * FROM users WHERE user_id = ? OR id = ?", (user_id, user_id))
        row = cursor.fetchone()
        conn.close()

        if row:
            self.send_json({'success': True, 'user': dict(row)})
        else:
            self.send_json({'error': 'User not found'}, status=404)

    def handle_delete_user(self, user_id):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE user_id = ? OR id = ?', (user_id, user_id))
        changes = conn.total_changes
        conn.commit()
        conn.close()

        if changes > 0:
            self.send_json({'success': True, 'message': 'User deleted'})
        else:
            self.send_json({'error': 'User not found'}, status=404)

    def handle_post_chat_log(self, body):
        session_id = body.get('session_id', f"sess-{int(datetime.datetime.now().timestamp())}")
        user_id = body.get('user_id', '')
        user_name = body.get('user_name', '').strip() or 'Anonymous User'
        user_email = body.get('user_email', '').strip().lower()
        user_message = body.get('user_message', '').strip()
        ai_response = body.get('ai_response', '').strip()
        model_used = body.get('model_used', 'gpt-4o-mini')
        is_crisis = 1 if body.get('is_crisis') else 0

        if not user_message:
            self.send_json({'error': 'user_message is required'}, status=400)
            return

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Insert chat log
        cursor.execute('''
            INSERT INTO chat_logs (session_id, user_id, user_name, user_email, user_message, ai_response, model_used, is_crisis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, user_id, user_name, user_email, user_message, ai_response, model_used, is_crisis))
        chat_log_id = cursor.lastrowid

        # 2. Automated Email Alert to Site Management Team
        timestamp_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S EST")
        crisis_tag = "🚨 [CRISIS ALERT - 988 TRIGGERED] " if is_crisis else ""
        subject = f"{crisis_tag}[CAFHS AI Health Consultation] Inquiry from {user_name} ({user_email})"
        
        email_body = f"""=====================================================
CANADIAN ASSOCIATION OF FAMILY HEALTH SUPPORT (CAFHS)
AI HEALTH COMPANION CONSULTATION NOTIFICATION FOR MANAGEMENT
=====================================================

Date & Time: {timestamp_str}
Session ID:  {session_id}
AI Model:    {model_used}
Crisis Flag: {'YES - Suicide/Crisis Referral Activated' if is_crisis else 'No'}

--- USER INFORMATION ---
Name:  {user_name}
Email: {user_email}
Role:  Verified Logged-in User

--- USER HEALTH INQUIRY ---
"{user_message}"

--- AI COMPANION RESPONSE ---
{ai_response}

=====================================================
AUTOMATED NOTICE FOR SITE MANAGEMENT:
This notification was automatically dispatched to the CAFHS site management team
(Mack Chen & Dr. Marc Tremblay) because a user initiated an AI health consultation session.
Database Log ID: #{chat_log_id}
====================================================="""

        created_alerts = []
        for recipient in MANAGEMENT_EMAILS:
            dispatch_res = dispatch_and_log_email(cursor, recipient, 'nova-ai@cafhs.ca', subject, email_body, user_email, user_name, chat_log_id)
            created_alerts.append({
                'id': cursor.lastrowid,
                'recipient': recipient,
                'subject': subject,
                'dispatch': dispatch_res
            })

        conn.commit()
        conn.close()

        print(f"[CAFHS Server] Recorded chat from {user_name} ({user_email}) & dispatched alerts to {MANAGEMENT_EMAILS}")
        sys.stdout.flush()

        self.send_json({
            'success': True,
            'chat_log_id': chat_log_id,
            'alerts_dispatched': created_alerts
        })

    def handle_get_chat_logs(self, query):
        user_email = query.get('email', [''])[0].strip().lower()
        limit = int(query.get('limit', [100])[0])

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if user_email:
            cursor.execute('SELECT * FROM chat_logs WHERE user_email = ? ORDER BY created_at DESC LIMIT ?', (user_email, limit))
        else:
            cursor.execute('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT ?', (limit,))

        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        self.send_json({'chat_logs': rows, 'total': len(rows)})

    def handle_get_management_emails(self, query):
        limit = int(query.get('limit', [150])[0])
        direction = query.get('direction', ['all'])[0].strip().lower()

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        combined = []

        # Outbound site management emails
        if direction in ('all', 'outbound'):
            cursor.execute('''
                SELECT id, recipient, sender, subject, body, user_email, user_name, status, created_at,
                       'outbound' as direction, NULL as body_html, 0 as attachments_count, NULL as email_id
                FROM site_management_emails
                ORDER BY created_at DESC LIMIT ?
            ''', (limit,))
            outbound_rows = [dict(r) for r in cursor.fetchall()]
            combined.extend(outbound_rows)

        # Inbound webhook emails
        if direction in ('all', 'inbound'):
            cursor.execute('''
                SELECT id, recipient, sender, subject, body_text as body, sender as user_email,
                       sender as user_name, status, created_at, 'inbound' as direction,
                       body_html, attachments_count, email_id
                FROM inbound_emails
                ORDER BY created_at DESC LIMIT ?
            ''', (limit,))
            inbound_rows = [dict(r) for r in cursor.fetchall()]
            combined.extend(inbound_rows)

        conn.close()

        # Sort merged list by created_at DESC
        combined.sort(key=lambda x: str(x.get('created_at') or ''), reverse=True)
        final_list = combined[:limit]

        inbound_count = sum(1 for e in combined if e.get('direction') == 'inbound')
        outbound_count = sum(1 for e in combined if e.get('direction') == 'outbound')

        self.send_json({
            'emails': final_list,
            'total': len(final_list),
            'inbound_count': inbound_count,
            'outbound_count': outbound_count
        })

    def handle_get_inbound_emails(self, query):
        limit = int(query.get('limit', [100])[0])
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inbound_emails ORDER BY created_at DESC LIMIT ?', (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        self.send_json({'inbound_emails': rows, 'total': len(rows)})

    def handle_put_inbound_email_status(self, email_id, body):
        status = body.get('status', 'read').strip()
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('UPDATE inbound_emails SET status = ? WHERE id = ?', (status, email_id))
        conn.commit()
        conn.close()
        self.send_json({'success': True, 'id': email_id, 'status': status})

    def handle_post_inbound_webhook(self, body):
        parsed = parse_inbound_payload(body)
        
        # If body is empty (some Resend webhooks only send email_id / metadata), attempt fetching via Resend API
        if not parsed['body_text'] and not parsed['body_html']:
            cfg = get_smtp_config()
            api_key = cfg.get('resend_api_key')
            if api_key and parsed['email_id']:
                fetched = fetch_resend_email_detail(parsed['email_id'], api_key)
                if fetched:
                    parsed = parse_inbound_payload(fetched)

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO inbound_emails (
                email_id, sender, recipient, subject, body_text, body_html, headers, attachments_count, raw_payload, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread')
        ''', (
            parsed['email_id'],
            parsed['sender'],
            parsed['recipient'],
            parsed['subject'],
            parsed['body_text'],
            parsed['body_html'],
            parsed['headers'],
            parsed['attachments_count'],
            parsed['raw_payload']
        ))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        print(f"[CAFHS INBOUND WEBHOOK] Inbound email #{new_id} from {parsed['sender']} to {parsed['recipient']}: '{parsed['subject']}'")
        sys.stdout.flush()

        self.send_json({
            'success': True,
            'message': 'Inbound email received and recorded successfully.',
            'id': new_id,
            'email_id': parsed['email_id'],
            'sender': parsed['sender'],
            'recipient': parsed['recipient'],
            'subject': parsed['subject'],
            'direction': 'inbound'
        })

    def handle_get_resend_sync(self):
        cfg = get_smtp_config()
        api_key = cfg.get('resend_api_key', '').strip()
        if not api_key:
            self.send_json({'success': False, 'error': 'Resend API Key is not configured. Please save your Resend API Key in Gateway Setup.'}, status=400)
            return
        result = sync_resend_inbox(api_key)
        self.send_json(result)

    def handle_post_resend_sync(self, body):
        cfg = get_smtp_config()
        api_key = (body.get('resend_api_key') or body.get('api_key') or cfg.get('resend_api_key') or '').strip()
        if api_key == '••••••••':
            api_key = cfg.get('resend_api_key', '').strip()
        if not api_key:
            self.send_json({'success': False, 'error': 'Resend API Key is required to sync emails from Resend. Please enter your key in Gateway Setup.'}, status=400)
            return
        result = sync_resend_inbox(api_key)
        self.send_json(result)

    def handle_get_contributions(self, query):
        search = query.get('search', [''])[0].strip().lower()
        limit = int(query.get('limit', [100])[0])

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        sql = 'SELECT * FROM contributions WHERE 1=1'
        params = []
        if search:
            sql += ' AND (LOWER(donor_name) LIKE ? OR LOWER(donor_email) LIKE ? OR LOWER(transaction_id) LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        sql += ' ORDER BY created_at DESC LIMIT ?'
        params.append(limit)

        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]

        cursor.execute('SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM contributions WHERE status = "succeeded"')
        count_row = cursor.fetchone()
        count = count_row[0] if count_row else 0
        total_amount = count_row[1] if count_row else 0.0
        conn.close()

        self.send_json({
            'contributions': rows,
            'total_count': count,
            'total_amount_cad': total_amount
        })

    def handle_post_contribution(self, body):
        donor_name = body.get('donor_name', '').strip()
        donor_email = body.get('donor_email', '').strip().lower()
        try:
            amount = float(body.get('amount', 0))
        except (ValueError, TypeError):
            amount = 0.0
        currency = body.get('currency', 'CAD').upper()
        frequency = body.get('frequency', 'one-time')
        payment_method = body.get('payment_method', 'credit_card')
        province = body.get('province', 'ON')
        notes = body.get('notes', '').strip()

        if not donor_name or not donor_email or amount <= 0:
            self.send_json({'error': 'Valid contributor name, email, and amount are required'}, status=400)
            return

        now_ts = int(datetime.datetime.now().timestamp())
        random_suffix = os.urandom(2).hex().upper()
        transaction_id = f"CAFHS-TXN-{datetime.datetime.now().strftime('%Y%m')}-{now_ts % 100000:05d}{random_suffix}"

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # All donor gifts are allocated directly to CAFHS
        allocated_partner_name = "Canadian Association of Family Health Support (CAFHS) — Caregiver & Training Reserve Fund"

        # 1. Insert Contribution Record - Donors allocate directly to CAFHS
        cursor.execute('''
            INSERT INTO contributions 
            (transaction_id, donor_name, donor_email, amount, currency, frequency, payment_method, province, notes, allocated_partner_id, allocated_partner_name, status, receipt_sent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'succeeded', 1)
        ''', (transaction_id, donor_name, donor_email, amount, currency, frequency, payment_method, province, notes, allocated_partner_name))
        contribution_id = cursor.lastrowid

        # 2. Build Official Contribution Receipt Email to Donor
        formatted_date = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p EST")
        receipt_subject = f"Official Community Contribution Receipt: {transaction_id} • Canadian Association of Family Health Support"
        
        receipt_body = f"""======================================================================
CANADIAN ASSOCIATION OF FAMILY HEALTH SUPPORT (CAFHS)
ASSOCIATION CANADIENNE DE SOUTIEN À LA SANTÉ FAMILIALE (ACSSF)
OFFICIAL COMMUNITY CONTRIBUTION RECEIPT / REÇU DE CONTRIBUTION COMMUNAUTAIRE
======================================================================

Date of Contribution:   {formatted_date}
Official Receipt Ref:   {transaction_id}
Database Entry ID:      #{contribution_id}

DONOR INFORMATION:
------------------
Contributor Name:       {donor_name}
Contributor Email:      {donor_email}
Province of Origin:     {province}

CONTRIBUTION DETAILS:
---------------------
Contribution Amount:    ${amount:.2f} {currency}
Frequency:              {frequency.replace('_', ' ').capitalize()}
Payment Method:         {payment_method.replace('_', ' ').title()}
Status:                 Payment Confirmed & Settled (100% Direct Grassroots Impact)

COMMUNITY PROGRAM & TRAINING ALLOCATION:
----------------------------------------
Recipient Organization: Canadian Association of Family Health Support (CAFHS)
Fund Designation:       Frontline Caregiver Respite, Perinatal & Youth Mental Health
Partner Policy:         CAFHS administers and allocates training grants & student bursaries 
                        to accredited Ontario educational & training partners.

Your generous gift directly finances our frontline non-profit community services:
- Family Caregiver Respite Navigation & Burnout Peer Coaching
- Youth & Teen Emotional Resilience Mental Health Circles
- Perinatal & Maternal Postpartum Peer Care
- Educational Training Grants & Bursaries administered by CAFHS to Ontario Education Partners
- 24/7 Canadian Health Resource & Navigation Guidance (8-1-1 / 9-8-8)

CANADIAN NON-PROFIT COMMUNITY ASSOCIATION DISCLOSURE:
------------------------------------------------------
The Canadian Association of Family Health Support (CAFHS) is an unregistered 
Canadian non-profit community association. This receipt acknowledges a voluntary 
community contribution supporting frontline family wellness programs. 
Under the Canada Income Tax Act, contributions to unregistered non-profit 
associations are not tax-deductible as charitable donations.

Thank you deeply for empowering families and caregivers across Canada!

In Health and Solidarity,
The Executive Management Team
Canadian Association of Family Health Support (CAFHS)
Website: http://localhost:8085
Institutional & Educational Partners: Ontario public and private education organizations
Inquiries: info@cafhs.org
Executive Administrator: Mack Chen (mack.chen@viccollege.com)
Clinical Director: Dr. Marc Tremblay, MSW (info@cafhs.org)
======================================================================
"""

        # Dispatch email to Donor
        donor_dispatch = dispatch_and_log_email(cursor, donor_email, 'contributions@cafhs.ca', receipt_subject, receipt_body, donor_email, donor_name)

        # Also dispatch alert email to Site Management Team
        mgmt_subject = f"💰 [NEW CONTRIBUTION RECEIVED] ${amount:.2f} {currency} from {donor_name} ({donor_email})"
        mgmt_body = f"""Notice to CAFHS Site Management Team:

A new financial contribution has been successfully received and settled!

Contributor: {donor_name} ({donor_email})
Amount:      ${amount:.2f} {currency} ({frequency})
Method:      {payment_method}
Reference:   {transaction_id}
Date:        {formatted_date}
Province:    {province}
Recipient:   CAFHS Frontline Community & Caregiver Training Fund

The contribution is credited to CAFHS and ready for program operations and training partner bursary allocation.
Record ID #{contribution_id} saved in SQLite table 'contributions'.
"""

        for recipient in MANAGEMENT_EMAILS:
            dispatch_and_log_email(cursor, recipient, 'finance@cafhs.ca', mgmt_subject, mgmt_body, donor_email, donor_name)

        conn.commit()

        cursor.execute('SELECT * FROM contributions WHERE id = ?', (contribution_id,))
        saved_record = dict(cursor.fetchone())
        conn.close()

        print(f"[CAFHS Server] Contribution #{contribution_id} (${amount:.2f} {currency}) from {donor_name} received by CAFHS.")
        sys.stdout.flush()

        self.send_json({
            'success': True,
            'transaction_id': transaction_id,
            'contribution': saved_record,
            'receipt': {
                'subject': receipt_subject,
                'body': receipt_body,
                'recipient': donor_email
            }
        })

    # --- Training Partner Handlers ---

    def handle_get_training_partners(self, query):
        search = query.get('search', [''])[0].strip().lower()
        status_filter = query.get('status', [''])[0].strip().lower()
        type_filter = query.get('type', [''])[0].strip().lower()

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        sql = 'SELECT * FROM training_partners WHERE 1=1'
        params = []

        if search:
            sql += ' AND (LOWER(institution_name) LIKE ? OR LOWER(campus_city) LIKE ? OR LOWER(programs) LIKE ? OR LOWER(partner_code) LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])

        if status_filter:
            sql += ' AND status = ?'
            params.append(status_filter)

        if type_filter:
            sql += ' AND institution_type = ?'
            params.append(type_filter)

        sql += ' ORDER BY created_at DESC'
        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        self.send_json({'partners': rows, 'total': len(rows)})

    def handle_post_training_partner(self, body):
        institution_name = body.get('institution_name', '').strip()
        institution_type = body.get('institution_type', 'community_training_org').strip()
        campus_city = body.get('campus_city', 'Toronto').strip()
        province = body.get('province', 'ON').strip()
        website = body.get('website', '').strip()
        contact_name = body.get('contact_name', '').strip()
        contact_title = body.get('contact_title', '').strip()
        contact_email = body.get('contact_email', '').strip().lower()
        contact_phone = body.get('contact_phone', '').strip()
        accreditation_id = body.get('accreditation_id', '').strip()
        programs = body.get('programs', '').strip()
        payout_method = body.get('payout_method', 'direct_deposit').strip()
        banking_info = body.get('banking_info', '').strip()
        allocation_focus = body.get('allocation_focus', 'Caregiver & Frontline Health Bursaries').strip()
        notes = body.get('notes', '').strip()

        if not institution_name or not contact_name or not contact_email:
            self.send_json({'error': 'Institution name, primary contact name, and official email are required'}, status=400)
            return

        now_year = datetime.datetime.now().strftime('%Y')
        random_suffix = os.urandom(2).hex().upper()
        partner_code = f"TP-ON-{now_year}-{random_suffix}"

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO training_partners (
                partner_code, institution_name, institution_type, campus_city, province,
                website, contact_name, contact_title, contact_email, contact_phone,
                accreditation_id, programs, payout_method, banking_info, allocation_focus,
                notes, status, total_donations_allocated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', 0.0)
        ''', (
            partner_code, institution_name, institution_type, campus_city, province,
            website, contact_name, contact_title, contact_email, contact_phone,
            accreditation_id, programs, payout_method, banking_info, allocation_focus,
            notes
        ))
        partner_id = cursor.lastrowid
        formatted_date = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p EST")

        # 1. Send Confirmation Email to the Institution Contact
        partner_subject = f"🎓 Registration Confirmed: Ontario Healthcare Training Partner #{partner_code} • CAFHS"
        partner_body = f"""======================================================================
CANADIAN ASSOCIATION OF FAMILY HEALTH SUPPORT (CAFHS)
ONTARIO HEALTHCARE & CAREGIVER TRAINING PARTNER NETWORK
======================================================================

Dear {contact_name} ({contact_title or 'Institution Representative'}),

Thank you for registering {institution_name} as an authorized Ontario Training Partner with the Canadian Association of Family Health Support (CAFHS).

Your institution profile is now registered and verified to accept community health education donations, student tuition relief grants, and caregiver support bursaries.

REGISTRATION DETAILS:
---------------------
Institution Name:      {institution_name}
Institution Type:      {institution_type.replace('_', ' ').title()}
Campus / City:         {campus_city}, {province}
Partner Code:          #{partner_code}
Accreditation Ref:     {accreditation_id or 'Ontario Recognized / Registered'}
Contact Person:        {contact_name} ({contact_title})
Email:                 {contact_email}
Programs Enrolled:     {programs or 'Healthcare & Caregiver Support Training'}
Disbursement Method:   {payout_method.replace('_', ' ').title()}
Financial Details:     {banking_info or 'On File'}
Bursary Focus:         {allocation_focus}
Status:                VERIFIED & ACTIVE (Ready to Receive Community Allocations)

HOW DONATION DISBURSEMENT WORKS:
--------------------------------
1. Community donors and supporters across Canada can now choose to allocate their contributions directly to {institution_name} to fund student caregiver bursaries and frontline healthcare training.
2. 100% of designated funds are aggregated and disbursed directly according to your registered financial payout details.
3. Official community contribution receipts are issued automatically to donors with your institution cited as the accredited recipient training partner.

Thank you for partnering with CAFHS to educate and empower Ontario's healthcare workforce!

In Solidarity,
The Executive Management Team
Canadian Association of Family Health Support (CAFHS)
Website: http://localhost:8085
Inquiries: info@cafhs.org • mack.chen@viccollege.com
======================================================================
"""
        dispatch_and_log_email(cursor, contact_email, 'partners@cafhs.ca', partner_subject, partner_body, contact_email, contact_name)

        # 2. Send Alert Email to CAFHS Site Management Team
        mgmt_subject = f"🎓 [NEW TRAINING PARTNER REGISTERED] {institution_name} ({campus_city}, ON)"
        mgmt_body = f"""Notice to CAFHS Site Management Team:

A new Ontario educational institution / training provider has successfully registered to accept community health donations and caregiver training bursaries!

Institution:    {institution_name} ({campus_city}, {province})
Partner Code:   #{partner_code} (Database ID #{partner_id})
Type:           {institution_type.replace('_', ' ').title()}
Primary Contact:{contact_name} ({contact_title})
Official Email: {contact_email}
Phone:          {contact_phone or 'N/A'}
Website:        {website or 'N/A'}
Accreditation:  {accreditation_id or 'Standard Ontario Registration'}
Programs:       {programs}
Payout Setup:   {payout_method} ({banking_info})
Bursary Target: {allocation_focus}
Date:           {formatted_date}

The institution is automatically verified and ready for community allocation in the contribution portal.
"""
        for recipient in MANAGEMENT_EMAILS:
            dispatch_and_log_email(cursor, recipient, 'partners@cafhs.ca', mgmt_subject, mgmt_body, contact_email, contact_name)

        conn.commit()

        cursor.execute('SELECT * FROM training_partners WHERE id = ?', (partner_id,))
        saved_partner = dict(cursor.fetchone())
        conn.close()

        print(f"[CAFHS Server] New training partner #{partner_code} ({institution_name}) registered successfully.")
        sys.stdout.flush()

        self.send_json({
            'success': True,
            'partner': saved_partner,
            'message': f"Institution {institution_name} successfully registered to accept community donations."
        })

    def handle_put_training_partner(self, partner_id, body):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM training_partners WHERE id = ?', (partner_id,))
        existing = cursor.fetchone()
        if not existing:
            conn.close()
            self.send_json({'error': 'Training partner not found'}, status=404)
            return

        status = body.get('status', existing['status'])
        institution_name = body.get('institution_name', existing['institution_name'])
        programs = body.get('programs', existing['programs'])
        banking_info = body.get('banking_info', existing['banking_info'])
        allocation_focus = body.get('allocation_focus', existing['allocation_focus'])
        notes = body.get('notes', existing['notes'])

        cursor.execute('''
            UPDATE training_partners 
            SET status = ?, institution_name = ?, programs = ?, banking_info = ?, allocation_focus = ?, notes = ?
            WHERE id = ?
        ''', (status, institution_name, programs, banking_info, allocation_focus, notes, partner_id))
        conn.commit()

        cursor.execute('SELECT * FROM training_partners WHERE id = ?', (partner_id,))
        updated = dict(cursor.fetchone())
        conn.close()

        self.send_json({'success': True, 'partner': updated})

    def handle_delete_training_partner(self, partner_id):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM training_partners WHERE id = ?', (partner_id,))
        conn.commit()
        conn.close()
        self.send_json({'success': True, 'deleted_id': partner_id})

    # --- CAFHS Grant & Bursary Allocation Handlers ---

    def handle_get_allocations(self, query):
        partner_id = query.get('partner_id', [''])[0].strip()
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        sql = 'SELECT * FROM partner_allocations WHERE 1=1'
        params = []
        if partner_id:
            sql += ' AND partner_id = ?'
            params.append(partner_id)
        sql += ' ORDER BY created_at DESC'
        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]

        cursor.execute('SELECT COALESCE(SUM(amount), 0) FROM partner_allocations')
        total_allocated = cursor.fetchone()[0]
        conn.close()

        self.send_json({'allocations': rows, 'total': len(rows), 'total_allocated_cad': total_allocated})

    def handle_post_partner_allocation(self, partner_id, body):
        try:
            p_id = int(partner_id)
        except (ValueError, TypeError):
            self.send_json({'error': 'Invalid partner ID'}, status=400)
            return

        try:
            amount = float(body.get('amount', 0))
        except (ValueError, TypeError):
            amount = 0.0

        purpose = body.get('purpose', 'Caregiver & Frontline Healthcare Student Training Bursary').strip()
        reference_note = body.get('reference_note', '').strip()
        disbursed_by = body.get('disbursed_by', 'CAFHS Executive Administration').strip()

        if amount <= 0:
            self.send_json({'error': 'A valid allocation amount greater than 0 is required'}, status=400)
            return

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM training_partners WHERE id = ?', (p_id,))
        p_row = cursor.fetchone()
        if not p_row:
            conn.close()
            self.send_json({'error': 'Training partner not found'}, status=404)
            return

        partner = dict(p_row)
        formatted_date = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p EST")

        # 1. Insert into partner_allocations
        cursor.execute('''
            INSERT INTO partner_allocations 
            (partner_id, partner_code, institution_name, amount, currency, purpose, reference_note, disbursed_by)
            VALUES (?, ?, ?, ?, 'CAD', ?, ?, ?)
        ''', (partner['id'], partner['partner_code'], partner['institution_name'], amount, purpose, reference_note, disbursed_by))
        allocation_id = cursor.lastrowid

        # 2. Update training_partner total_donations_allocated
        cursor.execute('''
            UPDATE training_partners 
            SET total_donations_allocated = total_donations_allocated + ? 
            WHERE id = ?
        ''', (amount, partner['id']))

        new_total = (partner['total_donations_allocated'] or 0.0) + amount

        # 3. Send official Grant Remittance Email to Partner
        remittance_subject = f"🎓 CAFHS Training Grant Allocated: ${amount:.2f} CAD for {partner['institution_name']} (Grant Ref #{allocation_id})"
        remittance_body = f"""======================================================================
CANADIAN ASSOCIATION OF FAMILY HEALTH SUPPORT (CAFHS)
OFFICIAL GRANT DISBURSEMENT & STUDENT BURSARY ALLOCATION NOTICE
======================================================================

Dear {partner['contact_name']} ({partner['contact_title'] or 'Institution Contact'}),

We are pleased to advise that the Canadian Association of Family Health Support (CAFHS) Executive Management Team has officially allocated a community training grant from centralized donor contributions to {partner['institution_name']}.

GRANT ALLOCATION DETAILS:
-------------------------
Recipient Institution:  {partner['institution_name']} (#{partner['partner_code']})
Campus Location:        {partner['campus_city']}, ON
Grant Allocation ID:    #GA-{datetime.datetime.now().strftime('%Y%m')}-{allocation_id:04d}
Grant Amount:           ${amount:.2f} CAD
Date of Allocation:     {formatted_date}
Disbursement Method:    {partner['payout_method'].replace('_', ' ').title()}
Banking / EFT on File:  {partner['banking_info']}
Designated Purpose:     {purpose}
Admin Reference Note:   {reference_note or 'Standard 2026 Ontario Caregiver & Healthcare Training Grant'}
Disbursed By:           {disbursed_by}

CUMULATIVE INSTITUTIONAL ALLOCATION:
------------------------------------
Total CAFHS Grants to Date: ${new_total:.2f} CAD

TERMS & CONDITIONS:
-------------------
In accordance with your partner registration, 100% of these allocated funds must be applied directly to student tuition relief, caregiver respite training, and PSW student aid.

Thank you for your valued partnership in strengthening Ontario's family health workforce.

In Solidarity,
The Executive Management Team
Canadian Association of Family Health Support (CAFHS)
Inquiries: finance@cafhs.ca • info@cafhs.org
Website: http://localhost:8085
======================================================================
"""
        dispatch_and_log_email(cursor, partner['contact_email'], 'finance@cafhs.ca', remittance_subject, remittance_body, partner['contact_email'], partner['contact_name'])

        # 4. Send alert to Management Emails
        mgmt_subject = f"🏛️ [CAFHS GRANT ALLOCATED] ${amount:.2f} CAD disbursed to {partner['institution_name']}"
        mgmt_body = f"""Notice to CAFHS Site Management Team:

A new grant allocation has been authorized and disbursed to a registered training partner:

Institution:   {partner['institution_name']} (#{partner['partner_code']})
Amount:        ${amount:.2f} CAD
Purpose:       {purpose}
Disbursed By:  {disbursed_by}
Remittance:    {partner['payout_method']} ({partner['banking_info']})
New Total:     ${new_total:.2f} CAD to date
"""
        for recipient in MANAGEMENT_EMAILS:
            dispatch_and_log_email(cursor, recipient, 'finance@cafhs.ca', mgmt_subject, mgmt_body, partner['contact_email'], partner['contact_name'])

        conn.commit()

        cursor.execute('SELECT * FROM partner_allocations WHERE id = ?', (allocation_id,))
        saved_allocation = dict(cursor.fetchone())
        cursor.execute('SELECT * FROM training_partners WHERE id = ?', (partner['id'],))
        updated_partner = dict(cursor.fetchone())
        conn.close()

        print(f"[CAFHS Server] Grant #{allocation_id} (${amount:.2f} CAD) allocated by CAFHS to {partner['institution_name']}.")
        sys.stdout.flush()

        self.send_json({
            'success': True,
            'allocation': saved_allocation,
            'partner': updated_partner,
            'message': f"Successfully allocated ${amount:.2f} CAD grant to {partner['institution_name']}."
        })

    def handle_get_stats(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM chat_logs')
        total_chats = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM chat_logs WHERE is_crisis = 1')
        crisis_chats = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM site_management_emails')
        total_alerts = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM contributions WHERE status = "succeeded"')
        contributions_row = cursor.fetchone()
        total_contributions = contributions_row[0] if contributions_row else 0
        total_contributed_cad = contributions_row[1] if contributions_row else 0.0

        cursor.execute('SELECT COUNT(*) FROM training_partners')
        total_partners = cursor.fetchone()[0]

        cursor.execute('SELECT COALESCE(SUM(total_donations_allocated), 0) FROM training_partners')
        partner_allocated_cad = cursor.fetchone()[0]

        cafhs_program_balance = max(0.0, total_contributed_cad - partner_allocated_cad)

        conn.close()

        self.send_json({
            'total_users': total_users,
            'total_chats': total_chats,
            'crisis_chats': crisis_chats,
            'total_alerts': total_alerts,
            'total_contributions': total_contributions,
            'total_contributed_cad': total_contributed_cad,
            'total_partners': total_partners,
            'partner_allocated_cad': partner_allocated_cad,
            'cafhs_program_balance': cafhs_program_balance
        })

    def handle_get_smtp_config(self):
        cfg = get_smtp_config()
        masked_cfg = dict(cfg)
        has_pass = bool(masked_cfg.get('smtp_pass'))
        has_resend = bool(masked_cfg.get('resend_api_key'))
        masked_cfg['has_password'] = has_pass
        masked_cfg['has_resend_key'] = has_resend
        masked_cfg['smtp_pass'] = '••••••••' if has_pass else ''
        masked_cfg['resend_api_key'] = '••••••••' if has_resend else ''
        self.send_json({'success': True, 'config': masked_cfg})

    def handle_post_smtp_config(self, body):
        enabled = 1 if body.get('enabled') in [1, True, '1', 'true'] else 0
        smtp_host = body.get('smtp_host', '').strip()
        try:
            smtp_port = int(body.get('smtp_port', 587))
        except (ValueError, TypeError):
            smtp_port = 587
        smtp_security = body.get('smtp_security', 'starttls').strip().lower()
        smtp_user = body.get('smtp_user', '').strip()
        smtp_pass = body.get('smtp_pass', '').strip()
        from_email = body.get('from_email', 'info@cafhs.org').strip()
        from_name = body.get('from_name', 'Canadian Association of Family Health Support (CAFHS)').strip()
        reply_to = body.get('reply_to', 'info@cafhs.org').strip()
        resend_api_key = body.get('resend_api_key', '').strip()
        resend_inbound_domain = body.get('resend_inbound_domain', '').strip()

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM smtp_settings WHERE id = 1')
        existing = cursor.fetchone()

        if (not smtp_pass or smtp_pass == '••••••••') and existing and existing['smtp_pass']:
            final_pass = existing['smtp_pass']
        else:
            final_pass = smtp_pass

        if (not resend_api_key or resend_api_key == '••••••••') and existing and existing['resend_api_key']:
            final_resend_key = existing['resend_api_key']
        else:
            final_resend_key = resend_api_key

        cursor.execute('''
            UPDATE smtp_settings
            SET enabled = ?, smtp_host = ?, smtp_port = ?, smtp_security = ?,
                smtp_user = ?, smtp_pass = ?, from_email = ?, from_name = ?,
                reply_to = ?, resend_api_key = ?, resend_inbound_domain = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (enabled, smtp_host, smtp_port, smtp_security, smtp_user, final_pass, from_email, from_name, reply_to, final_resend_key, resend_inbound_domain))
        conn.commit()

        cursor.execute('SELECT * FROM smtp_settings WHERE id = 1')
        updated = dict(cursor.fetchone())
        conn.close()

        updated['has_password'] = bool(updated.get('smtp_pass'))
        updated['has_resend_key'] = bool(updated.get('resend_api_key'))
        updated['smtp_pass'] = '••••••••' if updated['has_password'] else ''
        updated['resend_api_key'] = '••••••••' if updated['has_resend_key'] else ''

        print(f"[CAFHS SMTP] Configuration updated: host={smtp_host}:{smtp_port}, security={smtp_security}, enabled={enabled}")
        sys.stdout.flush()

        self.send_json({
            'success': True,
            'message': 'Outbound email configuration saved successfully.',
            'config': updated
        })

    def handle_post_smtp_test(self, body):
        to_email = body.get('to_email', '').strip() or 'info@cafhs.org'
        
        temp_host = body.get('smtp_host', '').strip()
        temp_port = body.get('smtp_port')
        temp_security = body.get('smtp_security', '').strip().lower()
        temp_user = body.get('smtp_user', '').strip()
        temp_pass = body.get('smtp_pass', '').strip()
        temp_from = body.get('from_email', '').strip()
        temp_name = body.get('from_name', '').strip()

        cfg = get_smtp_config()
        host = temp_host if temp_host else cfg.get('smtp_host', '').strip()
        try:
            port = int(temp_port) if temp_port else int(cfg.get('smtp_port', 587))
        except (ValueError, TypeError):
            port = 587
        security = temp_security if temp_security else cfg.get('smtp_security', 'starttls').strip().lower()
        user = temp_user if temp_user else cfg.get('smtp_user', '').strip()
        
        if temp_pass and temp_pass != '••••••••':
            password = temp_pass
        else:
            password = cfg.get('smtp_pass', '').strip()

        from_email = temp_from if temp_from else cfg.get('from_email', 'info@cafhs.org').strip()
        from_name = temp_name if temp_name else cfg.get('from_name', 'Canadian Association of Family Health Support').strip()

        if not host:
            self.send_json({'success': False, 'error': 'SMTP Host address is required before sending test.'}, status=400)
            return

        formatted_date = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p EST")
        subject = f"🧪 CAFHS Outbound Email Test Verification • {formatted_date}"
        body_text = f"""======================================================================
CANADIAN ASSOCIATION OF FAMILY HEALTH SUPPORT (CAFHS)
ASSOCIATION CANADIENNE DE SOUTIEN À LA SANTÉ FAMILIALE (ACSSF)
OUTBOUND SMTP EMAIL TRANSMISSION VERIFICATION
======================================================================

Date / Time:       {formatted_date}
Target Recipient:  {to_email}
Origin SMTP Host:  {host}:{port}
Encryption Mode:   {security.upper()}
Authentication:    {user or '(Anonymous / No Auth)'}
Sender Identity:   {from_name} <{from_email}>

STATUS: SUCCESSFUL LIVE OUTBOUND TRANSMISSION CONFIRMED!

Congratulations! Your outgoing email delivery system has been verified.
All subsequent donor contribution receipts, Ontario training partner grant 
notices, client intake confirmations, and emergency management alerts will 
be dispatched in real time through this gateway.

Thank you for ensuring Canadian families receive prompt, reliable communication.

In Health & Community,
The Executive Management Team
Canadian Association of Family Health Support (CAFHS)
Website: http://localhost:8085
Inquiries: info@cafhs.org
======================================================================
"""

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_email
        msg['Reply-To'] = from_email
        msg['Date'] = email.utils.formatdate(localtime=True)
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))

        try:
            print(f"[CAFHS SMTP TEST] Connecting to {host}:{port} (Security: {security})...")
            sys.stdout.flush()

            if security == 'ssl' or port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=12)
            else:
                server = smtplib.SMTP(host, port, timeout=12)
                if security == 'starttls' or port == 587:
                    server.starttls()

            if user and password:
                print(f"[CAFHS SMTP TEST] Authenticating with user: {user}...")
                sys.stdout.flush()
                server.login(user, password)

            print(f"[CAFHS SMTP TEST] Sending verification message to {to_email}...")
            sys.stdout.flush()
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()

            # Record in SQLite audit table
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO site_management_emails 
                (recipient, sender, subject, body, user_email, user_name, chat_log_id, status)
                VALUES (?, ?, ?, ?, ?, ?, NULL, 'test_sent_smtp')
            ''', (to_email, from_email, subject, body_text, to_email, 'SMTP Verification Test'))
            conn.commit()
            conn.close()

            print(f"[CAFHS SMTP TEST] Success! Delivered test email to {to_email}.")
            sys.stdout.flush()

            self.send_json({
                'success': True,
                'message': f"Test email successfully dispatched to {to_email} via {host}:{port}!",
                'details': {
                    'recipient': to_email,
                    'host': host,
                    'port': port,
                    'security': security,
                    'user': user,
                    'timestamp': formatted_date
                }
            })
        except Exception as err:
            err_type = err.__class__.__name__
            err_desc = str(err)
            print(f"[CAFHS SMTP TEST ERROR] {err_type}: {err_desc}")
            sys.stdout.flush()
            self.send_json({
                'success': False,
                'error': f"{err_type}: {err_desc}",
                'error_type': err_type,
                'host': host,
                'port': port
            })

    def handle_post_send_email(self, body):
        to_email = (body.get('to') or body.get('to_email') or '').strip()
        subject = body.get('subject', '').strip()
        body_text = (body.get('body') or body.get('body_html') or body.get('content') or '').strip()
        user_name = (body.get('toName') or body.get('user_name') or 'Community Member').strip()
        user_email = (body.get('user_email') or to_email).strip()
        sender = (body.get('from') or body.get('sender') or 'support@cafhs.ca').strip()

        if not to_email or not subject:
            self.send_json({'error': 'Recipient email and subject are required'}, status=400)
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        res = dispatch_and_log_email(cursor, to_email, sender, subject, body_text, user_email, user_name)
        conn.commit()
        conn.close()

        self.send_json({'success': True, 'dispatch': res})

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    init_db()
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), CAFHSRequestHandler) as httpd:
        print(f"CAFHS Platform & Database API Server running at http://localhost:{PORT}")
        sys.stdout.flush()
        httpd.serve_forever()
