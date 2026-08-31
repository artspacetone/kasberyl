export const getXLSX = async (): Promise<any> => {
  if ((window as any).XLSX) {
    return (window as any).XLSX;
  }
  try {
    const module = await import('xlsx');
    if (module && (module.default || module.read)) {
      return module.default || module;
    }
  } catch (e) {
    console.warn('Fallback ke CDN XLSX...');
  }
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('xlsx-cdn-script');
    if (existingScript) {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
      } else {
        existingScript.addEventListener('load', () => resolve((window as any).XLSX));
        existingScript.addEventListener('error', () => reject(new Error('Gagal memuat pustaka XLSX dari CDN.')));
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'xlsx-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error('Gagal mengunduh pustaka XLSX CDN.'));
    document.body.appendChild(script);
  });
};