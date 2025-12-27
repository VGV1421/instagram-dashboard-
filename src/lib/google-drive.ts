import { google } from 'googleapis';

/**
 * Helper para trabajar con Google Drive
 * Maneja autenticación, listado, descarga y movimiento de archivos
 */

// Inicializar cliente de Google Drive
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Listar archivos de una carpeta de Google Drive
 */
export async function listDriveFiles(folderId: string) {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/jpg')`,
    fields: 'files(id, name, mimeType, size, webContentLink, webViewLink)',
    orderBy: 'name',
  });

  return response.data.files || [];
}

/**
 * Descargar archivo de Google Drive como Buffer
 */
export async function downloadDriveFile(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Mover archivo de una carpeta a otra en Google Drive
 */
export async function moveDriveFile(fileId: string, fromFolderId: string, toFolderId: string) {
  const drive = getDriveClient();

  // Remover de la carpeta actual y agregar a la nueva
  await drive.files.update({
    fileId,
    addParents: toFolderId,
    removeParents: fromFolderId,
    fields: 'id, parents',
  });

  return true;
}

/**
 * Obtener información de un archivo
 */
export async function getDriveFileInfo(fileId: string) {
  const drive = getDriveClient();

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webContentLink, webViewLink, parents',
  });

  return response.data;
}

/**
 * Seleccionar foto aleatoria de la carpeta "SIN USAR"
 */
export async function getRandomUnusedAvatar() {
  const folderUnused = process.env.GOOGLE_DRIVE_FOLDER_UNUSED;

  if (!folderUnused) {
    throw new Error('GOOGLE_DRIVE_FOLDER_UNUSED no configurado en .env');
  }

  const files = await listDriveFiles(folderUnused);

  if (files.length === 0) {
    return {
      success: false,
      error: 'No hay fotos disponibles en Google Drive (FOTOS AVATAR SIN USAR)',
    };
  }

  // Seleccionar foto aleatoria
  const randomIndex = Math.floor(Math.random() * files.length);
  const selectedFile = files[randomIndex];

  return {
    success: true,
    file: selectedFile,
    fileId: selectedFile.id!,
    filename: selectedFile.name!,
    totalAvailable: files.length,
  };
}

/**
 * Mover foto de "SIN USAR" a "USADAS"
 */
export async function markAvatarAsUsed(fileId: string) {
  const folderUnused = process.env.GOOGLE_DRIVE_FOLDER_UNUSED;
  const folderUsed = process.env.GOOGLE_DRIVE_FOLDER_USED;

  if (!folderUnused || !folderUsed) {
    throw new Error('Carpetas de Google Drive no configuradas en .env');
  }

  await moveDriveFile(fileId, folderUnused, folderUsed);

  return true;
}
