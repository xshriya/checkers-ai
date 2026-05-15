import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pyotp
from datetime import datetime, timedelta

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@checkers.ai")

# Store OTP codes temporarily (in production, use Redis)
otp_codes = {}

def generate_otp_code():
    """Generate a 6-digit OTP code"""
    return ''.join(secrets.choice('0123456789') for _ in range(6))

def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification"):
    """Send OTP code to user's email"""
    try:
        # Create message
        message = MIMEMultipart()
        message["From"] = FROM_EMAIL
        message["To"] = to_email
        
        if purpose == "verification":
            message["Subject"] = "Checkers AI - Verify Your Email"
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1;">Checkers AI - Email Verification</h2>
                    <p>Thank you for signing up! Your verification code is:</p>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1;">
                            {otp_code}
                        </span>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #6b7280; font-size: 14px;">
                        If you didn't create an account, please ignore this email.
                    </p>
                </div>
            </body>
            </html>
            """
        elif purpose == "reset":
            message["Subject"] = "Checkers AI - Reset Your Password"
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1;">Checkers AI - Password Reset</h2>
                    <p>You requested to reset your password. Your verification code is:</p>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1;">
                            {otp_code}
                        </span>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #6b7280; font-size: 14px;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            </body>
            </html>
            """
        
        message.attach(MIMEText(body, "html"))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, message.as_string())
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def store_otp(email: str, otp_code: str, purpose: str = "verification"):
    """Store OTP code with expiration"""
    otp_codes[f"{purpose}_{email}"] = {
        "code": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "attempts": 0
    }

def verify_otp(email: str, otp_code: str, purpose: str = "verification") -> bool:
    """Verify OTP code"""
    key = f"{purpose}_{email}"
    
    if key not in otp_codes:
        return False
    
    stored = otp_codes[key]
    
    # Check expiration
    if datetime.utcnow() > stored["expires_at"]:
        del otp_codes[key]
        return False
    
    # Check attempts (max 3)
    if stored["attempts"] >= 3:
        del otp_codes[key]
        return False
    
    # Verify code
    if stored["code"] != otp_code.upper():
        stored["attempts"] += 1
        return False
    
    # OTP verified - remove it
    del otp_codes[key]
    return True
