import { doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import nodemailer from 'nodemailer';

// Initialize Firebase (you may need to adjust this based on your config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: '752470@pdsb.net',
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendConfirmationEmail = async (studentNumber, position, fullName) => {
  const recipientEmail = `${studentNumber}@pdsb.net`;
  const transporter = createTransporter();
  
  const mailOptions = {
    from: '752470@pdsb.net',
    to: recipientEmail,
    subject: 'SAC Application Confirmation - Submission Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Application Confirmation</h1>
          
          <p>Dear ${fullName},</p>
          
          <p>Thank you for submitting your application to the Student Activity Council!</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Application Details:</h3>
            <ul style="color: #4b5563;">
              <li><strong>Position Applied For:</strong> ${position}</li>
              <li><strong>Student Number:</strong> ${studentNumber}</li>
              <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p>Your application has been successfully received and will be reviewed by the SAC selection committee. You will be notified about the status of your application soon.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Student Activity Council</strong><br>
            Email: 752470@pdsb.net
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, position } = req.body;

    if (!userId || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user data from Firebase
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const { studentNumber, fullName } = userData;

    if (!studentNumber) {
      return res.status(400).json({ error: 'Student number not found' });
    }

    // Send confirmation email
    await sendConfirmationEmail(studentNumber, position, fullName || 'Student');

    res.status(200).json({ success: true, message: 'Confirmation email sent' });
  } catch (error) {
    console.error('Error in send-confirmation API:', error);
    res.status(500).json({ error: 'Failed to send confirmation email' });
  }
}