import { removeBackground } from '@imgly/background-removal-node';
import busboy from 'busboy';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const bb = busboy({ headers: req.headers });
  const fields = {};
  let fileBuffer = null;
  let filename = 'image.png';

  bb.on('field', (name, val) => { fields[name] = val; });
  bb.on('file', (name, file, info) => {
    const chunks = [];
    filename = info.filename;
    file.on('data', chunk => chunks.push(chunk));
    file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', reject);
    req.pipe(bb);
  });

  if (!fileBuffer) return res.status(400).json({ error: 'No file uploaded' });

  const bgType = fields.bgType || 'transparent';
  const bgColor = fields.bgColor || '#ffffff';

  const config = {
    model: 'small',
    output: {
      format: 'image/png',
      ...(bgType === 'color' && { background: bgColor }),
    },
  };

  try {
    const resultBlob = await removeBackground(fileBuffer, config);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(resultBlob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Background removal failed' });
  }
}