const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, name = '') => {
  console.log(`\n🔑 DEV OTP for ${email}: ${otp}\n`);

  await transporter.sendMail({
    from: `"CampusSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your CampusSync Verification Code',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:auto;background:#13151a;color:#f0f0f0;border-radius:16px;padding:40px;border:1px solid #2a2d36">
        <div style="text-align:center;margin-bottom:28px">
          <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#5b8dee,#e8c97a);display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#0b0c0e">CS</div>
          <h2 style="font-size:22px;margin:14px 0 4px;color:#f0f0f0">Verify your email</h2>
          <p style="color:#7a7f8e;font-size:14px">Hi ${name}, use the code below to complete your registration.</p>
        </div>
        <div style="text-align:center;background:#1c1f27;border:1px solid #2a2d36;border-radius:12px;padding:28px;margin:20px 0">
          <p style="color:#7a7f8e;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Your OTP</p>
          <div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#5b8dee">${otp}</div>
        </div>
        <p style="color:#7a7f8e;font-size:12px;text-align:center">This code expires in <strong style="color:#e8c97a">5 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
};

module.exports = sendOTPEmail;