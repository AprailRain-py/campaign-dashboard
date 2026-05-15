const { google } = require('googleapis');

const getOAuthClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
};

const siteUrl = process.env.GSC_SITE_URL || 'sc-domain:definable.ai';

const getDateRange = (daysBack) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'missing_credentials', message: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in Netlify env vars.' }) };
  }

  const reportType = event.queryStringParameters?.type || 'overview';
  const auth = getOAuthClient();
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const { startDate, endDate } = getDateRange(28);

  try {
    let data;
    const queryBase = { siteUrl };

    if (reportType === 'overview') {
      const res = await searchConsole.searchanalytics.query({ ...queryBase, requestBody: { startDate, endDate, dimensions: ['date'], rowLimit: 30 } });
      data = res.data;
    } else if (reportType === 'pages') {
      const res = await searchConsole.searchanalytics.query({ ...queryBase, requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 10, orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }] } });
      data = res.data;
    } else if (reportType === 'queries') {
      const res = await searchConsole.searchanalytics.query({ ...queryBase, requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 10, orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }] } });
      data = res.data;
    } else if (reportType === 'devices') {
      const res = await searchConsole.searchanalytics.query({ ...queryBase, requestBody: { startDate, endDate, dimensions: ['device'], rowLimit: 10 } });
      data = res.data;
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown type: ${reportType}` }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('GSC error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
