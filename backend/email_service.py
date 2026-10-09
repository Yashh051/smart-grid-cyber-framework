"""
==============================================================================
MODULE: email_service.py (Live SMTP Real-World Email Dispatcher)
PURPOSE: Dispatches real-world HTML/Text security OTP emails to user inboxes
         via Brevo / Gmail SMTP with zero hardcoded credentials.
PROJECT: AI-Based Smart Grid Cybersecurity Framework
==============================================================================
"""

import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gateway_config.json")

def load_gateway_config() -> dict:
    """Loads local persistent configuration if available."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[GATEWAY CONFIG ERROR] Error reading {CONFIG_FILE}: {e}")
    return {}

def save_gateway_config(data: dict):
    """Saves runtime gateway configuration locally."""
    existing = load_gateway_config()
    existing.update(data)
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
    except Exception as e:
        print(f"[GATEWAY CONFIG ERROR] Error writing {CONFIG_FILE}: {e}")


def send_real_recovery_email(recipient_email: str, recipient_name: str, otp_code: str) -> dict:
    """
    Sends cryptographic OTP verification email directly to recipient's inbox.
    Pulls credentials safely from Environment Variables (Render/Cloud) first.
    """
    _cfg = load_gateway_config()
    
    # Priority: Environment Variables (Render) -> Local Config File (Fallback)
    smtp_server = os.environ.get("SMTP_SERVER") or _cfg.get("smtp_server") or "smtp-relay.brevo.com"
    smtp_port = int(os.environ.get("SMTP_PORT") or _cfg.get("smtp_port") or 587)
    smtp_username = (os.environ.get("SMTP_USERNAME") or _cfg.get("smtp_username") or "").strip()
    smtp_password = (os.environ.get("SMTP_PASSWORD") or _cfg.get("smtp_password") or "").strip()
    smtp_from_name = os.environ.get("SMTP_FROM_NAME") or _cfg.get("smtp_from_name") or "SmartGrid Cyber SOC Defense Center"
    smtp_from_email = os.environ.get("SMTP_FROM_EMAIL") or _cfg.get("smtp_from_email") or (smtp_username if "@" in smtp_username else "soc-alerts@smartgrid.org")
    
    subject = f"[SECURITY ALERT] Your SmartGrid SOC Account Recovery OTP: {otp_code}"
    
    # Clean Plaintext Fallback
    text_content = f"""
SmartGrid CyberDefense Portal - Security Operations Center (SOC)
=================================================================

Hello {recipient_name},

A password recovery request was initiated for your SmartGrid SCADA operator account.

Your 6-Digit One-Time Password (OTP) verification code is:
>>> {otp_code} <<<

This code is valid for 15 minutes.
If you did not request this recovery, please alert the SCADA Grid SOC administrator immediately.

Best regards,
SmartGrid Cyber Defense Security Operations Center (SOC)
IEEE-14 SCADA Intrusion Detection System
"""

    # Dark SCADA HTML Email Template
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SmartGrid SOC Password Recovery</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Banner Header -->
          <tr>
            <td style="background-color: #0284c7; padding: 24px 30px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
                ⚡ SmartGrid Cyber SOC Defense Center
              </h1>
              <p style="margin: 4px 0 0 0; color: #e0f2fe; font-size: 12px; font-family: monospace;">
                IEEE-14 SCADA Intrusion Detection & Grid Security Network
              </p>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 30px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0; color: #f8fafc; font-size: 16px;">
                Hello <strong>{recipient_name}</strong>,
              </p>
              
              <p style="color: #94a3b8;">
                An official account recovery request was initiated for your SCADA Operator profile. Use the one-time security verification code below to authorize your password reset:
              </p>

              <!-- OTP Code Display Box -->
              <div style="margin: 25px 0; padding: 20px; background-color: #020617; border: 1px solid #0369a1; border-radius: 8px; text-align: center;">
                <span style="display: block; font-size: 11px; color: #38bdf8; text-transform: uppercase; font-family: monospace; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Your 6-Digit One-Time Password
                </span>
                <span style="font-size: 36px; font-weight: bold; color: #38bdf8; letter-spacing: 8px; font-family: monospace;">
                  {otp_code}
                </span>
                <span style="display: block; font-size: 11px; color: #64748b; margin-top: 8px;">
                  ⏱️ Valid for 15 minutes • Single-use cryptographic token
                </span>
              </div>

              <!-- Security Protocol Notice -->
              <div style="background-color: #1e1b4b; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; color: #c7d2fe;">
                  <strong>🔒 Security Protocol:</strong> Never share this code with anyone. SmartGrid administrators will never ask for your recovery OTP.
                </p>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                If you did not make this request, please ignore this email or report unauthorized access to your SCADA System Administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #020617; padding: 16px 30px; border-top: 1px solid #1e293b; text-align: center; color: #475569; font-size: 11px; font-family: monospace;">
              SmartGrid CyberDefense Framework • Real-Time AI Attack Detection Platform
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    if not smtp_username or not smtp_password:
        print(f"[EMAIL SERVICE] SMTP sender credentials not configured for {recipient_email}.")
        return {
            "sent": False,
            "reason": "SMTP_NOT_CONFIGURED",
            "message": "SMTP credentials not configured in Render Environment Variables.",
            "recipient": recipient_email,
            "otp_code": otp_code
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
        msg["To"] = recipient_email
        
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=12) as server:
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_from_email, [recipient_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_from_email, [recipient_email], msg.as_string())

        print(f"[EMAIL SERVICE] Real email successfully delivered to {recipient_email} via {smtp_server}:{smtp_port}")
        return {
            "sent": True,
            "reason": "DELIVERED",
            "message": f"Official recovery email delivered to actual inbox: {recipient_email}",
            "recipient": recipient_email,
            "otp_code": otp_code
        }
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to {recipient_email}: {str(e)}")
        return {
            "sent": False,
            "reason": "SMTP_ERROR",
            "message": f"SMTP Error: {str(e)}",
            "recipient": recipient_email,
            "otp_code": otp_code
        }
