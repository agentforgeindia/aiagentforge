# Generates AgentForge Roles & Permissions PDF
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from datetime import date

OUT = r"G:\Apps\agentforge-new\AgentForge-Roles-Permissions.pdf"

INDIGO = colors.HexColor("#4f46e5")
SLATE  = colors.HexColor("#1e293b")
SLATEL = colors.HexColor("#64748b")
GREENB = colors.HexColor("#dcfce7")
AMBERB = colors.HexColor("#fef3c7")
ROSEB  = colors.HexColor("#fee2e2")
HEADBG = colors.HexColor("#0f172a")
ZEBRA  = colors.HexColor("#f1f5f9")

styles = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=styles["Title"], textColor=SLATE, fontSize=22, spaceAfter=2)
sub = ParagraphStyle("sub", parent=styles["Normal"], textColor=SLATEL, fontSize=10, alignment=TA_CENTER, spaceAfter=2)
h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=INDIGO, fontSize=13, spaceBefore=14, spaceAfter=6)
body = ParagraphStyle("body", parent=styles["Normal"], textColor=SLATE, fontSize=9.5, leading=14)
cell = ParagraphStyle("cell", parent=styles["Normal"], fontSize=8.5, leading=11, textColor=SLATE)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold")

doc = SimpleDocTemplate(OUT, pagesize=A4, topMargin=16*mm, bottomMargin=14*mm,
                        leftMargin=14*mm, rightMargin=14*mm)
story = []

# ── Header ──
story.append(Paragraph("AgentForge — Roles &amp; Permissions", h1))
story.append(Paragraph(f"Admin Console Access Guide · Generated {date.today().strftime('%d %B %Y')}", sub))
story.append(Spacer(1, 6))
story.append(HRFlowable(width="100%", thickness=1.2, color=INDIGO))
story.append(Spacer(1, 10))

# ── Roles overview ──
story.append(Paragraph("The 4 Roles", h2))
roles = [
    ["Role", "Who it's for"],
    ["Founder", "Owner — full unrestricted access to everything."],
    ["Admin", "Platform manager — runs almost everything; team / settings / HR are view-only."],
    ["Accounts", "Billing person — invoices, payments, refunds, credits."],
    ["Sales", "Sales rep — leads, customers, incentives. No money/billing access."],
]
t = Table(roles, colWidths=[35*mm, 145*mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), HEADBG),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("FONTNAME", (0,1), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0,1), (0,-1), INDIGO),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, ZEBRA]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#e2e8f0")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
]))
story.append(t)

# ── Access Matrix ──
story.append(Paragraph("Module Access Matrix", h2))
story.append(Paragraph("Full = full access · View = read only · — = no access", body))
story.append(Spacer(1, 6))

FULL, VIEW, NO = "Full", "View", "—"
rows = [
    ["Module", "Founder", "Admin", "Accounts", "Sales"],
    ["War Room (Dashboard)", FULL, FULL, FULL, NO],
    ["Customers", FULL, FULL, VIEW, "View+Notes"],
    ["Leads", FULL, FULL, NO, FULL],
    ["Sales Command", FULL, FULL, NO, FULL],
    ["Deals", FULL, FULL, NO, VIEW],
    ["Tasks", FULL, FULL, NO, FULL],
    ["Email", FULL, FULL, NO, NO],
    ["Marketing", FULL, FULL, NO, NO],
    ["Invoices", FULL, FULL, FULL, NO],
    ["Subscriptions", FULL, FULL, VIEW, NO],
    ["Credits", FULL, FULL, "Grant", NO],
    ["Finance", FULL, VIEW, NO, NO],
    ["Agents", FULL, FULL, NO, NO],
    ["AI Operations", FULL, FULL, NO, NO],
    ["AI Costs", FULL, FULL, VIEW, NO],
    ["AI Assistant", FULL, FULL, NO, NO],
    ["Support", FULL, FULL, NO, NO],
    ["WhatsApp Inbox", FULL, FULL, NO, NO],
    ["Incentives", FULL, VIEW, NO, VIEW],
    ["Leaderboard", FULL, FULL, NO, NO],
    ["Team", "Manage", VIEW, NO, NO],
    ["Attendance", FULL, VIEW, NO, NO],
    ["Knowledge Base", FULL, FULL, NO, VIEW],
    ["HR", FULL, VIEW, NO, NO],
    ["Automation", FULL, VIEW, NO, NO],
    ["Integrations", FULL, VIEW, NO, NO],
    ["Settings", FULL, VIEW, NO, NO],
    ["Audit Log", FULL, FULL, NO, NO],
]
# wrap module names in paragraphs for cleanliness
data = [[Paragraph(rows[0][0], cellb)] + [Paragraph(c, cellb) for c in rows[0][1:]]]
for r in rows[1:]:
    data.append([Paragraph(r[0], cell)] + [Paragraph(c, cell) for c in r[1:]])

mt = Table(data, colWidths=[58*mm, 30*mm, 30*mm, 30*mm, 32*mm], repeatRows=1)

style = [
    ("BACKGROUND", (0,0), (-1,0), HEADBG),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("ALIGN", (1,0), (-1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#e2e8f0")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, ZEBRA]),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
]
# colour-code cells
for ri, r in enumerate(rows[1:], start=1):
    for ci, val in enumerate(r[1:], start=1):
        if val in (FULL, "Manage", "Grant"):
            style.append(("BACKGROUND", (ci,ri), (ci,ri), GREENB))
        elif val in (VIEW, "View+Notes"):
            style.append(("BACKGROUND", (ci,ri), (ci,ri), AMBERB))
        elif val == NO:
            style.append(("BACKGROUND", (ci,ri), (ci,ri), ROSEB))
mt.setStyle(TableStyle(style))
story.append(mt)

# ── Founder-only note ──
story.append(Paragraph("Founder-Only Actions", h2))
fo = ("Only the Founder can: manage Team (add/remove members, change roles), "
      "edit Settings, edit Finance, edit HR, and change Incentive rules. "
      "Admins can see these but not modify.")
story.append(Paragraph(fo, body))

story.append(Spacer(1, 8))
story.append(Paragraph("Note on Support / Caller Role", h2))
note = ("A dedicated <b>Support</b> or <b>Caller</b> role does not exist yet. "
        "When you hire an outsourced calling/support team, create a restricted "
        "role that only sees Sales Command + Leads — keeping revenue, finance "
        "and customer payment data hidden.")
story.append(Paragraph(note, body))

story.append(Spacer(1, 14))
story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#cbd5e1")))
story.append(Spacer(1, 4))
foot = ParagraphStyle("foot", parent=body, fontSize=8, textColor=SLATEL, alignment=TA_CENTER)
story.append(Paragraph("AgentForge Admin Console · Roles managed at /admin/team · Confidential — internal use only", foot))

doc.build(story)
print("PDF written:", OUT)
