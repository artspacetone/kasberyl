// src/utils/backupRestore.ts
export interface AppDatabaseBackup {
  version: string;
  timestamp: string;
  warga: any[];
  kas: any[];
  danaAcara: any[];
  majelis: any[];
  pengeluaran: any[];
  pinjaman: any[];
}

export const generateJSONBackup = (): AppDatabaseBackup => {
  return {
    version: '2.5',
    timestamp: new Date().toISOString(),
    warga: JSON.parse(localStorage.getItem('local_warga') || '[]'),
    kas: JSON.parse(localStorage.getItem('local_kas') || '[]'),
    danaAcara: JSON.parse(localStorage.getItem('local_dana_acara') || '[]'),
    majelis: JSON.parse(localStorage.getItem('local_majelis') || '[]'),
    pengeluaran: JSON.parse(localStorage.getItem('local_pengeluaran') || '[]'),
    pinjaman: JSON.parse(localStorage.getItem('local_pinjaman') || '[]'),
  };
};

export const downloadJSONBackupFile = () => {
  const backup = generateJSONBackup();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `BACKUP_WARGA_BERYL_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const restoreFromJSONFile = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup: AppDatabaseBackup = JSON.parse(content);

        if (!backup.warga || !backup.kas) {
          throw new Error('Format file backup JSON tidak valid.');
        }

        localStorage.setItem('local_warga', JSON.stringify(backup.warga || []));
        localStorage.setItem('local_kas', JSON.stringify(backup.kas || []));
        localStorage.setItem('local_dana_acara', JSON.stringify(backup.danaAcara || []));
        localStorage.setItem('local_majelis', JSON.stringify(backup.majelis || []));
        localStorage.setItem('local_pengeluaran', JSON.stringify(backup.pengeluaran || []));
        localStorage.setItem('local_pinjaman', JSON.stringify(backup.pinjaman || []));

        window.dispatchEvent(new Event('app_data_updated'));
        resolve(true);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file JSON.'));
    reader.readAsText(file);
  });
};