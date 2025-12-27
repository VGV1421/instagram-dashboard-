const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function enableDriveAPI() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const serviceusage = google.serviceusage({ version: 'v1', auth });
    
    console.log('Attempting to enable Google Drive API...');
    const projectId = 'instagram-dashboard-automation';
    
    const response = await serviceusage.services.enable({
      name: `projects/${projectId}/services/drive.googleapis.com`,
    });

    console.log('Success! Drive API enabled:', response.data);
  } catch (error) {
    console.error('Error enabling Drive API:', error.message);
    console.error('This requires Service Account to have Service Usage Admin role');
    console.error('\nManual steps required:');
    console.error('1. Open: https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=1058284720540');
    console.error('2. Click "ENABLE" button');
    console.error('3. Wait 1-2 minutes for changes to propagate');
  }
}

enableDriveAPI();
