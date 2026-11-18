import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

const loadingTasks = new WeakMap<PDFDocumentProxy, PDFDocumentLoadingTask>();

export async function openPdfDocument(file: Blob): Promise<PDFDocumentProxy> {
  const data = new Uint8Array(await file.arrayBuffer());
  const task = getDocument({ data });
  try {
    const document = await task.promise;
    loadingTasks.set(document, task);
    return document;
  } catch (error) {
    await task.destroy();
    throw error;
  }
}

export async function closePdfDocument(document: PDFDocumentProxy): Promise<void> {
  const task = loadingTasks.get(document);
  if (!task) return;
  loadingTasks.delete(document);
  await task.destroy();
}
