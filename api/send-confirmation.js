import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// Initialize Firebase Admin (different from client SDK)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // Use service instead of host for Gmail
    auth: {
      user: process.env.EMAIL_USER || '752470@pdsb.net',
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendConfirmationEmail = async (studentNumber, position, fullName) => {
  const recipientEmail = `${studentNumber}@pdsb.net`;
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER || '752470@pdsb.net',
    to: recipientEmail,
    subject: 'SAC Application Confirmation - Submission Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Application Confirmation</h1>
          
          <p>Dear ${fullName || 'Student'},</p>
          
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
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API called with body:', req.body);
    
    const { userId, position } = req.body;

    if (!userId || !position) {
      console.log('Missing required fields:', { userId: !!userId, position: !!position });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('Firebase Admin not initialized');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    console.log('Getting user document for userId:', userId);
    
    // Get user data from Firebase
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log('User data:', userData);
    
    const { studentNumber, fullName } = userData;

    if (!studentNumber) {
      console.log('Student number not found in user data');
      return res.status(400).json({ error: 'Student number not found' });
    }

    console.log('Sending email to:', `${studentNumber}@pdsb.net`);

    // Send confirmation email
    await sendConfirmationEmail(studentNumber, position, fullName || 'Student');

    console.log('Email sent successfully');
    res.status(200).json({ success: true, message: 'Confirmation email sent' });
  } catch (error) {
    console.error('Error in send-confirmation API:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to send confirmation email',
      details: error.message 
    });
  }
}