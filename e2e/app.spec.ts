import { expect, test } from '@playwright/test';
import JSZip from 'jszip';

function createPdfSample(): Buffer {
  const firstPage = 'BT /F1 22 Tf 72 700 Td (Reader works) Tj ET';
  const secondPage = 'BT /F1 22 Tf 72 700 Td (Second PDF page) Tj ET';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${firstPage.length} >>\nstream\n${firstPage}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>\nendobj\n',
    `7 0 obj\n<< /Length ${secondPage.length} >>\nstream\n${secondPage}\nendstream\nendobj\n`,
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(document, 'ascii'));
    document += object;
  }
  const xrefOffset = Buffer.byteLength(document, 'ascii');
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`)
    .join('');
  document += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(document, 'ascii');
}

async function createEpubSample(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
  );
  zip.file(
    'OEBPS/content.opf',
    '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">test-reader</dc:identifier><dc:title>Test EPUB</dc:title><dc:creator>Test Author</dc:creator><dc:description>A sample EPUB for the reader.</dc:description><dc:language>fr</dc:language><meta name="cover" content="cover-image"/></metadata><manifest><item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/><item id="chapter-two" href="chapter-two.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/><itemref idref="chapter-two"/></spine></package>',
  );
  zip.file(
    'OEBPS/cover.png',
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rZsAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  zip.file(
    'OEBPS/chapter.xhtml',
    '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Premier chapitre</title></head><body><h1>Première page</h1><p>Le livre est prêt à être lu.</p></body></html>',
  );
  zip.file(
    'OEBPS/chapter-two.xhtml',
    '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Deuxième chapitre</title></head><body><h1>Deuxième page</h1><p>La progression est conservée.</p></body></html>',
  );
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
}

test('opens the welcome page and links to the library', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.welcome_copy h1')).toContainText('Beaucoup d’histoires');
  await page.getByRole('button', { name: 'Ouvrir ma bibliothèque' }).click();
  await expect(page.locator('.home_intro h1')).toContainText('Bonjour, Lord');
  await expect(page.locator('.home_page .empty_book_container')).toContainText('Votre bibliothèque commence ici');
  await expect(page.getByRole('button', { name: 'Importer mon premier livre' })).toBeVisible();
});

test('explains local storage in the privacy policy', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('.privacy_page h1')).toContainText('Confidentialité');
  await expect(page.locator('.privacy_card')).toContainText('IndexedDB');
  await expect(page.locator('.privacy_card')).toContainText('ne transmet ni ces couvertures');
});

test('favorite changes are reflected in the favorites page', async ({ page }) => {
  await page.goto('/tabs/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'favorite-sample.pdf',
    mimeType: 'application/pdf',
    buffer: createPdfSample(),
  });
  await page.getByLabel('Titre').fill('Livre favori');
  await page.getByRole('button', { name: 'Ajouter à ma bibliothèque' }).click();
  await expect(page.locator('.reader_page')).toBeVisible();

  await page.goto('/tabs/library');
  const firstBook = page.locator('.book_grid .book_card').first();
  await expect(firstBook).toBeVisible();
  const title = await firstBook.locator('h3').innerText();
  await firstBook.locator('ion-button').click();

  await page.goto('/tabs/favorites');
  await expect(page.locator('.favorites_grid')).toContainText(title);
});

test('library search and category filters narrow the catalogue', async ({ page }) => {
  await page.goto('/tabs/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'dune.pdf',
    mimeType: 'application/pdf',
    buffer: createPdfSample(),
  });
  await page.getByLabel('Titre').fill('Dune');
  await page.getByRole('button', { name: 'Ajouter à ma bibliothèque' }).click();
  await expect(page.locator('.reader_page')).toBeVisible();

  await page.goto('/tabs/library');
  await page.getByRole('searchbox').fill('Dune');
  await expect(page.locator('.book_grid .book_card')).toHaveCount(1);
  await page.locator('.cat_segment_section ion-button').nth(1).click();
  await expect(page.locator('.book_grid .book_card')).toHaveCount(0);
  await expect(page.locator('.empty_state')).toContainText('Aucun résultat');
});

test('settings can switch the appearance theme', async ({ page }) => {
  await page.goto('/tabs/settings');
  await expect(page.locator('.settings_page h1')).toContainText('Réglages');
  const darkModeToggle = page.getByRole('switch', { name: 'Activer le mode sombre' });
  const wasDark = await darkModeToggle.isChecked();
  await darkModeToggle.click();
  await expect(darkModeToggle).toHaveAttribute('aria-checked', String(!wasDark));
});

test('imports, reads, and shows details for a PDF book', async ({ page }) => {
  await page.goto('/tabs/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'reader-sample.pdf',
    mimeType: 'application/pdf',
    buffer: createPdfSample(),
  });
  await page.getByLabel('Titre').fill('PDF de test');
  await page.getByRole('button', { name: 'Ajouter à ma bibliothèque' }).click();

  await expect(page.locator('.reader_page')).toBeVisible();
  await expect(page.locator('.pdf_page_frame canvas')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.reader_page_count')).toContainText('Page 1 sur 2', { timeout: 15000 });
  await expect(page.locator('.reader_file_info')).toContainText('reader-sample.pdf');
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page.locator('.reader_page_count')).toContainText('Page 2 sur 2', { timeout: 15000 });
  await page.getByRole('searchbox', { name: 'Rechercher dans le livre' }).fill('Reader works');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.locator('.reader_search_status')).toContainText('1 / 1');
  await expect(page.locator('.reader_page_count')).toContainText('Page 1 sur 2', { timeout: 15000 });
  await page.getByRole('searchbox', { name: 'Rechercher dans le livre' }).fill('Second PDF page');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.locator('.reader_page_count')).toContainText('Page 2 sur 2', { timeout: 15000 });
  const readerUrl = page.url();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.pdf_page_frame canvas')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.reader_page_count')).toContainText('Page 2 sur 2', { timeout: 15000 });

  const bookId = new URL(readerUrl).pathname.split('/').pop();
  await page.goto(`/tabs/book/${bookId}`);
  await expect(page.locator('.work_synopsis')).toContainText('Synopsis');
  await expect(page.locator('.book_details_copy h1')).toContainText('PDF de test');
  await expect(page.locator('.work_file_details')).toContainText('reader-sample.pdf');
  await expect(page.locator('.work_file_details dd').nth(2)).toContainText(/\d+(\.\d+)? (o|Ko|Mo)/);

  await page.getByRole('button', { name: 'Modifier les informations' }).click();
  await page.getByLabel('Titre').fill('PDF renommé');
  await page.getByLabel('Auteur').fill('Auteur modifié');
  await page.getByLabel('Synopsis').fill('Un synopsis écrit après import.');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('.book_details_copy h1')).toContainText('PDF renommé');
  await expect(page.locator('.book_details_author')).toContainText('Auteur modifié');
  await expect(page.locator('.work_synopsis')).toContainText('Un synopsis écrit après import.');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.book_details_copy h1')).toContainText('PDF renommé');

  await page.goto('/tabs/home');
  await expect(page.locator('.home_stats .home_stat').nth(3).locator('strong')).toHaveText('1');
  await expect(page.locator('.home_stats .home_stat').nth(4).locator('strong')).toHaveText(/^[1-9]\d*$/);
});

test('storage diagnostics list the locally imported files', async ({ page }) => {
  await page.goto('/tabs/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'storage-sample.pdf',
    mimeType: 'application/pdf',
    buffer: createPdfSample(),
  });
  await page.getByLabel('Titre').fill('Livre de stockage');
  await page.getByRole('button', { name: 'Ajouter à ma bibliothèque' }).click();
  await expect(page.locator('.reader_page')).toBeVisible();

  await page.goto('/tabs/storage');
  await expect(page.locator('.storage_summary')).toContainText('Stockage navigateur');
  await expect(page.locator('.storage_files')).toContainText('Livre de stockage');
  await expect(page.locator('.storage_files')).toContainText('storage-sample.pdf');
  await page.getByRole('button', { name: 'Supprimer Livre de stockage et libérer son stockage' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('sessions de lecture');
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.locator('.storage_empty')).toContainText('Aucun fichier importé');
});

test('confirms removing an imported book and its local storage', async ({ page }) => {
  await page.goto('/tabs/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'reader-sample.pdf',
    mimeType: 'application/pdf',
    buffer: createPdfSample(),
  });
  await page.getByLabel('Titre').fill('PDF à supprimer');
  await page.getByRole('button', { name: 'Ajouter à ma bibliothèque' }).click();
  await expect(page.locator('.reader_page')).toBeVisible();
  const bookId = new URL(page.url()).pathname.split('/').pop();

  await page.goto(`/tabs/book/${bookId}`);
  await page.getByRole('button', { name: 'Supprimer et libérer le stockage' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('sa progression');
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/library$/);
  await expect(page.locator('.library_page .empty_book_container')).toBeVisible();
});

test('imports, opens, and resumes an EPUB book', async ({ page }) => {
  await page.goto('/tabs/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'reader-sample.epub',
    mimeType: 'application/epub+zip',
    buffer: await createEpubSample(),
  });
  await page.getByRole('button', { name: 'Ajouter à ma bibliothèque' }).click();

  await expect(page.locator('.reader_page')).toBeVisible();
  await expect(page.locator('.epub_viewer iframe')).toBeVisible();
  await expect(page.frameLocator('.epub_viewer iframe').locator('body')).toContainText('Première page');
  await expect(page.locator('.reader_file_info')).toContainText('reader-sample.epub');

  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page.frameLocator('.epub_viewer iframe').locator('body')).toContainText('Deuxième page');
  await page.getByRole('searchbox', { name: 'Rechercher dans le livre' }).fill('progression');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.locator('.reader_search_status')).toContainText('1 / 1');
  await page.getByRole('button', { name: 'Affichage' }).click();
  await page.getByLabel('Thème de page').selectOption('sepia');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.frameLocator('.epub_viewer iframe').locator('body')).toContainText('Deuxième page');
  await page.getByRole('button', { name: 'Affichage' }).click();
  await expect(page.getByLabel('Thème de page')).toHaveValue('sepia');
  const bookId = new URL(page.url()).pathname.split('/').pop();
  await page.goto(`/tabs/book/${bookId}`);
  await expect(page.locator('.book_details_cover img')).toHaveAttribute('src', /^data:image\//);
});
