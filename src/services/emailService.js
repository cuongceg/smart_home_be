const SibApiV3Sdk = require('sib-api-v3-sdk');

class EmailService {
    constructor() {
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    }

    // Send email for password reset
   async sendPasswordResetEmail(email, resetToken, username) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.to = [{ email: email }];
            sendSmtpEmail.sender = {
                email: process.env.EMAIL_SENDER || "", 
                name: "Smart Home System"
            };
            sendSmtpEmail.subject = 'Reset password - Smart Home System';
            sendSmtpEmail.htmlContent = this.generatePasswordResetHTML(username, resetUrl, resetToken);
            const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            
            console.log('Email sent successfully. Message ID:', data.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error.response ? error.response.text : error);
            throw new Error('Failed to send reset email');
        }
    }

    // Template HTML for email reset password
    generatePasswordResetHTML(username, resetUrl, token) {
        return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }
        .subtitle {
            color: rgba(255,255,255,0.9);
            margin-bottom: 0;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .reset-button:hover {
            transform: translateY(-2px);
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .footer {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">IoT Monitor</div>
        <div class="subtitle">Hệ thống giám sát IoT</div>
        
        <div class="content">
            <h1>Đặt lại mật khẩu</h1>
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Để tiến hành đặt lại mật khẩu, vui lòng nhấn vào nút bên dưới:</p>
            
            <a href="${resetUrl}" class="reset-button">Đặt lại mật khẩu</a>
            
            <div class="security-info">
                <strong>Thông tin bảo mật:</strong><br>
                • Link này sẽ hết hạn sau 5 phút<br>
                • Chỉ sử dụng link này một lần duy nhất<br>
                • Không chia sẻ link với bất kỳ ai khác
            </div>
            
            <div class="warning">
                <strong>Lưu ý quan trọng:</strong><br>
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ với chúng tôi ngay lập tức. Tài khoản của bạn vẫn được bảo mật.
            </div>
            
            <p>Trân trọng,<br><strong>Đội ngũ IoT Monitor</strong></p>
        </div>
        
        <div class="footer">
            Email này được gửi tự động từ hệ thống IoT Monitor<br>
            Vui lòng không trả lời email này
        </div>
    </div>
</body>
</html>
        `;
    }
}

module.exports = new EmailService();
