/*!
 * @license
 * Alfresco Example Content Application
 *
 * Copyright (C) 2005 - 2020 Alfresco Software Limited
 *
 * This file is part of the Alfresco Example Content Application.
 * If the software was purchased under a paid Alfresco license, the terms of
 * the paid license agreement will prevail.  Otherwise, the software is
 * provided under the following open source license terms:
 *
 * The Alfresco Example Content Application is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Alfresco Example Content Application is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

import { LoginPage, BrowsingPage, Viewer, RepoClient, Utils } from '@alfresco/aca-testing-shared';
import { DocumentListPage } from '@alfresco/adf-testing';

describe('Single click on item name', () => {
  const username = `user-${Utils.random()}`;

  const file1 = `file1-${Utils.random()}.txt`;
  let file1Id: string;
  const folder1 = `folder1-${Utils.random()}`;
  let folder1Id: string;

  const deletedFile1 = `file1-${Utils.random()}.txt`;
  let deletedFile1Id: string;
  const deletedFolder1 = `folder1-${Utils.random()}`;
  let deletedFolder1Id: string;

  const siteName = `site-${Utils.random()}`;
  const fileSite = `fileSite-${Utils.random()}.txt`;

  const apis = {
    admin: new RepoClient(),
    user: new RepoClient(username, username)
  };

  const loginPage = new LoginPage();
  const page = new BrowsingPage();
  const { breadcrumb } = page;
  const viewer = new Viewer();
  const { searchInput } = page.header;
  const documentListPage = new ACADocumentListPage();

  beforeAll(async (done) => {
    await apis.admin.people.createUser({ username });
    file1Id = (await apis.user.nodes.createFile(file1)).entry.id;
    folder1Id = (await apis.user.nodes.createFolder(folder1)).entry.id;

    deletedFile1Id = (await apis.user.nodes.createFile(deletedFile1)).entry.id;
    deletedFolder1Id = (await apis.user.nodes.createFolder(deletedFolder1)).entry.id;
    await apis.user.nodes.deleteNodeById(deletedFile1Id, false);
    await apis.user.nodes.deleteNodeById(deletedFolder1Id, false);

    await apis.user.sites.createSite(siteName);
    const docLibId = await apis.user.sites.getDocLibId(siteName);
    await apis.user.nodes.createFile(fileSite, docLibId);

    await apis.user.shared.shareFileById(file1Id);
    await apis.user.shared.waitForApi({ expect: 1 });

    await apis.user.favorites.addFavoriteById('file', file1Id);
    await apis.user.favorites.addFavoriteById('folder', folder1Id);
    await apis.user.favorites.waitForApi({ expect: 2 + 1 });

    await loginPage.loginWith(username);
    done();
  });

  afterAll(async (done) => {
    await apis.user.sites.deleteSite(siteName);
    await apis.user.nodes.deleteNodeById(folder1Id);
    await apis.user.nodes.deleteNodeById(file1Id);
    await apis.user.trashcan.emptyTrash();
    done();
  });

  it('[C284899] Hyperlink does not appear for items in the Trash', async () => {
    await page.clickTrashAndWait();

    expect(await documentListPage.dataTable.getFileHyperlink(deletedFile1).isPresent()).toBe(false, 'Link on name is present');
    expect(await documentListPage.dataTable.getFileHyperlink(deletedFolder1).isPresent()).toBe(false, 'Link on name is present');
  });

  describe('on Personal Files', () => {
    beforeEach(async (done) => {
      await page.clickPersonalFilesAndWait();
      done();
    });

    it('[C280032] Hyperlink appears when mouse over a file/folder', async () => {
      expect(await documentListPage.dataTable.getFileHyperlink(file1).isPresent()).toBe(true, 'Link on name is missing');
    });

    it('[C280033] File preview opens when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(file1);

      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      await Utils.pressEscape();
    });

    it('[C280034] Navigate inside the folder when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(folder1);

      expect(await breadcrumb.currentItem.getText()).toBe(folder1);
    });
  });

  describe('on File Libraries', () => {
    beforeEach(async (done) => {
      await page.clickFileLibrariesAndWait();
      done();
    });

    it('[C284901] Hyperlink appears when mouse over a library', async () => {
      expect(await documentListPage.dataTable.getFileHyperlink(siteName).isPresent()).toBe(true, 'Link on site name is missing');
    });

    it('[C284902] Navigate inside the library when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(siteName);

      expect(await breadcrumb.currentItem.getText()).toBe(siteName);
      expect(await documentListPage.dataTable.getFileHyperlink(fileSite).isPresent()).toBe(true, `${fileSite} not displayed`);
    });
  });

  describe('on Shared Files', () => {
    beforeEach(async (done) => {
      await page.clickSharedFilesAndWait();
      done();
    });

    it('[C284905] Hyperlink appears when mouse over a file', async () => {
      expect(await documentListPage.dataTable.getFileHyperlink(file1).isPresent()).toBe(true, 'Link on name is missing');
    });

    it('[C284906] File preview opens when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(file1);

      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      await Utils.pressEscape();
    });
  });

  describe('on Recent Files', () => {
    beforeEach(async (done) => {
      await page.clickRecentFilesAndWait();
      done();
    });

    it('[C284907] Hyperlink appears when mouse over a file', async () => {
      expect(await documentListPage.dataTable.getFileHyperlink(file1).isPresent()).toBe(true, 'Link on name is missing');
    });

    it('[C284908] File preview opens when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(file1);

      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      await Utils.pressEscape();
    });
  });

  describe('on Favorites', () => {
    beforeEach(async (done) => {
      await page.clickFavoritesAndWait();
      done();
    });

    it('[C284909] Hyperlink appears when mouse over a file/folder', async () => {
      expect(await documentListPage.dataTable.getFileHyperlink(file1).isPresent()).toBe(true, 'Link on name is missing');
    });

    it('[C284910] File preview opens when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(file1);

      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      await Utils.pressEscape();
    });

    it('[C284911] Navigate inside the folder when clicking the hyperlink', async () => {
      await documentListPage.clickNameLink(folder1);

      expect(await breadcrumb.currentItem.getText()).toBe(folder1);
    });
  });

  describe('on Search Results', () => {
    beforeEach(async (done) => {
      await searchInput.clickSearchButton();
      await searchInput.checkFilesAndFolders();
      done();
    });

    afterEach(async (done) => {
      await Utils.pressEscape();
      await page.clickPersonalFilesAndWait();
      done();
    });

    it('[C306988] Hyperlink appears when mouse over a file', async () => {
      await searchInput.searchFor(file1);
      await documentListPage.dataTable.waitForTableBody();

      expect(await dataTable.hasLinkOnSearchResultName(file1)).toBe(true, 'Link on name is missing');
    });

    it('[C306989] File preview opens when clicking the hyperlink', async () => {
      await searchInput.searchFor(file1);
      await documentListPage.dataTable.waitForTableBody();
      await dataTable.clickSearchResultNameLink(file1);

      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      await Utils.pressEscape();
    });

    it('[C306990] Navigate inside the folder when clicking the hyperlink', async () => {
      await searchInput.searchFor(folder1);
      await documentListPage.dataTable.waitForTableBody();
      await dataTable.clickSearchResultNameLink(folder1);

      expect(await breadcrumb.currentItem.getText()).toBe(folder1);
    });
  });
});
